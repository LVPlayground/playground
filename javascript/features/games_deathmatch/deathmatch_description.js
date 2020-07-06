// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Specialised version of the `GameDescription` class that controls and validates all deathmatch-
// related functionality added by this feature.
export class DeathmatchDescription {
    // Available values for some of the enumeration-based deathmatch options.
    static kMapMarkerOptions = ['Enabled', 'Team only', 'Disabled'];
    static kObjectiveOptions =
        ['Last man standing', 'Best of...', 'First to..', 'Time limit...', 'Continuous'];

    // Whether players should be subject to lag compensation during this game.
    lagCompensation = null;

    // Whether map markers should be enabled. One of {Enabled, Team only, Disabled}.
    mapMarkers = 'Enabled';

    // The objective for this game, i.e. the winning conditions. { type, rounds?, kills?, seconds? }
    objective = null;

    // Whether participants should be given spawn armour by default.
    spawnArmour = null;

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
            if (typeof options !== 'object')
                throw new Error(`[${this.name}] Invalid value given for the objective option.`);

            if (!DeathmatchDescription.kObjectiveOptions.includes(options.objective.type))
                throw new Error(`[${this.name}] Invalid value given for the objective type.`);

            switch (options.objective.type) {
                case 'Last man standing':
                case 'Continuous':
                    break;
                
                case 'Best of...':
                    if (!options.objective.hasOwnProperty('rounds'))
                        throw new Error(`[${this.name}] The objective.rounds option is missing.`);
                    break;

                case 'First to...':
                    if (!options.objective.hasOwnProperty('kills'))
                        throw new Error(`[${this.name}] The objective.kills option is missing.`);
                    break;
                
                case 'Time limit...':
                    if (!options.objective.hasOwnProperty('seconds'))
                        throw new Error(`[${this.name}] The objective.seconds option is missing.`);
                    break;
            }

            this.objective = options.objective;
        } else {
            this.objective = {
                type: settings.getValue('games/deathmatch_objective_default'),

                // We don't know what the given |type| is, so just duplicate the value for each...
                rounds: settings.getValue('games/deathmatch_objective_value_default'),
                kills: settings.getValue('games/deathmatch_objective_value_default'),
                seconds: settings.getValue('games/deathmatch_objective_value_default'),
            };
        }

        if (options.hasOwnProperty('spawnArmour')) {
            if (typeof options.spawnArmour !== 'boolean')
                throw new Error(`[${this.name}] The spawn armour flag must be a boolean.`);

            this.spawnArmour = options.spawnArmour;
        } else {
            this.spawnArmour = settings.getValue('games/deathmatch_spawn_armour_default');
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
