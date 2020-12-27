// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SpawnWeaponsSetting } from 'features/games_deathmatch/settings/spawn_weapons_setting.js';

// Specialised version of the `GameDescription` class that controls and validates all deathmatch-
// related functionality added by this feature.
export class DeathmatchDescription {
    // Available values for some of the enumeration-based deathmatch options.
    static kMapMarkerOptions = ['Enabled', 'Team only', 'Disabled'];
    static kObjectiveOptions = ['Continuous', 'Number of lives...', 'Time limit...'];
    static kTeamOptions = [ 'Balanced teams', 'Free for all', 'Randomized teams' ];

    // Whether players should be subject to lag compensation during this game.
    lagCompensation = null;

    // Whether map markers should be enabled. One of {Enabled, Team only, Disabled}.
    mapMarkers = 'Enabled';

    // The objective for this game, i.e. the winning conditions. { type, rounds?, kills?, seconds? }
    objective = null;

    // The skin that participants should spawn with.
    skin = -1;

    // Whether participants should be given spawn armour by default.
    spawnArmour = null;

    // The spawn weapons taht the player will be spawning with.
    spawnWeapons = [];

    // Whether teams should be created, and if so, how they should be balanced.
    teams = 'Free for all';

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
                case 'Continuous':
                    break;
                
                case 'Number of lives...':
                    if (!options.objective.hasOwnProperty('lives'))
                        throw new Error(`[${this.name}] The objective.lives option is missing.`);

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
                lives: settings.getValue('games/deathmatch_objective_value_default'),
                seconds: settings.getValue('games/deathmatch_objective_value_default'),
            };
        }

        if (options.hasOwnProperty('skin')) {
            if (typeof options.skin !== 'number')
                throw new Error(`[${this.name}] The skin ID must be passed as a number.`);

            this.skin = options.skin;
        }

        if (options.hasOwnProperty('spawnArmour')) {
            if (typeof options.spawnArmour !== 'boolean')
                throw new Error(`[${this.name}] The spawn armour flag must be a boolean.`);

            this.spawnArmour = options.spawnArmour;
        } else {
            this.spawnArmour = settings.getValue('games/deathmatch_spawn_armour_default');
        }

        if (options.hasOwnProperty('spawnWeapons')) {
            if (!Array.isArray(options.spawnWeapons))
                throw new Error(`[${this.name}] Given spawn weapons must be an array.`);
            
            for (const spawnWeapon of options.spawnWeapons) {
                if (typeof spawnWeapon !== 'object')
                    throw new Error(`[${this.name}] Each spawn weapon must be an object.`);
                
                const weapon = spawnWeapon.weapon;
                const ammo = spawnWeapon.ammo;

                if (!SpawnWeaponsSetting.kSpawnWeaponIds.has(weapon))
                    throw new Error(`[${this.name}] Invalid weapon ID passed for spawn weapon.`);
                
                if (typeof ammo !== 'number' || ammo < 0 || ammo > 10000)
                    throw new Error(`[${this.name}] Invalid ammunition passed for spawn weapon.`);
                
                this.spawnWeapons.push({ weapon, ammo });
            }
        } else {
            // Give all players a Desert Eagle unless other weapons were specified.
            this.spawnWeapons.push({ weapon: 24, ammo: 100 });
        }

        if (options.hasOwnProperty('teams')) {
            if (!DeathmatchDescription.kTeamOptions.includes(options.teams))
                throw new Error(`[${this.name}] Invalid value given the teams configuration.`);

            this.teams = options.teams;
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
