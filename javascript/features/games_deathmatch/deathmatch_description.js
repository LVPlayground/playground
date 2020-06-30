// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Specialised version of the `GameDescription` class that controls and validates all deathmatch-
// related functionality added by this feature.
export class DeathmatchDescription {
    #description_ = null;

    lagCompensation_ = false;

    // ---------------------------------------------------------------------------------------------

    // Gets whether players should be subject to lag compensation during this game.
    get lagCompensation() { return this.lagCompensation_; }

    // ---------------------------------------------------------------------------------------------

    constructor(description, manualOptions = null) {
        this.#description_ = description;

        const options = manualOptions || description.options;
        if (options.hasOwnProperty('lagCompensation')) {
            if (typeof options.lagCompensation !== 'boolean')
                throw new Error(`[${this.name}] The lag compensation flag must be a boolean.`);
            
            this.lagCompensation_ = options.lagCompensation;
        }
    }
}
