// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockVehicleDatabase from 'features/vehicles/test/mock_vehicle_database.js';
import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import VehicleDatabase from 'features/vehicles/vehicle_database.js';

// The vehicle manager is responsible for all vehicles created as part of the Vehicles feature. This
// is not to be confused with the global VehicleManager for the entire JavaScript gamemode.
class VehicleManager {
    // Types of vehicles managed by the VehicleManager.
    static kTypePersistent = 0;
    static kTypeEphemeral = 1;

    database_ = null;
    streamer_ = null;

    playerVehicles_ = null;
    vehicles_ = null;

    constructor(settings, streamer) {
        this.settings_ = settings;
        this.database_ = server.isTest() ? new MockVehicleDatabase()
                                         : new VehicleDatabase();

        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(
            this, VehicleManager.prototype.onStreamerReload.bind(this));
        
        // Weak map from Player instance to Set of StreamableVehicle instances.
        this.playerVehicles_ = new WeakMap();

        // Set of the ephemeral vehicles created on the server. Unattributed.
        this.ephemeralVehicles_ = new Set();

        // Map from PersistentVehicleInfo to StreamableVehicle instances.
        this.vehicles_ = new Map();

        // Only load the vehicles when not running tests. There are tests covering this case which
        // manually load the vehicles, which is something they want to wait for.
        if (!server.isTest())
            this.loadVehicles();
    }

    // Gets the default respawn delay for vehicles, in seconds. This is configurable through the
    // "/lvp settings" command, but changes only apply to newly created vehicles.
    get persistentVehicleRespawnDelay() {
        return this.settings_().getValue('vehicles/respawn_persistent_delay_sec');
    }

    // Gets the number of vehicles that have been created on the server.
    get size() { return this.vehicles_.size; }

    // ---------------------------------------------------------------------------------------------

    // Asynchronously loads the vehicles from the database, and creates them using the streamer. The
    // streamer will be asked to optimise the plane after this has completed.
    async loadVehicles() {
        const vehicles = await this.database_.loadVehicles();
        for (const vehicleInfo of vehicles) {
            const streamableVehicleInfo =
                vehicleInfo.toStreamableVehicleInfo(this.persistentVehicleRespawnDelay);

            // Create the |vehicleInfo| on the Streamer, and store a reference locally. This further
            // is able to tell us whether the given vehicle is live.
            const streamableVehicle = this.streamer_().createVehicle(streamableVehicleInfo);

            this.vehicles_.set(vehicleInfo, streamableVehicle);
        }

        // Optimise the streamer, now that many mutations in the available vehicles have been made.
        this.streamer_().optimise();
    }

    // Creates a new ephemeral vehicle for the |player|. Players are only allowed a single vehicle
    // of their own, but administrators are allowed multiple when the setting allows for this.
    createVehicle(player, modelId) {
        if (!this.playerVehicles_.has(player))
            this.playerVehicles_.set(player, new Set());

        let playerVehicles = this.playerVehicles_.get(player);
        let playerVehicleLimit = this.getVehicleLimitForPlayer(player);

        // If the |player| is not allowed to spawn any vehicles at all, bail out immediately.
        if (!playerVehicleLimit)
            return null;

        // First prune all entries from the |playerVehicles| that aren't live anymore.
        for (const streamableVehicle of playerVehicles) {
            if (!streamableVehicle.live)
                playerVehicles.delete(streamableVehicle);
        }

        // Delete vehicles from the |playerVehicles| until the player is no longer above the limit,
        // while ignoring vehicles that are currently in use by others.
        for (const streamableVehicle of playerVehicles) {
            if (playerVehicles.size < playerVehicleLimit)
                break;  // no more vehicles have to be removed

            if (streamableVehicle.live.occupantCount)
                continue;  // the vehicle is being used by other players.

            this.streamer_().deleteVehicle(streamableVehicle);

            playerVehicles.delete(streamableVehicle);
        }

        // Now create the new vehicle, and spawn that in the world immediately.
        const streamableVehicleInfo = new StreamableVehicleInfo({
            modelId,

            position: player.position,
            rotation: player.rotation,

            numberPlate: player.name
        });

        const streamableVehicle =
            this.streamer_().createVehicle(streamableVehicleInfo, /* immediate= */ true);

        // (1) Store the |streamableVehicle| in storage specific to the player.
        playerVehicles.add(streamableVehicle);

        // (2) Store the |streamableVehicle| in storage global to the server.
        this.ephemeralVehicles_.add(streamableVehicle);
        this.ephemeralVehiclesPruneList();

        return streamableVehicle;
    }

