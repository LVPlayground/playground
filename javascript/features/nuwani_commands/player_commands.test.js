// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockPlayerDatabase } from 'features/nuwani_commands/test/mock_player_database.js';
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
        commands = new PlayerCommands(commandManager, 's4lt', MockPlayerDatabase);
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

    it('should refuse to update the password of an in-game player', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!changepass ' + server.playerManager.getById(0).name,
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Error: Cannot update the password of in-game players.');
    });

    it('should be able to update a player password to a temporary one', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!changepass [BB]Ricky92',
        });

        assert.equal(result.length, 1);
        assert.isTrue(result[0].includes('Success'));
        assert.isTrue(/to ([a-zA-Z0-9]){12}\.$/.test(result[0]));

        assert.equal(commands.database_.changePassQueries.length, 1);
        assert.equal(commands.database_.changePassQueries[0].nickname, '[BB]Ricky92');
    });

    it('should be able to display a list of supported database fields', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!supported',
        });

        assert.equal(result.length, 1);
        assert.isTrue(result[0].includes('Supported fields'));
    });

    it('should be able to get individual account values for a player', async (assert) => {

    });

    it('should enable updating player information through the commands', async (assert) => {

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

    it('should be able to find information about a particular player', async (assert) => {
        const notFound = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players NameThatDoesNotExist',
        });

        assert.equal(notFound.length, 1);
        assert.equal(notFound[0], 'PRIVMSG #LVP.DevJS :Error: Sorry, the player ' +
                                  'NameThatDoesNotExist has not registered with Las Venturas ' +
                                  'Playground.');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players Beaner',
        });

        assert.equal(result.length, 1);
        assert.isFalse(result[0].includes('has not registered with us'));
    });

    it('should be able to format level information in player summaries', async (assert) => {
        const withLevelVip = async (level, vip) => {
            commands.database_.summary.level = level;
            commands.database_.summary.vip = vip;
            const result = await issueCommand(bot, commandManager, {
                source: kCommandSource,
                command: '!players Beaner',
            });

            return result[0];
        };

        assert.isTrue((await withLevelVip('Management', false)).includes('a Management member'));
        assert.isTrue((await withLevelVip('Administrator', false)).includes('an administrator'));
        assert.isTrue((await withLevelVip('Moderator', false)).includes('a player'));
        assert.isTrue((await withLevelVip('Player', false)).includes('a player'));
        assert.isTrue((await withLevelVip('Player', true)).includes('a VIP'));
    });

    it('should be able to format player online time in player summaries', async (assert) => {
        const withOnlineTime = async (time) => {
            commands.database_.summary.onlineTime = time;
            const result = await issueCommand(bot, commandManager, {
                source: kCommandSource,
                command: '!players Beaner',
            });

            return result[0];
        };

        assert.isTrue((await withOnlineTime(0)).includes('never been online yet'));
        assert.isTrue((await withOnlineTime(1)).includes('been online for 1 second.'));
        assert.isTrue((await withOnlineTime(2)).includes('been online for 2 seconds.'));
        assert.isTrue((await withOnlineTime(60)).includes('been online for 1 minute.'));
        assert.isTrue((await withOnlineTime(120)).includes('been online for 2 minutes.'));
        assert.isTrue((await withOnlineTime(3600)).includes('been online for 1 hour.'));
        assert.isTrue((await withOnlineTime(7200)).includes('been online for 2 hours.'));
        assert.isTrue(
            (await withOnlineTime(7200 * 1000)).includes('been online for 2,000 hours.'));
        assert.isTrue(
            (await withOnlineTime(3660)).includes('been online for 1 hour and 1 minute.'));
        assert.isTrue(
            (await withOnlineTime(3720)).includes('been online for 1 hour and 2 minutes.'));
        assert.isTrue(
            (await withOnlineTime(7260)).includes('been online for 2 hours and 1 minute.'));
        assert.isTrue((await withOnlineTime(12345678)).includes(
            'been online for 3,429 hours and 21 minutes.'));
    });

    it('should be able to format deathmatch information in player summaries', async (assert) => {
        const withKillDeaths = async (kills, deaths) => {
            commands.database_.summary.killCount = kills;
            commands.database_.summary.deathCount = deaths;
            const result = await issueCommand(bot, commandManager, {
                source: kCommandSource,
                command: '!players Beaner',
            });

            return result[0];
        };

        assert.isFalse((await withKillDeaths(0, 0)).includes('killed'));
        assert.isTrue((await withKillDeaths(5, 0)).includes(
            'killed 5 people, but have never died themselves yet'));
        assert.isTrue((await withKillDeaths(0, 5)).includes(
            'killed anyone yet, but have died 5 times'));
        assert.isTrue((await withKillDeaths(5, 5)).includes(
            'killed 5 people and have died 5 times'));
        assert.isTrue((await withKillDeaths(1400, 15000)).includes(
            'killed 1,400 people and have died 15,000 times'));

        assert.isTrue((await withKillDeaths(10, 10)).includes('a ratio of 1.'));
        assert.isTrue((await withKillDeaths(20, 10)).includes('a ratio of 2.'));
        assert.isTrue((await withKillDeaths(10, 20)).includes('a ratio of 0.5.'));
        assert.isTrue((await withKillDeaths(425, 127)).includes('a ratio of 3.35.'));
    });

    it('should be able to format recency information in player summaries', async (assert) => {
        const withLastSeen = async (time) => {
            commands.database_.summary.lastSeen = time;
            const result = await issueCommand(bot, commandManager, {
                source: kCommandSource,
                command: '!players Beaner',
            });

            return result[0];
        };

        assert.isFalse((await withLastSeen(0)).includes('last seen'));
        assert.isTrue((await withLastSeen(1)).includes('earlier today'));
        assert.isTrue((await withLastSeen(23 * 60 * 60)).includes('earlier today'));
        assert.isTrue((await withLastSeen(24 * 60 * 60)).includes('yesterday'));
        assert.isTrue((await withLastSeen(48 * 60 * 60)).includes('2 days ago'));
        assert.isTrue((await withLastSeen(480 * 60 * 60)).includes('20 days ago'));
        assert.isTrue((await withLastSeen(30.5 * 86400)).includes('a month ago'));
        assert.isTrue((await withLastSeen(61 * 86400)).includes('2 months ago'));
        assert.isTrue((await withLastSeen(365 * 86400)).includes('a year ago'));
        assert.isTrue((await withLastSeen(1095 * 86400)).includes('3 years ago'));
    });

    it('should properly encode the nickname in the url', async (assert) => {
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players [BB]Ricky92',
        });

        assert.equal(result.length, 1);
        assert.isTrue(result[0].includes('https://profile.sa-mp.nl/%5BBB%5DRicky92'));
    });
});
