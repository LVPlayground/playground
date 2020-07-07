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

        // (1) Gunther is able to add individual weapons.
        gunther.respondToDialog({ listitem: 2 /* spawn weapons */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* add a weapon */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assault rifles */ })).then(
            () => gunther.respondToDialog({ listitem: 1 /* M4 */ })).then(
            () => gunther.respondToDialog({ response: 0 /* bail out of weapon dialog */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/spawn_weapons'));
        assert.deepEqual(settings.get('deathmatch/spawn_weapons'), [
            { weapon: 28, ammo: 50 },
            { weapon: 26, ammo: 50 },
            { weapon: 31, ammo: 400 },
        ]);

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Spawn weapons',
            '{FFFF00}3 weapons',
        ]);
        
        // (2) Gunther is not able to add individual weapons multiple times.
        gunther.respondToDialog({ listitem: 2 /* spawn weapons */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* add a weapon */ })).then(
            () => gunther.respondToDialog({ listitem: 6 /* shotguns */ })).then(
            () => gunther.respondToDialog({ listitem: 1 /* sawnoff shotgun */ })).then(
            () => gunther.respondToDialog({ response: 0 /* bail out of weapon dialog */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/spawn_weapons'));
        assert.deepEqual(settings.get('deathmatch/spawn_weapons'), [
            { weapon: 28, ammo: 50 },
            { weapon: 26, ammo: 250 },
        ]);

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Spawn weapons',
            '{FFFF00}Micro SMG, Sawnoff Shotgun',
        ]);

        // (3) Gunther is able to remove a weapon from the selection.
        gunther.respondToDialog({ listitem: 2 /* spawn weapons */ }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Micro SMG */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* delete this weapon */ })).then(
            () => gunther.respondToDialog({ response: 0 /* bail out of weapon dialog */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/spawn_weapons'));
        assert.deepEqual(settings.get('deathmatch/spawn_weapons'), [
            { weapon: 26, ammo: 50 },
        ]);

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Spawn weapons',
            '{FFFF00}Sawnoff Shotgun',
        ]);
        
        // (4) Gunther is able to overwrite the selection with a weapon set.
        gunther.respondToDialog({ listitem: 2 /* spawn weapons */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* select weapon set */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* fun weapon set */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game! */ }));
        
        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/spawn_weapons'));
        assert.deepEqual(settings.get('deathmatch/spawn_weapons'), [
            { weapon: 10, ammo: 1 },
            { weapon: 41, ammo: 250 },
        ]);

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Spawn weapons',
            '{FFFF00}Purple Dildo, Spraycan',
        ]);

        // (5) Gunther is able to change the amount of ammunition for a weapon.
        gunther.respondToDialog({ listitem: 2 /* spawn weapons */ }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Micro SMG */ })).then(
            () => gunther.respondToDialog({ listitem: 1 /* adjust ammo */ })).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* invalid */ })).then(
            () => gunther.respondToDialog({ response: 1 /* try again */ })).then(
            () => gunther.respondToDialog({ inputtext: '400' /* rounds */ })).then(
            () => gunther.respondToDialog({ response: 0 /* bail out of weapon dialog */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/spawn_weapons'));
        assert.deepEqual(settings.get('deathmatch/spawn_weapons'), [
            { weapon: 28, ammo: 400 },
            { weapon: 26, ammo: 50 },
        ]);

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Spawn weapons',
            '{FFFF00}Micro SMG, Sawnoff Shotgun',
        ]);
        
        // (6) Gunther is able to remove all weapons.
        gunther.respondToDialog({ listitem: 2 /* spawn weapons */ }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Micro SMG */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* delete this weapon */ })).then(
            () => gunther.respondToDialog({ listitem: 3 /* Sawnoff Shotgun */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* delete this weapon */ })).then(
            () => gunther.respondToDialog({ response: 0 /* bail out of weapon dialog */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/spawn_weapons'));
        assert.deepEqual(settings.get('deathmatch/spawn_weapons'), []);

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Spawn weapons',
            '{FFFF00}None',
        ]);
    });
});
