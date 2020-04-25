// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommunicationCommands } from 'features/nuwani_commands/communication_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = '[BB]Ricky92';
const kCommandSource = '[BB]Ricky92!ricky@lvp.administrator';

describe('CommunicationCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let commands = null;
    let gunther = null;
    let nuwani = null;

    beforeEach(() => {
        const announce = server.featureManager.loadFeature('announce');

        bot = new TestBot();
        nuwani = server.featureManager.loadFeature('nuwani');
    
        commandManager = nuwani.commandManager;
        commands = new CommunicationCommands(commandManager, () => announce, () => nuwani);

        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.level = Player.LEVEL_ADMINISTRATOR;
    });

    afterEach(() => {
        commands.dispose();
        bot.dispose();
    });

    it('should be able to send a message to all in-game administrators', async (assert) => {
        const noAccessResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!admin Hello dear admins',
        });

        assert.equal(noAccessResult.length, 1);
        assert.equal(
            noAccessResult[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, this command is only available to administrators.');

        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!admin Hello dear admins',
        });

        // For legacy reasons, the !admin command does not acknowledge execution.
        assert.equal(result.length, 0);

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.IRC_ADMIN_MESSAGE, 'Admin', kCommandSourceUsername,
                                    'Hello dear admins'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.equal(nuwani.messagesForTesting[0].tag, 'chat-admin-irc');
    });

    it('should be able make an announcement to in-game players', async (assert) => {
        const noAccessResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!announce The server will be rebooting!',
        });

        assert.equal(noAccessResult.length, 1);
        assert.equal(
            noAccessResult[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, this command is only available to administrators.');

        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!announce The server will be rebooting soon!',
        });

        assert.equal(result.length, 1);
        assert.isTrue(result[0].includes('Success'));

        assert.equal(gunther.messages.length, 4);
        assert.equal(gunther.messages[0], Message.IRC_ANNOUNCE_DIVIDER);
        assert.equal(gunther.messages[1],
            Message.format(Message.IRC_ANNOUNCE_MESSAGE, 'The server will be rebooting soon!'));
        assert.equal(gunther.messages[2], Message.IRC_ANNOUNCE_DIVIDER);
        assert.isTrue(
            gunther.messages[3].includes(Message.format(Message.IRC_ANNOUNCE_ADMIN,
                                                        kCommandSourceUsername)));

        assert.equal(nuwani.messagesForTesting.length, 2);
        assert.equal(nuwani.messagesForTesting[0].tag, 'notice-admin');
        assert.equal(nuwani.messagesForTesting[1].tag, 'notice-announce');
    });

    it('should be able to send messages to in-game players', async (assert) => {
        const wrongChannelResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!msg What do you call a fake noodle? An impasta.',
            target: '#private',
        });

        assert.equal(wrongChannelResult.length, 0);

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!msg What do you call a fake noodle? An impasta.',
        });

        assert.equal(result.length, 0);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.IRC_MESSAGE, kCommandSourceUsername,
                           'What do you call a fake noodle? An impasta.'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.equal(nuwani.messagesForTesting[0].tag, 'chat-from-irc');
    });

    it('should be able to highlight a message to in-game players', async (assert) => {
        const noAccessResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!say Last warning!',
        });

        assert.equal(noAccessResult.length, 1);
        assert.equal(
            noAccessResult[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, this command is only available to administrators.');

        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!say Last warning!',
        });

        assert.equal(result.length, 1);
        assert.isTrue(result[0].includes('Success'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
            Message.format(Message.IRC_SAY_MESSAGE, kCommandSourceUsername, 'Last warning!'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.equal(nuwani.messagesForTesting[0].tag, 'notice-say');
    });

    it('should be able to send VIP messages to in-game players', async (assert) => {
        gunther.setVip(true);

        const noAccessResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!vip I wish this amazing feature was available',
        });

        assert.equal(noAccessResult.length, 1);
        assert.equal(
            noAccessResult[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, this command is only available to specific people.');

        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'v');

        const wrongChannelResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!vip I wish this amazing feature was available',
            target: '#private',
        });

        assert.equal(wrongChannelResult.length, 0);

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!vip I wish this amazing feature was available',
        });

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.IRC_VIP_MESSAGE, kCommandSourceUsername,
                           'I wish this amazing feature was available'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.equal(nuwani.messagesForTesting[0].tag, 'chat-vip-irc');
    });
});
