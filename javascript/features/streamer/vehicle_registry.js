// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';

// The registry is responsible for keeping track of which vehicles exist on the server. Vehicles can
// be created using StreamableVehicleInfo, and will be represented by StreamableVehicle instances.
export class VehicleRegistry {
    constructor() {}

    // ---------------------------------------------------------------------------------------------

    // Creates a StreamableVehicle instance for the given |vehicleInfo|, which must be an instance
    // of StreamableVehicleInfo, containing the default configuration for this vehicle.
    createVehicle(vehicleInfo) {
        return new StreamableVehicle(vehicleInfo);
    }

    // Deletes the given |vehicle| from the server, which must be an instance of StreamableVehicle.
    // It will be removed from the streamer as well, and, when it exists, will immediately be
    // removed from the game. Any player within it will be ejected.
    deleteVehicle(vehicle) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
