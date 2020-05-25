// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

// File (JSON) in which all the individual barrels have been stored.
const kBarrelDataFile = 'data/red_barrels.json';

// Implements the ability to track the barrels created in the world, as well as the player object
// IDs for which they have been created for individual players.
export class BarrelTracker {
    // Identifiers for the different categories of barrels.
    static kAreaLasVenturas = 'Las Venturas';

    // The barrels that have been loaded, keyed by ID, valued by { area, position, rotation }.
    barrels_ = null;

    // Gets the barrels that are known by the tracker.
    get barrels() { return this.barrels_; }

    constructor() {
        this.barrels_ = new Map();

        // Skip loading the |kBarrelDataFile| for tests - they can load it explicitly if needed.
        if (!server.isTest())
            this.loadBarrelsFromFile();
    }

    // Populates the |barrels_| with all the barrels identified from the data file.
    loadBarrelsFromFile() {
        const data = JSON.parse(readFile(kBarrelDataFile));
        for (const area of [ BarrelTracker.kAreaLasVenturas ]) {
            if (!data.hasOwnProperty(area) || !Array.isArray(data[area]))
                throw new Error(`No barrels are defined for the ${area} area.`);

            for (const barrel of data[area]) {
                if (this.barrels_.has(barrel.id))
                    throw new Error(`Duplicate barrels found for Id:${barrel.id}`);

                this.barrels_.set(barrel.id, {
                    area,
                    position: new Vector(...barrel.position),
                    rotation: new Vector(...barrel.rotation),
                });
            }
        }
    }
}
