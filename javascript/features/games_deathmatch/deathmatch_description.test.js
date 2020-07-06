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

        assert.equal(
            description.objective,
            settings.getValue('games/deathmatch_objective_default'));

        assert.equal(
            description.objectiveValue,
            settings.getValue('games/deathmatch_objective_value_default'));

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
                objective: 'Best of...',
                objectiveValue: 3,
                teamDamage: true,

            }, settings);

            assert.isTrue(description.lagCompensation);
            assert.equal(description.mapMarkers, 'Team only');
            assert.equal(description.objective, 'Best of...');
            assert.equal(description.objectiveValue, 3);
            assert.isTrue(description.teamDamage);
        }

        // (2) Create a description based on settings that change most things, but with different
        // values to catch cases where the server-defined default isn't overridden.
        {
            const description = new DeathmatchDescription(/* description= */ null, {
                lagCompensation: false,
                mapMarkers: 'Disabled',
                objective: 'Continuous',
                teamDamage: false,

            }, settings);

            assert.isFalse(description.lagCompensation);
            assert.equal(description.mapMarkers, 'Disabled');
            assert.equal(description.objective, 'Continuous');
            assert.isFalse(description.teamDamage);
        }
    });
});
