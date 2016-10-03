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

        this.vehicles_ = new Set();

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

    // Asynchronously loads the vehicles from the database, and creates them on the server using the
    // streamer. Will display warnings for invalid vehicle definitions.
    async loadVehicles() {
        for (const vehicleInfo of await this.database_.loadVehicles())
            this.internalCreateVehicle(new DatabaseVehicle(vehicleInfo), true /* lazy */);

        this.dataLoadedResolver_();
    }

    // Creates a vehicle with |modelId| at given location. It will be eagerly created by the
    // streamer if any player is within streaming range of the vehicle.
    createVehicle({ modelId, position, rotation, interiorId, virtualWorld }) {
        const databaseVehicle = new DatabaseVehicle({
            databaseId: null /* non-persistent vehicle */,

            // Include the arguments as passed to this method.
            modelId, position, rotation, interiorId, virtualWorld,

            // Automatically assign a random, but fixed color to the vehicle.
            primaryColor: Math.floor(Math.random() * MaximumVehicleColorValue),
            secondaryColor: Math.floor(Math.random() * MaximumVehicleColorValue),

            // Make the VehicleAccessManager the authority on whether a player can access it.
            accessFn: this.access_.accessFn
        });

        this.internalCreateVehicle(databaseVehicle, false /* lazy */);

        return this.streamer.getLiveVehicle(databaseVehicle);
    }

    // Returns whether the |vehicle| is one managed by the VehicleManager.
    isManagedVehicle(vehicle) {
        return this.streamer.getStoredVehicle(vehicle) !== null;
    }

    // Returns whether the |vehicle| is a persistent vehicle managed by the VehicleManager.
    isPersistentVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle)
            return false;

        return databaseVehicle.isPersistent();
    }

    // Stores the |vehicle| in the database. If it's a persistent vehicle already, the existing
    // vehicle will be updated. Otherwise it will be stored as a new persistent vehicle.
    async storeVehicle(vehicle) {
        const databaseVehicle = this.streamer.getStoredVehicle(vehicle);
        if (!databaseVehicle)
            throw new Error('The given |vehicle| is not managed by the vehicle manager.');

        const occupants = new Map();

        // Store the occupants of the |vehicle| so that we can teleport them back.
        for (const player of vehicle.getOccupants()) {
            occupants.set(player, player.vehicleSeat);

            // Teleport the player out of the vehicle. This will prevent them from showing up as
            // hidden later on: https://wiki.sa-mp.com/wiki/PutPlayerInVehicle.
            player.position = vehicle.position.translate({ z: 2 });
        }

        // Delete the existing vehicle from the streamer immediately.
        this.internalDeleteVehicle(databaseVehicle);

        // Create the new vehicle with the appropriate settings based on the available data.
        const newVehicle = new DatabaseVehicle({
            databaseId: databaseVehicle.databaseId,  // may be NULL

            modelId: vehicle.modelId,
            position: vehicle.position,
            interiorId: vehicle.interiorId,
            virtualWorld: vehicle.virtualWorld,

            primaryColor: vehicle.primaryColor,
            secondaryColor: vehicle.secondaryColor,
            paintjob: vehicle.paintjob,
            siren: vehicle.siren,

            respawnDelay: databaseVehicle.respawnDelay
        });

        // Create the new vehicle with the streamer immediately. It may still have the invalid
        // databaseId property assigned if this is the first time we're creating it.
        this.internalCreateVehicle(newVehicle);

        // Put all the |occupants| back in the vehicle after a short wait.
        milliseconds(500).then(() => {
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
        if (!databaseVehicle)
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
        this.streamer_().getVehicleStreamer().delete(databaseVehicle);

        this.access_.delete(databaseVehicle);
        this.vehicles_.delete(databaseVehicle);
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
