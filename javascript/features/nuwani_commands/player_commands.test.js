// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerCommands } from 'features/nuwani_commands/player_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = 'Beaner';
const kCommandSource = 'Beaner!thebean@lvp.administrator';

describe('PlayerCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let commands = null;

    beforeEach(() => {
        const nuwani = server.featureManager.loadFeature('nuwani');

        bot = new TestBot();

        commandManager = nuwani.commandManager;
        commands = new PlayerCommands(commandManager);
    });

    afterEach(() => {
        commands.dispose();
        bot.dispose();
    });

    it('should be able to find players by their in-game nickname', async (assert) => {
        const notFound = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getid Beaner',
        });

        assert.equal(notFound.length, 1);
        assert.equal(
            notFound[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, no player could be found for "Beaner".');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getid Gunt',
        });

        assert.equal(result.length, 1);
        assert.equal(result[0], 'PRIVMSG #LVP.DevJS :*** Gunther (Id:0)');
    });

    it('should be able to find players by their in-game player Id', async (assert) => {
        const notFound = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getname 51',
        });

        assert.equal(notFound.length, 1);
        assert.equal(
            notFound[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, no player could be found for "51".');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getname 2',
        });

        assert.equal(result.length, 1);
        assert.equal(result[0], 'PRIVMSG #LVP.DevJS :*** Lucy (Id:2)');
    });

    it('should be able to list all in-game players', async (assert) => {
        let result;

        result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players',
        });

        assert.equal(result.length, 1);
        assert.equal(result[0], 'PRIVMSG #LVP.DevJS :Online players (3): Gunther, Lucy, Russell');

        // Ignore players when they've registered as a non-playing character.
        server.playerManager.getByName('Lucy').setNonPlayerCharacter(true);

        result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players',
        });

        assert.equal(result.length, 1);
        assert.equal(result[0], 'PRIVMSG #LVP.DevJS :Online players (2): Gunther, Russell');
    });
});
