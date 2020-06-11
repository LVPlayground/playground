// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';

// The registry is responsible for keeping track of which vehicles exist on the server. Vehicles can
// be created using StreamableVehicleInfo, and will be represented by StreamableVehicle instances.
export class VehicleRegistry {
    streamer_ = null;
    vehicles_ = null;

    constructor(streamer) {
        this.streamer_ = streamer;
        this.vehicles_ = new Set();
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a StreamableVehicle instance for the given |vehicleInfo|, which must be an instance
    // of StreamableVehicleInfo, containing the default configuration for this vehicle.
    createVehicle(vehicleInfo) {
        const vehicle = new StreamableVehicle(vehicleInfo);

        this.streamer_.add(vehicle);
        this.vehicles_.add(vehicle);

        return vehicle;
    }

    // Deletes the given |vehicle| from the server, which must be an instance of StreamableVehicle.
    // It will be removed from the streamer as well, and, when it exists, will immediately be
    // removed from the game. Any player within it will be ejected.
    deleteVehicle(vehicle) {
        this.streamer_.delete(vehicle);
        this.vehicles_.delete(vehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.vehicles_.clear();
        this.vehicles_ = null;
    }
}
