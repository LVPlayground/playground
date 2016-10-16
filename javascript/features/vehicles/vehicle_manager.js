// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DatabaseVehicle = require('features/vehicles/database_vehicle.js');
const MockVehicleDatabase = require('features/vehicles/test/mock_vehicle_database.js');
const VehicleAccessManager = require('features/vehicles/vehicle_access_manager.js');
const VehicleDatabase = require('features/vehicles/vehicle_database.js');

// The maximum value that can be given to a vehicle's color.
const MaximumVehicleColorValue = 255;

// The vehicle manager is responsible for all vehicles created as part of the Vehicles feature. This
// is not to be confused with the global VehicleManager for the entire JavaScript gamemode.
class VehicleManager {
    constructor(streamer) {
        this.access_ = new VehicleAccessManager(streamer);
        this.database_ = server.isTest() ? new MockVehicleDatabase()
                                         : new VehicleDatabase();

        this.dataLoadedPromise_ = new Promise(resolver =>
            this.dataLoadedResolver_ = resolver);

        // Function tells the Pawn code that |vehicle| has been destroyed. Will be overridden by
        // tests to prevent accidentially hitting the Pawn code.
        this.reportVehicleDestroyed_ = vehicle =>
            !!pawnInvoke('OnJavaScriptVehicleDestroyed', 'i', vehicle.id);

        // Set of all DatabaseVehicle instances owned by this VehicleManager.
        this.vehicles_ = new Set();

        // Map of Player instances to a set of their associated vehicles, and DatabaseVehicle
        // instances to the Player they've been associated with.
        this.associatedVehicles_ = new WeakMap();
        this.associatedPlayers_ = new Map();

        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(
            this, VehicleManager.prototype.onStreamerReload.bind(this));
    }

    // Gets the vehicle access manager, determining whether a player can enter a particular vehicle.
    get access() { return this.access_; }

    // Gets the number of vehicles that have been created by the manager.
    get count() { return this.vehicles_.size; }

    // Gets a promise that is to be resolved when the feature is ready.
    get ready() { return this.dataLoadedPromise_; }

    // Gets the active vehicle streamer. Should not be cached.
    get streamer() { return this.streamer_().getVehicleStreamer(); }

    // Gets an iterator with access to all DatabaseVehicle instances.
    get vehicles() { return this.vehicles_.values(); }

    // ---------------------------------------------------------------------------------------------

    // Returns the DatabaseVehicle instance for |vehicle| when it's managed. May return NULL.
    getManagedDatabaseVehicle(vehicle) {
        const storedVehicle = this.streamer.getStoredVehicle(vehicle);
        if (storedVehicle && storedVehicle instanceof DatabaseVehicle)
            return storedVehicle;

        return null;
    }

    // ---------------------------------------------------------------------------------------------

    // Asynchronously loads the vehicles from the database, and creates them on the server using the
    // streamer. Will display warnings for invalid vehicle definitions.
    async loadVehicles() {
        for (const vehicleInfo of await this.database_.loadVehicles()) {
            const databaseVehicle = new DatabaseVehicle(vehicleInfo);

            this.enforceVehicleAccess(databaseVehicle, false /* sync */);
            this.internalCreateVehicle(databaseVehicle, true /* lazy */);
        }

        this.dataLoadedResolver_();
    }

    // Creates a vehicle with |modelId| at given location. It will be eagerly created by the
    // streamer if any player is within streaming range of the vehicle.
    createVehicle({ player = null, modelId, position, rotation, interiorId, virtualWorld }) {
        const databaseVehicle = new DatabaseVehicle({
            databaseId: null /* non-persistent vehicle */,

            accessType: DatabaseVehicle.ACCESS_TYPE_EVERYONE,
            accessValue: 0 /* unused for ACCESS_TYPE_EVERYONE */,

            // Include the arguments as passed to this method.
            modelId, position, rotation, interiorId, virtualWorld,

            // Automatically assign a random, but fixed color to the vehicle.
            primaryColor: Math.floor(Math.random() * MaximumVehicleColorValue),
            secondaryColor: Math.floor(Math.random() * MaximumVehicleColorValue),

            // Personalize the vehicle's number plate when |player| is set.
            numberPlate: player ? player.name : null,

            // Make the VehicleAccessManager the authority on whether a player can access it.
            deathFn: VehicleManager.prototype.onVehicleDeath.bind(this),
            accessFn: this.access_.accessFn
        });

        // Associate the vehicle with the |player| when set.
        if (player) {
            this.associatedPlayers_.set(databaseVehicle, player);

            if (!this.associatedVehicles_.has(player))
                this.associatedVehicles_.set(player, new Set());

            const associatedVehicles = this.associatedVehicles_.get(player);
            const deletionList = [];

            // Respawn the oldest unoccupied vehicle created by the |player| when they exceed their
            // vehicle limit. This means it's possible to exceed their limit.
            const limit = this.getVehicleLimitForPlayer(player);
            let count = associatedVehicles.size;

            for (const existingVehicle of associatedVehicles) {
                if (count < limit)
                    break;  // no need to free up another vehicle

                const liveVehicle = this.streamer.getLiveVehicle(existingVehicle);
                if (liveVehicle && liveVehicle.isOccupied())
                    continue;  // the vehicle is occupied, ignore it

                deletionList.push(existingVehicle);
                count--;
            }

            deletionList.forEach(existingVehicle =>
                this.internalDeleteVehicle(existingVehicle));

            // Now associate the |databaseVehicle| with the |player|.
            associatedVehicles.add(databaseVehicle);
        }

        this.internalCreateVehicle(databaseVehicle, false /* lazy */);

        return this.streamer.getLiveVehicle(databaseVehicle);
    }