    // Asynchronously deletes the |vehicle|. It will be immediately removed from the streamer, but
    // will be asynchronously deleted from the database if it's persistent.
    async deleteVehicle(vehicle) {
        const result = this.findStreamableVehicle(vehicle);
        if (!result)
            throw new Error(`Unable to delete vehicles not managed by the Vehicle Manager.`);
        
        const streamableVehicle = result.streamableVehicle;

        // Delete the |streamableVehicle| from the manager.
        this.streamer_().deleteVehicle(streamableVehicle);

        // Bail out if |vehicle| was ephemeral, it's been invalidated and will be cleaned up later.
        if (result.type === VehicleManager.kTypeEphemeral)
            return;

        const persistentVehicleInfo = result.persistentVehicleInfo;

        // (1) Delete the |persistentVehicleInfo| from the internal status.
        this.vehicles_.delete(persistentVehicleInfo);

        // (2) Delete the |persistentVehicleInfo| from the database.
        await this.database_.deleteVehicle(persistentVehicleInfo.vehicleId);
    }

    // Determines the maximum number of vehicles that the |player| is allowed to create on the
    // server. Administrators have a business reason to be able to create multiple, e.g. when they
    // host an event or are working on the server's vehicle layout.
    getVehicleLimitForPlayer(player) {
        if (player.isAdministrator())
            return this.settings_().getValue('vehicles/vehicle_limit_administrator');
        
        return this.settings_().getValue('vehicles/vehicle_limit_player');
    }

    // ---------------------------------------------------------------------------------------------

    // Finds the StreamableVehicle instance for the given |vehicle|, which must be a Vehicle object,
    // together with whether this is a persistent or an ephemeral vehicle. This operation is O(n+k)
    // on the number of persistent and ephemeral vehicles on the server, but is really infrequent
    // and does not need to leave the JavaScript context.
    findStreamableVehicle(vehicle) {
        for (const [ persistentVehicleInfo, streamableVehicle ] of this.vehicles_) {
            if (streamableVehicle.live !== vehicle)
                continue;

            return {
                persistentVehicleInfo,
                streamableVehicle,
                type: VehicleManager.kTypePersistent
            };
        }

        for (const streamableVehicle of this.ephemeralVehicles_) {
            if (streamableVehicle.live === vehicle)
                return { streamableVehicle, type: VehicleManager.kTypeEphemeral };
        }

        return null;
    }

    // Returns whether the |vehicle| is one managed by the VehicleManager.
    isManagedVehicle(vehicle) { return this.findStreamableVehicle(vehicle) !== null; }

    // Returns whether the |vehicle| is a persistent vehicle managed by the VehicleManager.
    isPersistentVehicle(vehicle) {
        const result = this.findStreamableVehicle(vehicle);
        return result && result.type === VehicleManager.kTypePersistent;
    }

