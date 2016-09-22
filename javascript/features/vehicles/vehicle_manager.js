// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DatabaseVehicle = require('features/vehicles/database_vehicle.js');
const MockVehicleDatabase = require('features/vehicles/test/mock_vehicle_database.js');
const VehicleDatabase = require('features/vehicles/vehicle_database.js');

// The vehicle manager is responsible for all vehicles created as part of the Vehicles feature. This
// is not to be confused with the global VehicleManager for the entire JavaScript gamemode.
class VehicleManager {
    constructor(streamer) {
        this.database_ = server.isTest() ? new MockVehicleDatabase()
                                         : new VehicleDatabase();

        this.dataLoadedPromise_ = new Promise(resolver =>
            this.dataLoadedResolver_ = resolver);

        this.vehicles_ = new Set();

        this.streamer_ = streamer;
    }

    // Gets the number of vehicles that have been created by the manager.
    get count() { return this.vehicles_.size; }

    // Gets a promise that is to be resolved when the feature is ready.
    get ready() { return this.dataLoadedPromise_; }

    // Gets an iterator with access to all DAtabaseVehicle instances.
    get vehicles() { return this.vehicles_.values(); }

    // ---------------------------------------------------------------------------------------------

    // Asynchronously loads the vehicles from the database, and creates them on the server using the
    // streamer. Will display warnings for invalid vehicle definitions.
    async loadVehicles() {
        for (const vehicleInfo of await this.database_.loadVehicles())
            this.createVehicle(new DatabaseVehicle(vehicleInfo));

        this.dataLoadedResolver_();
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the |vehicle| in the vehicle streamer.
    createVehicle(vehicle) {
        this.vehicles_.add(vehicle)
        this.streamer_().getVehicleStreamer().add(vehicle);
    }

    // Deletes the |vehicle| from the vehicle streamer.
    deleteVehicle(vehicle) {
        this.streamer_().getVehicleStreamer().delete(vehicle);
        this.vehicles_.delete(vehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const vehicle of this.vehicles_)
            this.deleteVehicle(vehicle);

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.database_ = null;
    }
}

exports = VehicleManager;
