// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCommandParams } from 'features/games/game_command_params.js';
import { GameDescription } from 'features/games/game_description.js';
import { Game } from 'features/games/game.js';
import { ObjectiveSetting } from 'features/games_deathmatch/objective_setting.js';
import { Question } from 'components/dialogs/question.js';
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

            settings: [
                new Setting(
                    'deathmatch', 'objective', new ObjectiveSetting(),
                    ObjectiveSetting.getDefaultValue({ objective: 'Last man standing' }),
                    'Objective')
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
                'Objective',
                'Last man standing',
            ]
        ]);

        // (2) Gunther is able to start a game, which will reflect the default settings.
        gunther.respondToDialog({ listitem: 0 /* Start the game! */ });

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('deathmatch/objective'));
        assert.typeOf(settings.get('deathmatch/objective'), 'object');
        assert.deepEqual(settings.get('deathmatch/objective'), { type: 'Last man standing' });

        // TODO...
    });
});
