// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanCommands } from 'features/nuwani_commands/ban_commands.js';
import { MockBanDatabase } from 'features/nuwani_commands/test/mock_ban_database.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = 'Holsje';
const kCommandSource = 'Holsje!theone@lvp.administrator';

describe('BanCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let commands = null;

    beforeEach(() => {
        const nuwani = server.featureManager.loadFeature('nuwani');

        bot = new TestBot();
        commandManager = nuwani.commandManager;
        commands = new BanCommands(nuwani.commandManager, MockBanDatabase);
    });

    afterEach(() => {
        commands.dispose();
        bot.dispose();
    });

    it('should be able to add notes to player records', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !addnote [nickname] [note]
    });

    it('should be able to ban in-game players', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !ban [player] [days=3] [reason]
    });

    it('should be able to people by their IP address', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !ban ip [ip] [nickname] [days] [reason]
    });

    it('should be able to people by ranges of IP addresses', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !ban range [ip range] [nickname] [days] [reason]
    });

    it('should be able to people by their in-game serial (GCPI) number', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !ban serial [serial] [nickname] [days] [reason]
    });

    it('should be able to see if a ban exists for certain conditions', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !isbanned [nickname | ip | ip range | serial]
    });

    it('should be able to kick in-game players from the game', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !kick [player] [reason]
    });

    it('should be able to list the most recent bans', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !lastbans
    });

    it('should be able to find IP information based on certain conditions', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !ipinfo [nickname | ip | ip range]
    });

    it('should be able to find serial information based on certain conditions', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !serialinfo [nickname | serial]
    });

    it('should be able to display recent entries in a player record', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !why [nickname]
    });

    it('should be able to list previously issued bans', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !unban [ip | ip range | serial] [note]
    });
});
