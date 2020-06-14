// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { PlaygroundNuwaniCommands } from 'features/playground/playground_nuwani_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = 'Xanland';
const kCommandSource = 'Xanland!xander@lvp.administrator';

describe('PlaygroundNuwaniCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let commands = null;
    let gunther = null;

    beforeEach(() => {
        const announce = server.featureManager.loadFeature('announce');
        const nuwani = server.featureManager.loadFeature('nuwani');

        bot = new TestBot();
        commandManager = nuwani.commandManager;
        commands = new PlaygroundNuwaniCommands(() => announce, () => nuwani);

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        gunther.level = Player.LEVEL_ADMINISTRATOR;
    });

    afterEach(() => {
        commands.dispose();
        bot.dispose();
    });

    it('should be able to respond with usage by default', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!lvp',
        });

        assert.equal(result.length, 1);
        assert.includes(result[0], 'Usage:');
    });

    it('should be able to reload the message format', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!lvp reload messages',
        });

        assert.equal(result.length, 1);
        assert.includes(result[0], 'Success');
        assert.includes(result[0], 'messages have been loaded');
    });

    it('should be able to reload features', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        let ineligibleFeatureLoadedCount = 0;
        let ineligibleFeatureDisposedCount = 0;

        class IneligibleFeature extends Feature {
            constructor() {
                super();
                this.disableLiveReload();
                ++ineligibleFeatureLoadedCount;
            }
            dispose() {
                ++ineligibleFeatureDisposedCount;
            }
        }

        let errorFeatureLoadedCount = 0;
        let errorFeatureDisposedCount = 0;

        class ErrorFeature extends Feature {
            constructor() {
                super();
                ++errorFeatureLoadedCount;
            }
            dispose() {
                ++errorFeatureDisposedCount;

                if (errorFeatureDisposedCount === 1)
                    throw new Error('Something went wrong!');
            }
        }

        let regularFeatureLoadedCount = 0;
        let regularFeatureDisposedCount = 0;

        class RegularFeature extends Feature {
            constructor() {
                super();
                ++regularFeatureLoadedCount;
            }
            dispose() {
                ++regularFeatureDisposedCount;
            }
        }

        server.featureManager.registerFeaturesForTests({
            error: ErrorFeature,
            ineligible: IneligibleFeature,
            regular: RegularFeature,
        });

        // Load the mock features we've defined above.
        server.featureManager.loadFeature('error');
        server.featureManager.loadFeature('ineligible');
        server.featureManager.loadFeature('regular');

        const nonExistingFeature = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!lvp reload pony_tracker',
        });

        assert.equal(nonExistingFeature.length, 1);
        assert.includes(nonExistingFeature[0], 'feature does not exist');

        const ineligibleFeature = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!lvp reload ineligible',
        });

        assert.equal(ineligibleFeature.length, 1);
        assert.includes(ineligibleFeature[0], 'feature is not eligible');

        assert.equal(ineligibleFeatureLoadedCount, 1);
        assert.equal(ineligibleFeatureDisposedCount, 0);

        const errorFeature = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!lvp reload error',
        });

        assert.equal(errorFeature.length, 1);
        assert.includes(errorFeature[0], 'Something went wrong!');

        assert.equal(errorFeatureLoadedCount, 1);
        assert.equal(errorFeatureDisposedCount, 1);

        const regularFeature = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!lvp reload regular',
        });

        assert.equal(regularFeature.length, 1);
        assert.includes(regularFeature[0], 'feature has been reloaded');

        assert.equal(regularFeatureLoadedCount, 2);
        assert.equal(regularFeatureDisposedCount, 1);
    });
});
