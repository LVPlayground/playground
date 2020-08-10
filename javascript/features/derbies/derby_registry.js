// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DerbyDescription } from 'features/derbies/derby_description.js';

// Directory in which each of the derby configuration files have been defined.
const kDerbyDirectory = 'data/derbies/';

// Registry for containing information about all derbies available on Las Venturas Playground. The
// derbies themselves are contained in JSON configuration files, which can be imported using the
// DerbyDescription class which follows the canonical structured game description syntax.
export class DerbyRegistry {
    #derbies_ = null;

    // Ensures that the registry has been initialized. This will happen the first time any derby
    // data has to be accessed by one of the methods in the registry.
    ensureInitialized() {
        if (this.#derbies_)
            return;

        this.#derbies_ = new Map();
        for (const filename of glob(kDerbyDirectory, '.*\.json')) {
            const description = new DerbyDescription(kDerbyDirectory + filename);
            if (this.#derbies_.has(description.id))
                throw new Error(`${description}: duplicate derby ID found: ${description.id}.`);

            this.#derbies_.set(description.id, description);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Provides access to a derby with the given |derbyId|, or NULL when it cannot be found.
    getDerby(derbyId) { this.ensureInitialized(); return this.#derbies_.get(derbyId) ?? null; }

    // Provides an iterator through which all of the derbies can be accessed.
    derbies() { this.ensureInitialized(); return this.#derbies_.values(); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.#derbies_)
            this.#derbies_.clear();

        this.#derbies_ = null;
    }
}
