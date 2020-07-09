// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { clone } from 'base/clone.js';
import { fightNameGenerator } from 'features/fights/fight_name_generator.js';

describe('FightNameGenerator', (it, beforeEach) => {
    let defaultSettings = null;
    let generator = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('fights');

        defaultSettings = new Map();
        generator = fightNameGenerator.bind(null, feature.registry_);

        // (1) Add the Game-level settings.
        defaultSettings.set('game/environment', {
            gravity: 'Normal',
            time: 'Afternoon',
            weather: 'Sunny',
        });

        // (2) Add the GameDeathmatch-level settings.
        defaultSettings.set('deathmatch/lag_compensation', true);
        defaultSettings.set('deathmatch/map_markers', 'Enabled');
        defaultSettings.set('deathmatch/objective', 'Last man standing');
        defaultSettings.set('deathmatch/skin', -1);
        defaultSettings.set('deathmatch/spawn_armour', false);
        defaultSettings.set('deathmatch/spawn_weapons', [ { weapon: 24, ammo: 100 } ]);
        defaultSettings.set('deathmatch/teams', 'Free for all');
        defaultSettings.set('deathmatch/team_damage', true);

        // (3) Add the Fights-level settings.
        defaultSettings.set('internal/name', null);
        defaultSettings.set('fights/location', 'Acter Nuclear Power Plant');
        defaultSettings.set('fights/pickups', true);
    });

    it('should be able to generate names specific to a fight', assert => {
        // (1) The location should form the base of the name.
        assert.equal(
            generator(clone(defaultSettings).set('fights/location', 'Acter Nuclear Power Plant')),
            'Nuclear Match');
        
        assert.equal(
            generator(clone(defaultSettings).set('fights/location', 'Counter Strike 1.6: Inferno')),
            'Inferno Match');

        // (2) Specified names should take precedence over the location name.
        assert.equal(
            generator(clone(defaultSettings).set('internal/name', 'Bubble')),
            'Bubble Match');

        // (3) Use of teams will influence the name.
        assert.equal(
            generator(clone(defaultSettings).set('fights/location', 'Counter Strike 1.6: Inferno')
                                            .set('deathmatch/teams', 'Balanced teams')),
            'Team Inferno Match');

        // (4) Use of lag compensation will influence the name.
        assert.equal(
            generator(clone(defaultSettings).set('fights/location', 'Counter Strike 1.6: Inferno')
                                            .set('deathmatch/lag_compensation', false)),
            'Inferno Match (lag shot)');
    });
});
