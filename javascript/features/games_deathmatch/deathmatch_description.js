// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Specialised version of the `GameDescription` class that controls and validates all deathmatch-
// related functionality added by this feature.
export class DeathmatchDescription {
    #description_ = null;

    // Whether players should be subject to lag compensation during this game.
    lagCompensation = false;

    // ---------------------------------------------------------------------------------------------

    constructor(description, manualOptions, settings) {
        this.#description_ = description;

        // Set the default configuration based on the |settings|.
        this.lagCompensation = settings.getValue('games/deathmatch_lag_compensation');

        // Load all configuration from the |manualOptions|, or the |description| when available.
        const options = manualOptions || description.options;

        if (options.hasOwnProperty('lagCompensation')) {
            if (typeof options.lagCompensation !== 'boolean')
                throw new Error(`[${this.name}] The lag compensation flag must be a boolean.`);
            
            this.lagCompensation = options.lagCompensation;
        }
    }
}
