// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

import { random } from 'base/random.js';

// Details information about a streamable vehicle that can be created on the server. Provides
// default values for all properties, except for { modelId, position, rotation }.
export class StreamableVehicleInfo {
    modelId = null;

    position = null;
    rotation = null;

    primaryColor = null;
    secondaryColor = null;
    siren = null;

    respawnDelay = null;

    constructor({ modelId = null, position = null, rotation = null, primaryColor = null,
                  secondaryColor = null, siren = null, respawnDelay = null } = {}) {
        if (typeof modelId !== 'number' || modelId < 400 || modelId > 611)
            throw new Error(`Invalid vehicle model Id given: ${modelId}`);
        
        if (!(position instanceof Vector))
            throw new Error(`Invalid vehicle position given: ${position}`);
        
        if (typeof rotation !== 'number')
            throw new Error(`Invalid vehicle rotation given: ${rotation}`);
        
        this.modelId = modelId;

        this.position = position;
        this.rotation = rotation;

        this.primaryColor = primaryColor ?? random(128, 251);
        this.secondaryColor = secondaryColor ?? random(128, 251);
        this.siren = siren ?? false;

        this.respawnDelay = respawnDelay ?? 180;
    }
}
