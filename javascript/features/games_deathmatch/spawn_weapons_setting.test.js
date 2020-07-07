// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';
import { GameCommandParams } from 'features/games/game_command_params.js';
import { GameDescription } from 'features/games/game_description.js';
import { Setting } from 'entities/setting.js';
import { SpawnWeaponsSetting } from 'features/games_deathmatch/spawn_weapons_setting.js';

describe('SpawnWeaponsSetting', (it, beforeEach) => {
    let commands = null;
    let gunther = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        commands = feature.commands_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should be able to handle customised game setting appearances', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Show a fancy dialog for players to select their spawn weapons',
            command: 'bubblegame',

            settingsFrozen: GameDescription.kDefaultSettings,
            settings: [
                new Setting(
                    'deathmatch', 'spawn_weapons', new SpawnWeaponsSetting(),
                    [ { weapon: 28, ammo: 50 }, { weapon: 26, ammo: 50 } ], 'Spawn weapons'),
            ],
        });

        const params = new GameCommandParams();
        params.customise = true;

        let settings = null;

        // (1) Gunther is able to cancel out of starting a new game.
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNull(settings);

        assert.deepEqual(gunther.getLastDialogAsTable().rows, [
            [
                'Start the game!',
                '-',
            ],
            [
                '----------',
                '----------',
            ],
            [
                'Spawn weapons',
                'Micro SMG, Sawnoff Shotgun',
            ]
        ]);
    });
});
