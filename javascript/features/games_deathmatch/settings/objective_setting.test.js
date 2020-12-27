// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCommandParams } from 'features/games/game_command_params.js';
import { GameDescription } from 'features/games/game_description.js';
import { Game } from 'features/games/game.js';
import { ObjectiveSetting } from 'features/games_deathmatch/settings/objective_setting.js';
import { Setting } from 'entities/setting.js';

describe('GameCustomSetting', (it, beforeEach) => {
    let commands = null;
    let gunther = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        commands = feature.commands_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should be able to handle customised game setting appearances', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Show a fancy dialog with customised options',
            command: 'bubblegame',

            settingsFrozen: GameDescription.kDefaultSettings,
            settings: [
                new Setting(
                    'deathmatch', 'objective', new ObjectiveSetting, { type: 'Continuous' },
                    'Objective')
            ],
        });

        const params = new GameCommandParams();
        params.type = GameCommandParams.kTypeCustomise;

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
                'Objective',
                'Continuous',
            ]
        ]);

        // (2) Gunther is able to start a game, which will reflect the default settings.
        gunther.respondToDialog({ listitem: 0 /* Start the game! */ });

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/objective'));
        assert.typeOf(settings.get('deathmatch/objective'), 'object');
        assert.deepEqual(settings.get('deathmatch/objective'), { type: 'Continuous' });

        // (3) Gunther is able to start a # of lives game.
        gunther.respondToDialog({ listitem: 2 /* Objective */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Number of lives... */ })).then(
            () => gunther.respondToDialog({ inputtext: '5' /* five lives */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
        
        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/objective'));
        assert.deepEqual(settings.get('deathmatch/objective'), {
            type: 'Number of lives...',
            lives: 5,
        });

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Objective',
            '{FFFF00}Lives (5)',
        ]);

        // (4) Gunther is able to start a Time limit... game.
        gunther.respondToDialog({ listitem: 2 /* Objective */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Time limit... */ })).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* invalid */ })).then(
            () => gunther.respondToDialog({ response: 1 /* try again */ })).then(
            () => gunther.respondToDialog({ inputtext: '9999' /* invalid */ })).then(
            () => gunther.respondToDialog({ response: 1 /* try again */ })).then(
            () => gunther.respondToDialog({ inputtext: '720' /* valid */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
        
        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/objective'));
        assert.deepEqual(
            settings.get('deathmatch/objective'), { type: 'Time limit...', seconds: 720 });

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Objective',
            '{FFFF00}Time limit (12 minutes)',
        ]);

        // (5) Gunther is able to start a Continuous game.
        gunther.respondToDialog({ listitem: 2 /* Objective */ }).then(
            () => gunther.respondToDialog({ listitem: 2 /* Continuous */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
        
        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/objective'));
        assert.deepEqual(settings.get('deathmatch/objective'), { type: 'Continuous' });

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Objective',
            'Continuous',  // default value
        ]);

        // (6) Gunther should be able to opt out of the dialog immediately.
        gunther.respondToDialog({ listitem: 2 /* Objective */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Time limit... */ })).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* invalid */ })).then(
            () => gunther.respondToDialog({ response: 0 /* give up */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
        
        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/objective'));
        assert.deepEqual(settings.get('deathmatch/objective'), { type: 'Continuous' });
    });
});