    // Returns whether the |vehicle| is one managed by the VehicleManager. This will only return
    // TRUE when the vehicle is stored by the streamer, and managed by us.
    isManagedVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        return databaseVehicle && databaseVehicle instanceof DatabaseVehicle;
    }

    // Returns whether the |vehicle| is a persistent vehicle managed by the VehicleManager.
    isPersistentVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle || !(databaseVehicle instanceof DatabaseVehicle))
            return false;

        return databaseVehicle.isPersistent();
    }

    // Updates the |vehicle|'s |accessType| and |accessValue| in all places where it's stored.
    async updateVehicleAccess(vehicle, accessType, accessValue) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle || !(databaseVehicle instanceof DatabaseVehicle))
            throw new Error('The given |vehicle| is not managed by the vehicle manager.');

        databaseVehicle.accessType = accessType;
        databaseVehicle.accessValue = accessValue;

        this.enforceVehicleAccess(databaseVehicle);

        await this.database_.updateVehicleAccess(databaseVehicle);
    }

    // Respawns the |vehicle|. If the vehicle is a managed vehicle, the access settings for the
    // vehicle will be reset prior to the actual respawn.
    respawnVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (databaseVehicle && databaseVehicle instanceof DatabaseVehicle)
            this.enforceVehicleAccess(databaseVehicle, false /* sync */);

        while (vehicle) {
            const trailer = vehicle.trailer;

            vehicle.respawn();
            vehicle = trailer;
        }

        // Delete the |vehicle| if it wasn't a persistent vehicle.
        if (!databaseVehicle.isPersistent())
            this.internalDeleteVehicle(databaseVehicle);
    }

    // Stores the |vehicle| in the database. If it's a persistent vehicle already, the existing
    // vehicle will be updated. Otherwise it will be stored as a new persistent vehicle.
    async storeVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle || !(databaseVehicle instanceof DatabaseVehicle))
            throw new Error('The given |vehicle| is not managed by the vehicle manager.');

        const occupants = new Map();

        // Store the occupants of the |vehicle| so that we can teleport them back.
        for (const player of vehicle.getOccupants()) {
            occupants.set(player, player.vehicleSeat);

            // Teleport the player out of the vehicle. This will prevent them from showing up as
            // hidden later on: https://wiki.sa-mp.com/wiki/PutPlayerInVehicle.
            player.position = vehicle.position.translate({ z: 2 });
        }

        // Create the new vehicle with the appropriate settings based on the available data.
        const newVehicle = new DatabaseVehicle({
            databaseId: databaseVehicle.databaseId,  // may be NULL

            accessType: databaseVehicle.accessType,
            accessValue: databaseVehicle.accessValue,

            modelId: vehicle.modelId,
            position: vehicle.position,
            rotation: vehicle.rotation,
            interiorId: vehicle.interiorId,
            virtualWorld: vehicle.virtualWorld,

            primaryColor: vehicle.primaryColor,
            secondaryColor: vehicle.secondaryColor,
            paintjob: vehicle.paintjob,
            siren: vehicle.siren,

            respawnDelay: databaseVehicle.respawnDelay,

            // Make the VehicleAccessManager the authority on whether a player can access it.
            deathFn: VehicleManager.prototype.onVehicleDeath.bind(this),
            accessFn: this.access_.accessFn
        });

        // Delete the existing vehicle from the streamer immediately.
        this.internalDeleteVehicle(databaseVehicle);

        // Set the vehicle access policies before the vehicle gets spawned.
        this.enforceVehicleAccess(newVehicle, false /* sync */);

        // Create the new vehicle with the streamer immediately. It may still have the invalid
        // databaseId property assigned if this is the first time we're creating it.
        this.internalCreateVehicle(newVehicle);

        // Put all the |occupants| back in the vehicle after a short wait.
        milliseconds(100).then(() => {
            if (!this.vehicles_.has(newVehicle))
                return;  // the |newVehicle| has been removed since

            const liveVehicle = this.streamer.getLiveVehicle(newVehicle);
            if (!liveVehicle)
                return;  // the |newVehicle| has not been created by the streamer

            for (const [player, seat] of occupants) {
                if (!player.isConnected())
                    continue;  // the |player| has since disconnected

                player.enterVehicle(liveVehicle, seat);
            }
        });

        // Either create or update the |newVehicle|'s properties in the database.
        if (newVehicle.isPersistent())
            await this.database_.updateVehicle(newVehicle);
        else
            await this.database_.createVehicle(newVehicle);

        return this.streamer.getLiveVehicle(newVehicle);
    }

    // Asynchronously deletes the |vehicle|. It will be immediately removed from the streamer, but
    // will be asynchronously deleted from the database if it's persistent.
    async deleteVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle || !(databaseVehicle instanceof DatabaseVehicle))
            throw new Error('The given |vehicle| is not managed by the vehicle manager.');

        this.internalDeleteVehicle(databaseVehicle);

        if (databaseVehicle.isPersistent())
            await this.database_.deleteVehicle(databaseVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Pins the |vehicle| in the streamer. Returns whether the |vehicle| is managed and could be
    // pinned, even when it already was pinned.
    pinVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle)
            return false;

        if (!this.streamer.isPinned(databaseVehicle, VehicleManager.MANAGEMENT_PIN))
            this.streamer.pin(databaseVehicle, VehicleManager.MANAGEMENT_PIN);

        return true;
    }

    // Unpins the |vehicle| from the streamer. Returns whether the |vehicle| is managed.
    unpinVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle)
            return false;

        if (this.streamer.isPinned(databaseVehicle, VehicleManager.MANAGEMENT_PIN))
            this.streamer.unpin(databaseVehicle, VehicleManager.MANAGEMENT_PIN);

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the maximum number of ephemeral vehicles to be created for |player|.
    getVehicleLimitForPlayer(player) {
        if (player.isManagement())
            return 10;

        if (player.isAdministrator())
            return 5;

        return 1;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a vehicle managed by this VehicleManager is about to respawn. Deletes ephemeral
    // vehicles from the server before their respawn is complete.
    onVehicleDeath(vehicle, databaseVehicle) {
        if (this.associatedPlayers_.has(databaseVehicle)) {
            this.internalDeleteVehicle(databaseVehicle);
            return;
        }

        this.enforceVehicleAccess(databaseVehicle, false /* sync */);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the streamer has been reloaded. Will recreate all our vehicles.
    onStreamerReload(streamer) {
        const vehicleStreamer = streamer.getVehicleStreamer();

        for (const databaseVehicle of this.vehicles_)
            vehicleStreamer.add(databaseVehicle, true /* lazy */);

        vehicleStreamer.optimise();
    }

    // Creates the |databaseVehicle| in the vehicle streamer. The vehicle will be created lazily
    // when the |lazy| flag has been set, which means it won't automatically be streamed in.
    internalCreateVehicle(databaseVehicle, lazy) {
        this.vehicles_.add(databaseVehicle)
        this.streamer_().getVehicleStreamer().add(databaseVehicle, lazy);
    }

    // Deletes the |databaseVehicle| from the vehicle streamer.
    internalDeleteVehicle(databaseVehicle) {
        const vehicle = this.streamer.getLiveVehicle(databaseVehicle);
        if (vehicle) {
            const vehicleId = vehicle.id;

            Promise.resolve().then(() =>
                this.reportVehicleDestroyed_(vehicleId));
        }

        this.streamer_().getVehicleStreamer().delete(databaseVehicle);

        const associatedPlayer = this.associatedPlayers_.get(databaseVehicle);
        if (associatedPlayer) {
            this.associatedPlayers_.delete(databaseVehicle);

            const associatedVehicles = this.associatedVehicles_.get(associatedPlayer);
            if (associatedVehicles)
                associatedVehicles.delete(associatedPlayer);
        }

        this.access_.delete(databaseVehicle);
        this.vehicles_.delete(databaseVehicle);
    }

    // Enforces the access rules for the |databaseVehicle| with the Vehicle Access manager.
    enforceVehicleAccess(databaseVehicle, sync = true) {
        switch (databaseVehicle.accessType) {
            case DatabaseVehicle.ACCESS_TYPE_EVERYONE:
                if (sync)
                    this.access_.unlock(databaseVehicle);
                else
                    this.access_.delete(databaseVehicle);
                break;
            case DatabaseVehicle.ACCESS_TYPE_PLAYER:
                this.access_.restrictToPlayer(databaseVehicle, databaseVehicle.accessValue, sync);
                break;
            case DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL:
                this.access_.restrictToPlayerLevel(
                    databaseVehicle, databaseVehicle.accessValue, sync);
                break;
            case DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP:
                this.access_.restrictToVip(databaseVehicle, sync);
                break;
            default:
                console.log('Warning: invalid access type given for vehicle ' +
                            databaseVehicle.id + ': ' + databaseVehicle.accessType);
                break;
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const databaseVehicle of this.vehicles_)
            this.internalDeleteVehicle(databaseVehicle);

        this.streamer_.removeReloadObserver(this);
        this.streamer_ = null;

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.database_ = null;
    }
}

// Pin that will be used to keep vehicles alive by order of Management.
VehicleManager.MANAGEMENT_PIN = Symbol();

exports = VehicleManager;
