// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCommandParams } from 'features/games/game_command_params.js';
import { GameCustomSetting } from 'features/games/game_custom_setting.js';
import { GameDescription } from 'features/games/game_description.js';
import { Game } from 'features/games/game.js';
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

        const customSetting = new class extends GameCustomSetting {
            getCustomizationDialogValue(currentValue) {
                return `${currentValue.length} values`;
            }

            async handleCustomization(player, settings, currentValue) {
                const result = await Question.ask(player, {
                    question: 'Which number to add?',
                    constraints: {
                        validation: /^\d+$/,  // numbers only
                        explanation: 'Only numbers can be accepted.',
                    }
                });

                if (!result)
                    return null;

                settings.set('bubble/custom', [ ...currentValue, parseInt(result) ]);
            }
        };

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Show a fancy dialog with customised options',
            command: 'bubblegame',

            settings: [
                new Setting('bubble', 'custom', customSetting, [ 1, 2, 3 ], 'Custom setting')
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
                'Custom setting',
                '3 values',
            ]
        ]);

        // (2) Gunther is able to start a game, which will reflect the default settings.
        gunther.respondToDialog({ listitem: 0 /* Start the game! */ });

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.isTrue(settings.has('bubble/custom'));
        assert.typeOf(settings.get('bubble/custom'), 'object');
        assert.isTrue(Array.isArray(settings.get('bubble/custom')));
        assert.deepEqual(settings.get('bubble/custom'), [ 1, 2, 3 ]);

        // (3) Gunther is able to customise the setting, see that reflected immediately, and is able
        // to start the game with the customised settings.
        gunther.respondToDialog({ listitem: 2 /* Custom setting */ }).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* fails validation */ })).then(
            () => gunther.respondToDialog({ response: 1 /* try again */ })).then(
            () => gunther.respondToDialog({ inputtext: '42' })).then(
            () => gunther.respondToDialog({ listitem: 2 /* Custom setting */ })).then(
            () => gunther.respondToDialog({ inputtext: '134' })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));

        settings = await commands.determineSettings(description, gunther, params);
        assert.isNotNull(settings);

        assert.deepEqual(settings.get('bubble/custom'), [ 1, 2, 3, 42, 134 ]);
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
                'Custom setting',
                '{FFFF00}5 values',
            ]
        ]);
    });
});
