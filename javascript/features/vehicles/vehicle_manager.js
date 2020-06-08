// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockVehicleDatabase from 'features/vehicles/test/mock_vehicle_database.js';
import VehicleDatabase from 'features/vehicles/vehicle_database.js';

// The vehicle manager is responsible for all vehicles created as part of the Vehicles feature. This
// is not to be confused with the global VehicleManager for the entire JavaScript gamemode.
class VehicleManager {
    constructor(streamer) {
        this.database_ = server.isTest() ? new MockVehicleDatabase()
                                         : new VehicleDatabase();

        this.dataLoadedPromise_ = new Promise(resolver =>
            this.dataLoadedResolver_ = resolver);

        // Set of all DatabaseVehicle instances owned by this VehicleManager.
        this.vehicles_ = new Set();

        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(
            this, VehicleManager.prototype.onStreamerReload.bind(this));
    }

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
        // Actually load the vehicles.

        this.dataLoadedResolver_();
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

    // Called when the streamer has been reloaded. Will recreate all our vehicles.
    onStreamerReload(streamer) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.streamer_.removeReloadObserver(this);
        this.streamer_ = null;

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.database_ = null;
    }
}

export default VehicleManager;
