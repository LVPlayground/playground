// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockVehicleDatabase from 'features/vehicles/test/mock_vehicle_database.js';
import VehicleDatabase from 'features/vehicles/vehicle_database.js';

// The vehicle manager is responsible for all vehicles created as part of the Vehicles feature. This
// is not to be confused with the global VehicleManager for the entire JavaScript gamemode.
class VehicleManager {
    database_ = null;
    streamer_ = null;

    vehicles_ = null;

    constructor(settings, streamer) {
        this.settings_ = settings;
        this.database_ = server.isTest() ? new MockVehicleDatabase()
                                         : new VehicleDatabase();

        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(
            this, VehicleManager.prototype.onStreamerReload.bind(this));
        
        // Map from PersistentVehicleInfo to StreamableVehicle instances.
        this.vehicles_ = new Map();

        // Only load the vehicles when not running tests. There are tests covering this case which
        // manually load the vehicles, which is something they want to wait for.
        if (!server.isTest())
            this.loadVehicles();
    }

    // Gets the default respawn delay for vehicles, in seconds.
    get defaultRespawnDelay() { return this.settings_().getValue('vehicles/respawn_delay_sec'); }

    // Gets the number of vehicles that have been created on the server.
    get size() { return this.vehicles_.size; }

    // ---------------------------------------------------------------------------------------------

    // Asynchronously loads the vehicles from the database, and creates them using the streamer. The
    // streamer will be asked to optimise the plane after this has completed.
    async loadVehicles() {
        const vehicles = await this.database_.loadVehicles();
        for (const vehicleInfo of vehicles) {
            const streamableVehicleInfo =
                vehicleInfo.toStreamableVehicleInfo(this.defaultRespawnDelay);

            // Create the |vehicleInfo| on the Streamer, and store a reference locally. This further
            // is able to tell us whether the given vehicle is live.
            const streamableVehicle = this.streamer_().createVehicle(streamableVehicleInfo);

            this.vehicles_.set(vehicleInfo, streamableVehicle);
        }

        // Optimise the streamer, now that many mutations in the available vehicles have been made.
        this.streamer_().optimise();
    }

    // Creates a vehicle with |modelId| at given location. It will be eagerly created by the
    // streamer if any player is within streaming range of the vehicle.
    createVehicle({ player = null, modelId, position, rotation, interiorId, virtualWorld }) {}

    // Returns whether the |vehicle| is one managed by the VehicleManager. This will only return
    // TRUE when the vehicle is stored by the streamer, and managed by us.
    isManagedVehicle(vehicle) { return false; }

    // Returns whether the |vehicle| is a persistent vehicle managed by the VehicleManager.
    isPersistentVehicle(vehicle) { return false; }

    // Respawns the |vehicle|. If the vehicle is a managed vehicle, the access settings for the
    // vehicle will be reset prior to the actual respawn.
    respawnVehicle(vehicle) {
        // Remove the trailers
        // Respawning ephemeral vehicles should delete them
    }

    // Stores the |vehicle| in the database. If it's a persistent vehicle already, the existing
    // vehicle will be updated. Otherwise it will be stored as a new persistent vehicle.
    async storeVehicle(vehicle) {
        // Take occupants out of the vehicle, re-create it, put them back in.
    }

    // Asynchronously deletes the |vehicle|. It will be immediately removed from the streamer, but
    // will be asynchronously deleted from the database if it's persistent.
    async deleteVehicle(vehicle) {}

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
    onVehicleDeath(vehicle, databaseVehicle) {}

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
        
        this.vehicles_.clear();
        this.vehicles_ = null;

        this.streamer_.removeReloadObserver(this);
        this.streamer_ = null;

        this.database_ = null;
    }
}

export default VehicleManager;
