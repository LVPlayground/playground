// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Specialised version of the `GameDescription` class that controls and validates all deathmatch-
// related functionality added by this feature.
export class DeathmatchDescription {
    // Whether players should be subject to lag compensation during this game.
    lagCompensation = false;

    // Whether map markers should be enabled 
    mapMarkers = 'Enabled';

    // ---------------------------------------------------------------------------------------------

    constructor(description, manualOptions, settings) {
        const options = manualOptions || description.options;

        if (options.hasOwnProperty('lagCompensation')) {
            if (typeof options.lagCompensation !== 'boolean')
                throw new Error(`[${this.name}] The lag compensation flag must be a boolean.`);
            
            this.lagCompensation = options.lagCompensation;
        } else {
            this.lagCompensation = settings.getValue('games/deathmatch_lag_compensation');
        }

        if (options.hasOwnProperty('mapMarkers')) {
            if (!['Enabled', 'Team only', 'Disabled'].includes(options.mapMarkers))
                throw new Error(`[${this.name}] Invalid value given for the map marker option.`);
            
            this.mapMarkers = options.mapMarkers;
        }
    }
}
