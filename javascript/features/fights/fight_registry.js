// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FightLocationDescription } from 'features/fights/fight_location_description.js';
import { FightLocation } from 'features/fights/fight_location.js';

// Directory in which the fight locations are located.
const kLocationDirectory = 'data/fights/locations/';

// Keeps track of the fight locations, commands and configuration available on the server. Is
// responsible for loading it, and doing the initial initialization.
export class FightRegistry {
    #locations_ = null;

    constructor() {
        this.#locations_ = new Map();
    }

    // Gets the locations that are available for fights.
    get locations() { return this.#locations_; }

    // Gets a particular location by the given |name|. Returns NULL when it's invalid.
    getLocation(name) { return this.#locations_.get(name) ?? null; }

    // ---------------------------------------------------------------------------------------------

    // Initializes the full fight system from the files the data is defined in. Will be called by
    // the Fights class for production usage, but has to be called manually when running tests.
    initialize() {
        this.initializeLocations();
    }

    // Initializes the locations in which fights can take place. Each is based on a structured game
    // description, which will be given to a `FightLocation` intermediary.
    initializeLocations() {
        for (const filename of glob(kLocationDirectory, '.*\.json$')) {
            const description = new FightLocationDescription(kLocationDirectory + filename);
            const location = new FightLocation(description);

            this.#locations_.set(description.name, location);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#locations_.clear();
        this.#locations_ = null;
    }
}
