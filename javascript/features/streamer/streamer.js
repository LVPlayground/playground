// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';
import { VehicleRegistry } from 'features/streamer/vehicle_registry.js';

// Enhances Las Venturas Playground with the ability to exceed the default vehicle limits. All
// vehicles part of freeroam, houses and similar features should be created through the streamer.
export default class Streamer extends Feature {
    registry_ = null;

    constructor() {
        super();

        // Keeps track of which streamable vehicles have been created on the server.
        this.registry_ = new VehicleRegistry();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Streamer feature
    // ---------------------------------------------------------------------------------------------

    // Creates a new streamable vehicle on the server. The |vehicle| must thus follow the syntax of
    // the StreamableVehicleInfo object. An instance of StreamableVehicle will be returned. Vehicles
    // without a `respawnDelay` setting will be considered ephemeral.
    createVehicle(vehicleInfo) {
        if (!(vehicleInfo instanceof StreamableVehicleInfo))
            throw new Error(`The vehicle info must be given as a StreamableVehicleInfo instance.`);
        
        return this.registry_.createVehicle(vehicleInfo);
    }

    // Deletes the given |vehicle| from the server, which must be a StreamableVehicle instance.
    // Ephemeral vehicles may be
    deleteVehicle(vehicle) {
        if (!(vehicle instanceof StreamableVehicle))
            throw new Error(`The vehicle must be given as a StreamableVehicle instance.`);
        
        this.registry_.deleteVehicle(vehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.registry_.dispose();
        this.registry_ = null;
    }
}
