// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';

// Contains the information associated with a persistently stored vehicle in the database. Is
// immutable after creation, but can easily be copied with mutations.
export class PersistentVehicleInfo {
    vehicleId = null;

    modelId = null;

    position = null;
    rotation = null;

    primaryColor = null;
    secondaryColor = null;

    // ---------------------------------------------------------------------------------------------

    constructor({ vehicleId, modelId, position, rotation, primaryColor, secondaryColor } = {},
                init = {}) {
        this.vehicleId = init.vehicleId ?? vehicleId;
        
        this.modelId = init.modelId ?? modelId;
        
        this.position = init.position ?? position;
        this.rotation = init.rotation ?? rotation;

        this.primaryColor = init.primaryColor ?? primaryColor;
        this.secondaryColor = init.secondaryColor ?? secondaryColor;
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a StreamableVehicleInfo object from |this|, to be used when creating the vehicle on
    // the server through the Streamer.
    toStreamableVehicleInfo(respawnDelay) {
        return new StreamableVehicleInfo({
            modelId: this.modelId,

            position: this.position,
            rotation: this.rotation,

            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,

            respawnDelay,
        });
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object PersistentVehicleInfo(${this.vehicleId})]`; }
}
