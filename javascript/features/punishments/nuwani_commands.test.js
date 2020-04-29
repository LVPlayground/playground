// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';
import { MockBanDatabase } from 'features/punishments/test/mock_ban_database.js';
import { NuwaniCommands } from 'features/punishments/nuwani_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { ip2long } from 'features/nuwani_commands/ip_utilities.js';
import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = 'Holsje';
const kCommandSource = 'Holsje!theone@lvp.administrator';

describe('NuwaniCommands', (it, beforeEach, afterEach) => {
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
        commands = new NuwaniCommands(nuwani.commandManager, () => announce, MockBanDatabase);
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
        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0], Message.format(Message.NUWANI_PLAYER_BANNED_NOTICE,
                                             kCommandSourceUsername, 5, 'Idling on the ship'));

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
            command: `!ban ip 127.0.0.2 Lucy 10 reason`,
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Success: The IP address 127.0.0.2 has been banned from the game.');
        
        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeBanIp);
        assert.equal(database.addedEntry.banDurationDays, 10);
        assert.equal(database.addedEntry.banIpRangeStart, ip2long('127.0.0.2'));
        assert.equal(database.addedEntry.banIpRangeEnd, ip2long('127.0.0.2'));
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectNickname, 'Lucy');
        assert.equal(database.addedEntry.note, 'reason');
    });

    it('should disconnect in-game players in case their IP gets banned', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        server.playerManager.onPlayerConnect({
            playerid: 42,
            name: 'EvilJoe',
            ip: '8.8.8.8',
        });

        const evilJoe = server.playerManager.getById(/* EvilJoe= */ 42);
        assert.isNotNull(evilJoe);
        assert.isTrue(evilJoe.isConnected());

        const ingameResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!ban ip 8.8.8.8 [BB]Joe 3 Sharing knowledge',
        });

        assert.equal(ingameResult.length, 1);
        assert.equal(
            ingameResult[0],
            'PRIVMSG #LVP.DevJS :Success: The IP address 8.8.8.8 has been banned from the game.');
        
        assert.isFalse(evilJoe.isConnected());
        assert.equal(evilJoe.messages.length, 1);
        assert.equal(
            evilJoe.messages[0], Message.format(Message.NUWANI_PLAYER_BANNED_NOTICE,
                                                kCommandSourceUsername, 3, 'Sharing knowledge'));

        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.NUWANI_ADMIN_BANNED_GROUP, kCommandSourceUsername,
                           'EvilJoe (Id:42)', 3, 'Sharing knowledge'));
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

    it('should disconnect in-game players in case their IP gets range-banned', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        server.playerManager.onPlayerConnect({
            playerid: 15,
            name: 'InnocentJoe',
            ip: '8.8.0.1',
        });

        server.playerManager.onPlayerConnect({
            playerid: 42,
            name: 'EvilJoe',
            ip: '8.8.4.4',
        });

        server.playerManager.onPlayerConnect({
            playerid: 43,
            name: 'EvilerJoe',
            ip: '8.8.8.8',
        });

        server.playerManager.onPlayerConnect({
            playerid: 44,
            name: 'SuperEvilJoe',
            ip: '8.8.200.41',
        });

        let evilJoes = [];

        // Aggregate all the evil Joes in the |evilJoes| array, and make sure they're connected.
        for (const playerId of [15, 42, 43, 44]) {
            const player = server.playerManager.getById(playerId);
            assert.isNotNull(player);
            assert.isTrue(player.isConnected());

            evilJoes.push(player);
        }

        const ingameResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!ban range 8.8.*.* [BB]Joe 14 funny together',
        });

        assert.equal(ingameResult.length, 1);
        assert.equal(
            ingameResult[0],
            'PRIVMSG #LVP.DevJS :Success: The IP range 8.8.*.* has been banned from the game.');
        
        for (const player of evilJoes) {
            assert.isFalse(player.isConnected());
            assert.equal(player.messages.length, 1);
            assert.equal(
                player.messages[0], Message.format(Message.NUWANI_PLAYER_BANNED_NOTICE,
                                                   kCommandSourceUsername, 14, 'funny together'));
        }

        assert.equal(gunther.messages.length, 2);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.NUWANI_ADMIN_BANNED_GROUP, kCommandSourceUsername,
                           'InnocentJoe (Id:15), EvilJoe (Id:42), EvilerJoe (Id:43)',
                           14, 'funny together'));
        
        assert.includes(
            gunther.messages[1],
            Message.format(Message.NUWANI_ADMIN_BANNED_GROUP, kCommandSourceUsername,
                           'SuperEvilJoe (Id:44)', 14, 'funny together'));
        
        // Make sure that the other players are still in-game.
        assert.isTrue(gunther.isConnected());
        assert.isTrue(lucy.isConnected());
    });

    it('should limit the breadth of range bans based on user level', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const excessAdminBan = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!ban range 8.*.*.* [BB]Joe 14 excellent ban reason',
        });

        assert.equal(excessAdminBan.length, 1);
        assert.equal(excessAdminBan[0],
                     `PRIVMSG #LVP.DevJS :Error: You're not allowed to ban more than 65,536 IP ` +
                     `addresses at a time. This ban would affect 16,777,216 addresses.`);
        
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const excessManagementBan = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!ban range *.*.*.* [BB]Joe 14 BAN THE WORLD!!`1',
        });

        assert.equal(excessManagementBan.length, 1);
        assert.equal(excessManagementBan[0],
                     `PRIVMSG #LVP.DevJS :Error: You're not allowed to ban more than 16,777,216 ` +
                     `IP addresses at a time. This ban would affect 4,294,967,296 addresses.`);
                    
        const normalManagementBan = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!ban range 8.*.*.* [BB]Joe 14 excellent ban reason',
        });

        assert.equal(normalManagementBan.length, 1);
        assert.equal(
            normalManagementBan[0],
            `PRIVMSG #LVP.DevJS :Success: The IP range 8.*.*.* has been banned from the game.`);
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

    it('should disconnect in-game players in case their serial gets banned', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        server.playerManager.onPlayerConnect({
            playerid: 42,
            name: 'EvilJoe',
            gpci: 'ED8C58A99DC5E8909458E9994D9DACEDEC4D9AEA',
        });

        const evilJoe = server.playerManager.getById(/* EvilJoe= */ 42);
        assert.isNotNull(evilJoe);
        assert.isTrue(evilJoe.isConnected());

        const ingameResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!ban serial 648955637 [BB]Joe 3 pdf files ugh',
        });

        assert.equal(ingameResult.length, 1);
        assert.equal(
            ingameResult[0],
            'PRIVMSG #LVP.DevJS :Success: The serial 648955637 has been banned from the game.');
        
        assert.isFalse(evilJoe.isConnected());
        assert.equal(evilJoe.messages.length, 1);
        assert.equal(
            evilJoe.messages[0], Message.format(Message.NUWANI_PLAYER_BANNED_NOTICE,
                                                kCommandSourceUsername, 3, 'pdf files ugh'));

        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.NUWANI_ADMIN_BANNED_GROUP, kCommandSourceUsername,
                           'EvilJoe (Id:42)', 3, 'pdf files ugh'));
    });

    it('should be able to see if a ban exists for certain conditions', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        // (1) Test error messages for invalid input.
        const invalidInput = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!isbanned ^^^MaXiMe^^^',
        });

        assert.equal(invalidInput.length, 1);
        assert.includes(invalidInput[0], 'Error');
        assert.includes(invalidInput[0], 'neither a nickname, serial number or IP address');
        
        // (2) Test the result message for no matching bans.
        const noResults = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!isbanned [BB]Ricky92',
        });

        assert.equal(noResults.length, 1);
        assert.includes(noResults[0], 'Result');
        assert.includes(noResults[0], 'No bans could be found');
        assert.includes(noResults[0], 'the given nickname');

        // (3) Make sure that IP addresses, nicknames and serial numbers can be matched.
        const ipResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!isbanned 37.48.87.10',
        });

        assert.equal(ipResult.length, 1);
        assert.includes(ipResult[0], 'Result');
        assert.includes(ipResult[0], '[BB]Joe');
        assert.includes(ipResult[0], '37.48.*.*');
        
        const nicknameResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!isbanned [BB]Joe',
        });

        assert.equal(nicknameResult.length, 1);
        assert.includes(nicknameResult[0], 'Result');
        assert.includes(nicknameResult[0], '[BB]Joe');
        assert.includes(nicknameResult[0], '37.48.87.211');

        const serialResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!isbanned 2657120904',
        });

        assert.equal(serialResult.length, 1);
        assert.includes(serialResult[0], 'Result');
        assert.includes(serialResult[0], 'Xanland');
        assert.includes(serialResult[0], '2657120904');
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
        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0], Message.format(Message.NUWANI_PLAYER_KICKED_NOTICE,
                                             kCommandSourceUsername, 'Idling on the ship'));

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

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!lastbans',
        });

        assert.equal(result.length, 1);
        assert.includes(result[0], 'Most recent bans:');

        assert.includes(result[0], '37.48.87.211');
        assert.includes(result[0], '37.48.*.*');
        assert.includes(result[0], '2657120904');
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

        const invalidConditional = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!unban ^^^MaXiMe^^^ reason',
        });

        assert.equal(invalidConditional.length, 1);
        assert.includes(invalidConditional[0], 'Error');
        assert.includes(invalidConditional[0], 'is neither a nickname');

        await assertNoteConstraints(assert, '!unban 127.0.0.1');

        const noMatches = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!unban 80.70.60.50 reason',
        });

        assert.equal(noMatches.length, 1);
        assert.includes(noMatches[0], 'Error');
        assert.includes(noMatches[0], 'No bans could be found');

        // Case: successful unban on a direct conditional match
        const directMatchUnban = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!unban 2657120904 reason',
        });

        assert.equal(directMatchUnban.length, 1);
        assert.includes(directMatchUnban[0], 'Success');
        assert.includes(directMatchUnban[0], 'Xanland');

        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeUnban);
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectNickname, 'Xanland');
        assert.equal(database.addedEntry.note, 'reason');

        // Case: successful unban on a direct nickname match
        const nicknameMatchUnban = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!unban [BB]EvilJoe unbanned',
        });

        assert.equal(nicknameMatchUnban.length, 1);
        assert.includes(nicknameMatchUnban[0], 'Success');
        assert.includes(nicknameMatchUnban[0], '60.224.118.*');

        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, BanDatabase.kTypeUnban);
        assert.equal(database.addedEntry.sourceNickname, kCommandSourceUsername);
        assert.equal(database.addedEntry.subjectNickname, '[BB]EvilJoe');
        assert.equal(database.addedEntry.note, 'unbanned');

        // Case: ambiguous command, with individual bans being shown
        const ambiguousUnban = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!unban 987654321 reason',
        });

        assert.equal(ambiguousUnban.length, 2);
        assert.includes(ambiguousUnban[0], 'Error');
        assert.includes(ambiguousUnban[0], 'multiple bans');
        assert.includes(ambiguousUnban[1], '[BB]Joe');
        assert.includes(ambiguousUnban[1], '[BB]EvilJoe');
    });
});
