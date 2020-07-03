// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { canVehicleModelHaveComponent } from 'entities/vehicle_components.js';
import { random } from 'base/random.js';

// Details information about a streamable vehicle that can be created on the server. Provides
// default values for all properties, except for { modelId, position, rotation }.
export class StreamableVehicleInfo {
    modelId = null;

    position = null;
    rotation = null;

    paintjob = null;
    primaryColor = null;
    secondaryColor = null;
    numberPlate = null;
    siren = null;
    components = null;

    respawnDelay = null;

    constructor({ modelId = null, position = null, rotation = null, paintjob = null,
                  primaryColor = null, secondaryColor = null, numberPlate = null, siren = null,
                  components = null, respawnDelay = null } = {}) {
        if (typeof modelId !== 'number' || modelId < 400 || modelId > 611)
            throw new Error(`Invalid vehicle model Id given: ${modelId}`);
        
        if (!(position instanceof Vector))
            throw new Error(`Invalid vehicle position given: ${position}`);
        
        if (typeof rotation !== 'number')
            throw new Error(`Invalid vehicle rotation given: ${rotation}`);
        
        const validatedComponents = [];
        if (components !== null) {
            if (!Array.isArray(components))
                throw new Error(`Invalid components given: ${components}`);
            
            for (const componentId of components) {
                if (!canVehicleModelHaveComponent(modelId, componentId)) {
                    if (server.isTest())
                        continue;  // skip the exception during testing

                    console.log(`[exception] Invalid component for vehicle model ${modelId}: ` +
                                `${componentId}. Silently discarded.`);
                    continue;
                }

                validatedComponents.push(componentId);
            }
        }
        
        this.modelId = modelId;

        this.position = position;
        this.rotation = rotation;

        this.paintjob = paintjob;
        this.primaryColor = primaryColor ?? random(128, 251);
        this.secondaryColor = secondaryColor ?? random(128, 251);
        this.numberPlate = numberPlate;
        this.siren = siren ?? false;
        this.components = validatedComponents;

        this.respawnDelay = respawnDelay;
    }
}