    // Prunes the set of ephemeral vehicles that exists on the server, by removing all the entries
    // which do not map to live vehicles anymore. They will no longer be considered.
    ephemeralVehiclesPruneList() {
        for (const streamableVehicle of this.ephemeralVehicles_) {
            if (!streamableVehicle.live)
                this.ephemeralVehicles_.delete(streamableVehicle);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Stores the |vehicle| in the database. If it's a persistent vehicle already, the existing
    // vehicle will be updated. Otherwise it will be stored as a new persistent vehicle.
    async storeVehicle(vehicle) {
        const result = this.findStreamableVehicle(vehicle);
        if (!result)
            throw new Error(`Unable to store vehicles not managed by the Vehicle Manager.`);

        // Compose the new settings for the |vehicle|. These will be used both for updating vehicles
        // and for creating new ones, just in a subtly different way.
        const vehicleSettings = {
            modelId: vehicle.modelId,

            position: vehicle.position,
            rotation: vehicle.rotation,

            paintjob: vehicle.paintjob,
            primaryColor: vehicle.primaryColor,
            secondaryColor: vehicle.secondaryColor,
            numberPlate: vehicle.numberPlate,
            components: [],
        };

        // Store the current occupants of the vehicle. They will be teleported back in after.
        const occupants = new Map();

        for (const player of vehicle.getOccupants()) {
            occupants.set(player, player.vehicleSeat);

            // Teleport the player out of the vehicle. This will prevent them from showing up as
            // hidden later on: https://wiki.sa-mp.com/wiki/PutPlayerInVehicle.
            player.position = vehicle.position.translate({ z: 2 });
        }

        // Delete the |streamableVehicle| right now, regardless of its type.
        this.streamer_().deleteVehicle(result.streamableVehicle);

        let persistentVehicleInfo = null;

        // If the |vehicle| was a persistent vehicle, update it. Otherwise, create it. This will
        // give us a new PersistentVehicleInfo object to represent the vehicle with.
        if (result.type === VehicleManager.kTypeEphemeral) {
            persistentVehicleInfo = await this.database_.createVehicle(vehicleSettings);
        } else {
            persistentVehicleInfo = await this.database_.updateVehicle(
                vehicleSettings, result.persistentVehicleInfo);

            // Further remove the existing vehicle from the local vehicle cache.
            this.vehicles_.delete(result.persistentVehicleInfo);
        }

        const streamableVehicleInfo =
            persistentVehicleInfo.toStreamableVehicleInfo(this.persistentVehicleRespawnDelay);

        const streamableVehicle = this.streamer_().createVehicle(
            streamableVehicleInfo, /* immediate= */ true);

        // Store the updated |streamableVehicle| in the local vehicle cache.
        this.vehicles_.set(persistentVehicleInfo, streamableVehicle);

        // Now that the vehicle exists again, wait a little bit of time and then teleport all the
        // |occupants| who were in the vehicle, back into the vehicle.
        wait(100).then(() => {
            if (!streamableVehicle || !streamableVehicle.live)
                return;  // the vehicle has been removed since
            
            for (const [ player, seat ] of occupants) {
                if (player.isConnected())
                    player.enterVehicle(streamableVehicle.live, seat);
            }
        });

        return streamableVehicle;
    }

    // ---------------------------------------------------------------------------------------------

    // Respawns the |vehicle|. If the vehicle is a managed vehicle, the access settings for the
    // vehicle will be reset prior to the actual respawn.
    respawnVehicle(vehicle) {
        const result = this.findStreamableVehicle(vehicle);

        while (vehicle) {
            const trailer = vehicle.trailer;

            vehicle.respawn();
            vehicle = trailer;
        }

        // If the |vehicle| was an ephemeral vehicle, delete it from the server.
        if (result && result.type === VehicleManager.kTypeEphemeral)
            this.streamer_().deleteVehicle(result.streamableVehicle);
    }

    // Respawns all unoccupied vehicles owned by the Vehicle Manager. This is quite a heavy task,
    // both for the server and for all players for whom vehicles will be changing.
    respawnUnoccupiedVehicles() {
        for (const streamableVehicle of this.ephemeralVehicles_) {
            if (streamableVehicle.live && !streamableVehicle.live.occupantCount)
                this.streamer_().deleteVehicle(streamableVehicle);
        }

        this.ephemeralVehiclesPruneList();

        for (const streamableVehicle of this.vehicles_.values()) {
            if (streamableVehicle.live && !streamableVehicle.live.occupantCount)
                streamableVehicle.live.respawn();
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the streamer has been reloaded. Will reload all vehicles from the database, and
    // re-adds them to the streamer. This is quite an involved operation.
    onStreamerReload(streamer) {
        this.vehicles_.clear();
        this.loadVehicles();
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const streamableVehicle of this.vehicles_.values())
            this.streamer_().deleteVehicle(streamableVehicle);
        
        for (const streamableVehicle of this.ephemeralVehicles_)
            this.streamer_().deleteVehicle(streamableVehicle);

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.ephemeralVehicles_.clear();
        this.ephemeralVehicles_ = null;

        this.streamer_.removeReloadObserver(this);
        this.streamer_ = null;

        this.database_ = null;
    }
}

export default VehicleManager;
