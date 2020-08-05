// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchDescription } from 'features/games_deathmatch/deathmatch_description.js';

describe('DeathmatchDescription', it => {
    it('should have sensible default values', assert => {
        const settings = server.featureManager.loadFeature('settings');
        const description = new DeathmatchDescription(
            /* description= */ null, /* options= */ {}, settings);

        assert.equal(
            description.lagCompensation,
            settings.getValue('games/deathmatch_lag_compensation_default'));

        assert.equal(description.mapMarkers, 'Enabled');

        assert.deepEqual(
            description.objective,
            {
                type: settings.getValue('games/deathmatch_objective_default'),

                // The specific values are duplicated for the default value.
                lives: settings.getValue('games/deathmatch_objective_value_default'),
                seconds: settings.getValue('games/deathmatch_objective_value_default'),
            });

        assert.equal(description.skin, -1);

        assert.equal(
            description.spawnArmour,
            settings.getValue('games/deathmatch_spawn_armour_default'));

        assert.deepEqual(
            description.spawnWeapons,
            [
                { weapon: 24, ammo: 100 },
            ]);

        assert.equal(description.teams, 'Free for all');

        assert.equal(
            description.teamDamage,
            settings.getValue('games/deathmatch_team_damage_default'));
    });

    it('should be able to take configuration from an object of options', assert => {
        const settings = server.featureManager.loadFeature('settings');

        // (1) Create a description based on settings that enable everything.
        {
            const description = new DeathmatchDescription(/* description= */ null, {
                lagCompensation: true,
                mapMarkers: 'Team only',
                objective: { type: 'Time limit...', seconds: 180 },
                skin: 121,
                spawnArmour: true,
                spawnWeapons: [ { weapon: 16, ammo: 50 } ],
                teams: 'Free for all',
                teamDamage: true,

            }, settings);

            assert.isTrue(description.lagCompensation);
            assert.equal(description.mapMarkers, 'Team only');
            assert.deepEqual(description.objective, { type: 'Time limit...', seconds: 180 });
            assert.equal(description.skin, 121);
            assert.isTrue(description.spawnArmour);
            assert.deepEqual(description.spawnWeapons, [ { weapon: 16, ammo: 50 } ]);
            assert.equal(description.teams, 'Free for all');
            assert.isTrue(description.teamDamage);
        }

        // (2) Create a description based on settings that change most things, but with different
        // values to catch cases where the server-defined default isn't overridden.
        {
            const description = new DeathmatchDescription(/* description= */ null, {
                lagCompensation: false,
                mapMarkers: 'Disabled',
                objective: { type: 'Continuous' },
                skin: 300,
                spawnArmour: false,
                spawnWeapons: [],
                teams: 'Balanced teams',
                teamDamage: false,

            }, settings);

            assert.isFalse(description.lagCompensation);
            assert.equal(description.mapMarkers, 'Disabled');
            assert.deepEqual(description.objective, { type: 'Continuous' });
            assert.equal(description.skin, 300);
            assert.isFalse(description.spawnArmour);
            assert.deepEqual(description.spawnWeapons, []);
            assert.equal(description.teams, 'Balanced teams');
            assert.isFalse(description.teamDamage);
        }
    });
});
