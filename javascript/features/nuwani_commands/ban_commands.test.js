// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanCommands } from 'features/nuwani_commands/ban_commands.js';
import { BanDatabase } from 'features/nuwani_commands/ban_database.js';
import { MockBanDatabase } from 'features/nuwani_commands/test/mock_ban_database.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { ip2long } from 'features/nuwani_commands/ip_utilities.js';
import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = 'Holsje';
const kCommandSource = 'Holsje!theone@lvp.administrator';

describe('BanCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let commands = null;
    let database = null;
    let gunther = null;
    let lucy = null;

    beforeEach(() => {
        const announce = server.featureManager.loadFeature('announce');
        const nuwani = server.featureManager.loadFeature('nuwani');

        bot = new TestBot();
        commandManager = nuwani.commandManager;
        commands = new BanCommands(nuwani.commandManager, () => announce, MockBanDatabase);
        database = commands.database_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.identify();

        lucy = server.playerManager.getById(/* Lucy= */ 2);
        lucy.identify();
    });

    afterEach(() => {
        commands.dispose();
        bot.dispose();
    });

    // Utility function for validating that the ban duration has a sensible length.
    async function assertDurationConstraints(assert, commandBase) {
        const kErrorMessage = `The ban duration must be between ${BanDatabase.kMinimumDuration} ` +
                              `and ${BanDatabase.kMaximumDuration} days.`;

        const durationTooShort = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: commandBase.replace('?', '-15'),
        });

        assert.equal(durationTooShort.length, 1);
        assert.equal(durationTooShort[0], `PRIVMSG #LVP.DevJS :Error: ${kErrorMessage}`);
        

        const durationTooLong = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: commandBase.replace('?', '5000'),
        });

        assert.equal(durationTooLong.length, 1);
        assert.equal(durationTooLong[0], `PRIVMSG #LVP.DevJS :Error: ${kErrorMessage}`);
    }

    // Utility function for verifying that the note constraints are properly applied to the
    // command that starts with |commandBase|. Various forms of notes will be added to it.
    async function assertNoteConstraints(assert, commandBase) {
        const noteTooShort = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `${commandBase} ban`
        });

        assert.equal(noteTooShort.length, 1);
        assert.equal(
            noteTooShort[0],
            'PRIVMSG #LVP.DevJS :Error: The note must be between 4 and 128 characters in length.');
        

        const noteTooLong = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `${commandBase} ${'a'.repeat(500)}`
        });

        assert.equal(noteTooLong.length, 1);
        assert.equal(
            noteTooLong[0],
            'PRIVMSG #LVP.DevJS :Error: The note must be between 4 and 128 characters in length.');
    }

    it('should be able to add notes to player records', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        await assertNoteConstraints(assert, '!addnote Specifer');

        const regularNote = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!addnote Specifer Issued a warning on the forums',
        });

        assert.equal(regularNote.length, 1);
        assert.equal(
            regularNote[0],
            'PRIVMSG #LVP.DevJS :Success: The note for Specifer has been added to their record.');
        
        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeNote);
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectUserId, 0);
        assert.equal(database.addedEntry.subjectNickname, 'Specifer');
        assert.equal(database.addedEntry.note, 'Issued a warning on the forums');

        assert.equal(gunther.messages.length, 0);

        const associatedNote = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!addnote ${lucy.name} Has been in-game for weeks?!`,
        });

        assert.equal(associatedNote.length, 1);
        assert.equal(associatedNote[0], `PRIVMSG #LVP.DevJS :Success: The note for ` +
                                        `${lucy.name} has been added to their record.`);

        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeNote);
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectUserId, lucy.userId);
        assert.equal(database.addedEntry.subjectNickname, lucy.name);
        assert.equal(database.addedEntry.note, 'Has been in-game for weeks?!');

        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.NUWANI_ADMIN_ADDED_NOTE, kCommandSourceUsername, lucy.name,
                          lucy.id, 'Has been in-game for weeks?!'));
    });

    it('should be able to ban in-game players', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        await assertDurationConstraints(assert, `!ban ${lucy.id} ? reason`);
        await assertNoteConstraints(assert, `!ban ${lucy.id} 5`);

        assert.isTrue(lucy.isConnected());

        const ipAddress = lucy.ip;
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!ban ${lucy.name} 5 Idling on the ship`,
        });

        assert.isFalse(lucy.isConnected());

        assert.equal(result.length, 1);
        assert.equal(result[0],
                     `PRIVMSG #LVP.DevJS :Success: ${lucy.name} has been banned from the game.`);
        
        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeBan);
        assert.equal(database.addedEntry.banDurationDays, 5);
        assert.equal(database.addedEntry.banIpRangeStart, ip2long(ipAddress));
        assert.equal(database.addedEntry.banIpRangeEnd, ip2long(ipAddress));
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectUserId, lucy.userId);
        assert.equal(database.addedEntry.subjectNickname, lucy.name);
        assert.equal(database.addedEntry.note, 'Idling on the ship');

        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.NUWANI_ADMIN_BANNED, kCommandSourceUsername, lucy.name, lucy.id,
                          5, 'Idling on the ship'));
    });

    it('should be able to people by their IP address', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        await assertDurationConstraints(assert, '!ban ip 127.0.0.1 Lucy ? reason');
        await assertNoteConstraints(assert, '!ban ip 127.0.0.1 Lucy 10');

        const invalidAddress = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!ban ip 127.0.0 Lucy 15 reason`,
        });

        assert.equal(invalidAddress.length, 1);
        assert.equal(
            invalidAddress[0],
            'PRIVMSG #LVP.DevJS :Error: The IP address must be in the format of 37.48.87.211.');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!ban ip 127.0.0.1 Lucy 10 reason`,
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Success: The IP address 127.0.0.1 has been banned from the game.');
        
        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeBanIp);
        assert.equal(database.addedEntry.banDurationDays, 10);
        assert.equal(database.addedEntry.banIpRangeStart, ip2long('127.0.0.1'));
        assert.equal(database.addedEntry.banIpRangeEnd, ip2long('127.0.0.1'));
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectNickname, 'Lucy');
        assert.equal(database.addedEntry.note, 'reason');
    });

    it('should be able to people by ranges of IP addresses', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        await assertDurationConstraints(assert, '!ban range 37.48.*.* Gunther ? reason');
        await assertNoteConstraints(assert, '!ban range 37.48.*.* Gunther 15');

        const invalidAddress = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!ban range banana Lucy 15 reason`,
        });

        assert.equal(invalidAddress.length, 1);
        assert.equal(
            invalidAddress[0],
            'PRIVMSG #LVP.DevJS :Error: The IP address must be in the format of 37.48.87.*.');

        const invalidRange = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!ban range 127.*.0.* Lucy 15 reason`,
        });

        assert.equal(invalidRange.length, 1);
        assert.equal(invalidRange[0],
                    'PRIVMSG #LVP.DevJS :Error: Only more wildcards may follow a wildcard octet.');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!ban range 127.0.*.* Lucy 15 reason`,
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Success: The IP range 127.0.*.* has been banned from the game.');
        
        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeBanIp);
        assert.equal(database.addedEntry.banDurationDays, 15);
        assert.equal(database.addedEntry.banIpRangeStart, ip2long('127.0.0.0'));
        assert.equal(database.addedEntry.banIpRangeEnd, ip2long('127.0.255.255'));
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectNickname, 'Lucy');
        assert.equal(database.addedEntry.note, 'reason');
    });

    it('should be able to people by their in-game serial (GCPI) number', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        await assertDurationConstraints(assert, '!ban serial 1485609655 Gunther ? reason');
        await assertNoteConstraints(assert, '!ban serial 1485609655 Gunther 20');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!ban serial 1485609655 Lucy 20 reason yeah`,
        });

        assert.equal(result.length, 1);
        assert.equal(result[0],
                     'PRIVMSG #LVP.DevJS :Success: The serial 1485609655 has been banned ' +
                     'from the game.');
        
        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeBan);
        assert.equal(database.addedEntry.banDurationDays, 20);
        assert.equal(database.addedEntry.banSerial, 1485609655);
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectNickname, 'Lucy');
        assert.equal(database.addedEntry.note, 'reason yeah');
    });

    it('should be able to see if a ban exists for certain conditions', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // !isbanned [nickname | ip | ip range | serial]
    });

    it('should be able to kick in-game players from the game', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        await assertNoteConstraints(assert, '!kick 0');

        assert.isTrue(lucy.isConnected());

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: `!kick ${lucy.name} Idling on the ship`,
        });

        assert.isFalse(lucy.isConnected());

        assert.equal(result.length, 1);
        assert.equal(result[0],
                     `PRIVMSG #LVP.DevJS :Success: ${lucy.name} has been kicked from the game.`);
        
        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeKick);
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectUserId, lucy.userId);
        assert.equal(database.addedEntry.subjectNickname, lucy.name);
        assert.equal(database.addedEntry.note, 'Idling on the ship');

        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.NUWANI_ADMIN_KICKED, kCommandSourceUsername, lucy.name, lucy.id,
                          'Idling on the ship'));
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
