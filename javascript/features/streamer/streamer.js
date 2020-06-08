// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';

// Enhances Las Venturas Playground with the ability to exceed the default vehicle limits. All
// vehicles part of freeroam, houses and similar features should be created through the streamer.
export default class Streamer extends Feature {
    constructor() {
        super();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Streamer feature
    // ---------------------------------------------------------------------------------------------

    // Creates a new streamable vehicle on the server. The |vehicle| must thus follow the syntax of
    // the StreamableVehicleInfo object. An instance of StreamableVehicle will be returned.
    createVehicle(vehicleInfo) {
        if (!(vehicleInfo instanceof StreamableVehicleInfo))
            throw new Error(`The vehicle info must be given as a StreamableVehicleInfo instance.`);
        
        // TODO: Implement this method

        return new StreamableVehicle(vehicleInfo);
    }

    // Deletes the given |vehicle| from the server, which must be a StreamableVehicle instance. Only
    // the feature that created the vehicle should be removing it.
    deleteVehicle(vehicle) {
        if (!(vehicle instanceof StreamableVehicle))
            throw new Error(`The vehicle must be given as a StreamableVehicle instance.`);
        
        // TODO: Implement this method
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
