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

    paintjob = null;
    primaryColor = null;
    secondaryColor = null;
    numberPlate = null;
    components = null;

    // ---------------------------------------------------------------------------------------------

    constructor({ vehicleId, modelId, position, rotation, paintjob, primaryColor,
                  secondaryColor, numberPlate, components } = {}, init = {}) {
        this.vehicleId = init.vehicleId ?? vehicleId;
        
        this.modelId = init.modelId ?? modelId;
        
        this.position = init.position ?? position;
        this.rotation = init.rotation ?? rotation;

        this.paintjob = init.paintjob ?? paintjob;
        this.primaryColor = init.primaryColor ?? primaryColor;
        this.secondaryColor = init.secondaryColor ?? secondaryColor;
        this.numberPlate = init.numberPlate ?? numberPlate;
        this.components = init.components ?? components;
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a StreamableVehicleInfo object from |this|, to be used when creating the vehicle on
    // the server through the Streamer.
    toStreamableVehicleInfo(respawnDelay) {
        return new StreamableVehicleInfo({
            modelId: this.modelId,

            position: this.position,
            rotation: this.rotation,

            paintjob: this.paintjob,
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            numberPlate: this.numberPlate,
            components: this.components,

            respawnDelay,
        });
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object PersistentVehicleInfo(${this.vehicleId})]`; }
}
