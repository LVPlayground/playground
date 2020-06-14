// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = '[BB]Ricky92';
const kCommandSource = '[BB]Ricky92!ricky@lvp.administrator';

describe('NuwaniCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let gunther = null;
    let nuwani = null;

    beforeEach(() => {
        server.featureManager.loadFeature('communication_commands');

        bot = new TestBot();
        nuwani = server.featureManager.loadFeature('nuwani');
    
        commandManager = nuwani.commandManager;

        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.level = Player.LEVEL_ADMINISTRATOR;
    });

    afterEach(() => bot.dispose());

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
        assert.includes(result[0], 'Success');

        assert.equal(gunther.messages.length, 4);
        assert.equal(gunther.messages[0], Message.IRC_ANNOUNCE_DIVIDER);
        assert.equal(gunther.messages[1],
            Message.format(Message.IRC_ANNOUNCE_MESSAGE, 'The server will be rebooting soon!'));
        assert.equal(gunther.messages[2], Message.IRC_ANNOUNCE_DIVIDER);
        assert.includes(gunther.messages[3], Message.format(Message.IRC_ANNOUNCE_ADMIN,
                                                            kCommandSourceUsername));

        assert.equal(nuwani.messagesForTesting.length, 2);
        assert.equal(nuwani.messagesForTesting[0].tag, 'notice-admin');
        assert.equal(nuwani.messagesForTesting[1].tag, 'notice-announce');
    });

    it('should be able to share a Discord link', async (assert) => {
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!discord',
        });

        assert.equal(result.length, 1);
        assert.includes(result[0], 'https://discord.sa-mp.nl/');
    });

    it('responds to the !hello command', async (assert) => {
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!help',
        });
        
        assert.equal(result.length, 2);
        assert.includes(result[0], '!getid, !getname, !msg, !players, !pm, !vip, !discord');
        assert.includes(
            result[1], 'Register for an account on https://sa-mp.nl/, and use the in-game ' +
                       '"/account" command to change your name, password and settings.');
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

    it('should be able to send private messages to in-game players', async (assert) => {
        const unknownPlayer = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!pm Kate Have you heard from Leo lately?',
        });

        assert.equal(unknownPlayer.length, 1);
        assert.equal(
            unknownPlayer[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, no player could be found for "Kate".');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!pm Gunt Hey Gunther!',
        });
        
        assert.equal(result.length, 1);
        assert.includes(result[0], 'Success');
        assert.includes(result[0], 'Gunther');

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.COMMUNICATION_PM_IRC_RECEIVER, kCommandSourceUsername,
                           'Hey Gunther!'));

        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_IRC_PM_ADMIN, kCommandSourceUsername, gunther.name,
                           gunther.id, 'Hey Gunther!'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.equal(nuwani.messagesForTesting[0].tag, 'chat-private-irc');
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
        assert.includes(result[0], 'Success');

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

    it('has the ability to integrate with communication message filtering', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'v');

        // (1) Integration with the spam filter.
        let spamming = false;

        for (let i = 0; i < 5; ++i) {
            const result = await issueCommand(bot, commandManager, {
                source: kCommandSource,
                command: '!vip I wish this amazing feature was available',
            });

            if (!result.length)
                continue;

            assert.includes(result[0], 'blocked by our spam filter');

            spamming = true;
            break;
        }

        assert.isTrue(spamming);

        // (2) Integration with the message filter.
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!vip You should /quit!',
        });

        assert.equal(result.length, 1);
        assert.includes(result[0], 'includes a forbidden word');
    });

    it('should be able to mute and unmute in-game players', async (assert) => {
        const communication = server.featureManager.loadFeature('communication');
        const muteManager = communication.muteManager_;

        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        assert.isNull(muteManager.getPlayerRemainingMuteTime(gunther));

        const noMutes = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!muted',
        });

        assert.equal(noMutes.length, 1);
        assert.includes(noMutes[0], 'Nobody is muted');

        const setMute = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!mute Gunther',
        });

        assert.equal(setMute.length, 1);
        assert.includes(setMute[0], 'Gunther has been muted for 2 minutes');

        assert.closeTo(muteManager.getPlayerRemainingMuteTime(gunther), 120, 5);

        const muted = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!muted',
        });

        assert.equal(muted.length, 1);
        assert.includes(muted[0], 'Gunther (expires in 2 minutes)');

        const updateMute = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!mute Gunther 4',
        });

        assert.equal(updateMute.length, 1);
        assert.includes(updateMute[0], 'Gunther has been muted for 4 minutes');

        assert.closeTo(muteManager.getPlayerRemainingMuteTime(gunther), 240, 5);

        const removeMute = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!unmute 0',
        });

        assert.equal(removeMute.length, 1);
        assert.includes(removeMute[0], 'Gunther has been unmuted');

        assert.isNull(muteManager.getPlayerRemainingMuteTime(gunther));
    });
});
