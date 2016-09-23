// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DatabaseVehicle = require('features/vehicles/database_vehicle.js');
const MockVehicleDatabase = require('features/vehicles/test/mock_vehicle_database.js');
const VehicleDatabase = require('features/vehicles/vehicle_database.js');

// The maximum value that can be given to a vehicle's color.
const MaximumVehicleColorValue = 255;

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
            secondaryColor: Math.floor(Math.random() * MaximumVehicleColorValue)
        });

        this.internalCreateVehicle(databaseVehicle, false /* lazy */);
        return this.internalGetLiveVehicle(databaseVehicle);
    }

    // Returns whether the |vehicle| is one managed by the VehicleManager.
    isManagedVehicle(vehicle) {
        return this.internalGetDatabaseVehicle(vehicle) !== null;
    }

    // Asynchronously deletes the |vehicle|. It will be immediately removed from the streamer, but
    // will be asynchronously deleted from the database if it's persistent.
    async deleteVehicle(vehicle) {
        const databaseVehicle = this.internalGetDatabaseVehicle(vehicle);
        if (!databaseVehicle)
            throw new Error('The given |vehicle| is not managed by the vehicle manager.');

        this.internalDeleteVehicle(databaseVehicle);

        if (databaseVehicle.isPersistent())
            await this.database_.deleteVehicle(databaseVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the |databaseVehicle| in the vehicle streamer. The vehicle will be created lazily
    // when the |lazy| flag has been set, which means it won't automatically be streamed in.
    internalCreateVehicle(databaseVehicle, lazy) {
        this.vehicles_.add(databaseVehicle)
        this.streamer_().getVehicleStreamer().add(databaseVehicle, lazy);
    }

    // Returns the live Vehicle instance for the |databaseVehicle|.
    internalGetLiveVehicle(databaseVehicle) {
        return this.streamer_().getVehicleStreamer().getLiveVehicle(databaseVehicle);
    }

    // Returns the DatabaseVehicle instance for the given |vehicle|.
    internalGetDatabaseVehicle(vehicle) {
        return this.streamer_().getVehicleStreamer().getStoredVehicle(vehicle);
    }

    // Deletes the |databaseVehicle| from the vehicle streamer.
    internalDeleteVehicle(databaseVehicle) {
        this.streamer_().getVehicleStreamer().delete(databaseVehicle);
        this.vehicles_.delete(databaseVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const databaseVehicle of this.vehicles_)
            this.internalDeleteVehicle(databaseVehicle);

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.database_ = null;
    }
}

exports = VehicleManager;
