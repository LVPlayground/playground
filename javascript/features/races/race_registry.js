// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RaceDescription } from 'features/races/race_description.js';

// Directory in which each of the race configuration files have been defined.
const kRaceDirectory = 'data/races/';

// Registry for containing information about all races available on Las Venturas Playground. The
// races themselves are contained in JSON configuration files, which can be imported using the
// RaceDescription class which follows the canonical structured game description syntax.
export class RaceRegistry {
    #races_ = null;

    // Ensures that the registry has been initialized. This will happen the first time any race data
    // has to be accessed by one of the methods in the registry.
    ensureInitialized() {
        if (this.#races_)
            return;

        this.#races_ = new Map();
        for (const filename of glob(kRaceDirectory, '.*\.json')) {
            const description = new RaceDescription(kRaceDirectory + filename);
            if (this.#races_.has(description.id))
                throw new Error(`${description}: duplicate race ID found: ${description.id}.`);

            this.#races_.set(description.id, description);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Provides access to a race with the given |raceId|, or NULL when it cannot be found.
    getRace(raceId) { this.ensureInitialized(); return this.#races_.get(raceId) ?? null; }

    // Provides an iterator through which all of the races can be accessed.
    races() { this.ensureInitialized(); return this.#races_.values(); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.#races_)
            this.#races_.clear();

        this.#races_ = null;
    }
}
