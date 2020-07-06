// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { EnvironmentSettings } from 'features/games/environment_settings.js';
import { GameCommandParams } from 'features/games/game_command_params.js';
import { GameDescription } from 'features/games/game_description.js';
import { Game } from 'features/games/game.js';

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
            goal: 'Show a fancy dialog with the default environment options',
            command: 'bubblegame',
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
                'Environment',
                'Sunny afternoon',
            ]
        ]);

        // (2) Gunther is able to start a game with default settings.
        gunther.respondToDialog({ listitem: 0 /* Start the game! */ });

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('game/environment'));
        assert.typeOf(settings.get('game/environment'), 'object');
        assert.deepEqual(settings.get('game/environment'), {
            time: 'Afternoon',
            weather: 'Sunny',
            gravity: 'Normal',
        });

        // (3) Gunther should be able to change the gravity.
        gunther.respondToDialog({ listitem: 2 /* Environment */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Gravity */ })).then(
            () => gunther.respondToDialog({ listitem: 2 /* High */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.deepEqual(settings.get('game/environment'), {
            time: 'Afternoon',
            weather: 'Sunny',
            gravity: 'High',
        });

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Environment',
            '{FFFF00}Sunny afternoon, high gravity',
        ]);

        // (4) Gunther should be able to change the time.
        gunther.respondToDialog({ listitem: 2 /* Environment */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Time */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Morning */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.deepEqual(settings.get('game/environment'), {
            time: 'Morning',
            weather: 'Sunny',
            gravity: 'Normal',
        });

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Environment',
            '{FFFF00}Sunny morning',
        ]);

        // (5) Gunther should be able to change the weather.
        gunther.respondToDialog({ listitem: 2 /* Environment */ }).then(
            () => gunther.respondToDialog({ listitem: 2 /* Weather */ })).then(
            () => gunther.respondToDialog({ listitem: 4 /* Sandstorm */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.deepEqual(settings.get('game/environment'), {
            time: 'Afternoon',
            weather: 'Sandstorm',
            gravity: 'Normal',
        });

        assert.equal(gunther.getLastDialogAsTable().rows.length, 3);
        assert.deepEqual(gunther.getLastDialogAsTable().rows[2], [
            'Environment',
            '{FFFF00}Afternoon sandstorm',
        ]);
    });
});
