// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Specialised version of the `GameDescription` class that controls and validates all deathmatch-
// related functionality added by this feature.
export class DeathmatchDescription {
    // Available values for some of the enumeration-based deathmatch options.
    static kMapMarkerOptions = ['Enabled', 'Team only', 'Disabled'];
    static kObjectiveOptions =
        ['Last man standing', 'Best of...', 'Best of...', 'Time limit...', 'Continuous'];

    // Whether players should be subject to lag compensation during this game.
    lagCompensation = null;

    // Whether map markers should be enabled. One of {Enabled, Team only, Disabled}.
    mapMarkers = 'Enabled';

    // The objective for this game, i.e. the winning conditions.
    objective = null;
    objectiveValue = null;

    // Whether participants in the same team can issue damage to each other.
    teamDamage = true;

    // ---------------------------------------------------------------------------------------------

    constructor(description, manualOptions, settings) {
        const options = manualOptions || description.options;

        if (options.hasOwnProperty('lagCompensation')) {
            if (typeof options.lagCompensation !== 'boolean')
                throw new Error(`[${this.name}] The lag compensation flag must be a boolean.`);

            this.lagCompensation = options.lagCompensation;
        } else {
            this.lagCompensation = settings.getValue('games/deathmatch_lag_compensation_default');
        }

        if (options.hasOwnProperty('mapMarkers')) {
            if (!DeathmatchDescription.kMapMarkerOptions.includes(options.mapMarkers))
                throw new Error(`[${this.name}] Invalid value given for the map marker option.`);

            this.mapMarkers = options.mapMarkers;
        }

        if (options.hasOwnProperty('objective')) {
            if (!DeathmatchDescription.kObjectiveOptions.includes(options.objective))
                throw new Error(`[${this.name}] Invalid value given for the objective option.`);

            this.objective = options.objective;
            if (options.hasOwnProperty('objectiveValue')) {
                if (typeof options.objectiveValue !== 'number')
                    throw new Error(`[${this.name}] Invalid objective value given, not a number.`);
                
                this.objectiveValue = options.objectiveValue;
            }
        } else {
            this.objective = settings.getValue('games/deathmatch_objective_default');
            this.objectiveValue = settings.getValue('games/deathmatch_objective_value_default');
        }

        if (options.hasOwnProperty('teamDamage')) {
            if (typeof options.teamDamage !== 'boolean')
                throw new Error(`[${this.name}] The team damage flag must be a boolean.`);

            this.teamDamage = options.teamDamage;
        } else {
            this.teamDamage = settings.getValue('games/deathmatch_team_damage_default');
        }
    }
}
