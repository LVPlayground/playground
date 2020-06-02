// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DerbyDescription } from 'features/derbies/derby_description.js';

// Directory in which the derby configuration files reside.
const kDerbyDirectory = 'data/derbies/';

// Has the ability to load all derbies from disk, and keep track of which ones are in existence. The
// registry is further responsible for keeping each of the derbies registered with the Games API,
// to make sure that the individual games are able to load.
export class DerbyRegistry {
    derbies_ = null;

    constructor() {
        this.derbies_ = new Map();
    }

    // Gets the number of derbies known to this registry.
    get size() { return this.derbies_.size; }

    // Initializes all the derbies that exist on the filesystem, creates the necessary Derby-
    // Description objects for them, and registers them with the Games API.
    initialize() {
        if (this.derbies_.size)
            throw new Error('The DerbyRegistry has already been initialized.');

        const filenames = glob(kDerbyDirectory, '.*\.json');
        for (const filename of filenames) {
            let description = null;
            try {
                description = new DerbyDescription(kDerbyDirectory + filename);
                if (this.derbies_.has(description.id))
                    throw new Error(`[${description.name}] Duplicate derby Id found`);
                
                this.derbies_.set(description.id, description);
            } catch (exception) {
                console.log(`Unable to load derby from ${filename}:`, exception);
            }
        }
    }
}
