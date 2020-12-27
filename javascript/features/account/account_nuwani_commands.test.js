// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountNuwaniCommands } from 'features/account/account_nuwani_commands.js';
import { MockAccountDatabase } from 'features/account/test/mock_account_database.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

// The source that will be used for this series of IRC command tests.
const kCommandSourceUsername = 'Beaner';
const kCommandSource = 'Beaner!thebean@lvp.administrator';

describe('AccountNuwaniCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let commands = null;

    beforeEach(() => {
        const account = server.featureManager.loadFeature('account');
        const nuwani = server.featureManager.loadFeature('nuwani');

        bot = new TestBot();

        commandManager = nuwani.commandManager;
        commands = account.nuwaniCommands_;

        account.database_.setPasswordSalt('s4lt');
    });

    afterEach(() => bot.dispose());

    const kFieldAccessibleByAdmins = 'skin_id';
    const kFieldNotAccessibleByAdmins = 'online_time';

    it('should make it possible to add an alias to an account', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const onlinePlayer = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!addalias [BB]Ricky92 ' + server.playerManager.getById(0).name,
        });

        assert.equal(onlinePlayer.length, 1);
        assert.equal(
            onlinePlayer[0],
            'PRIVMSG #LVP.DevJS :Error: Cannot change the details of in-game players.');
        
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!addalias [BB]Ricky92 AmazingRicky',
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Success: AmazingRicky has been added as an alias for [BB]Ricky92.');
    });

    it('should make it possible to list aliases associated with an account', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const unknownPlayer = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!aliases FakeUser',
        });

        assert.equal(unknownPlayer.length, 1);
        assert.equal(
            unknownPlayer[0],
            'PRIVMSG #LVP.DevJS :Error: The player FakeUser could not be found in the database.');
        
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!aliases WoodPecker',
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Aliases of [BB]Ricky92: WoodPecker, [BA]Ro[BB]in');
    });

    it('should allow for removing an alias from an account', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const onlinePlayer = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!removealias ' + server.playerManager.getById(0).name + ' [BB]Ricky92',
        });

        assert.equal(onlinePlayer.length, 1);
        assert.equal(
            onlinePlayer[0],
            'PRIVMSG #LVP.DevJS :Error: Cannot change the details of in-game players.');
        
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!removealias [BB]Ricky92 WoodPecker',
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Success: WoodPecker has been removed as an alias for [BB]Ricky92.');
    });

    it('should allow for inspecting a user\'s nickname history', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const notFound = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!history FakeUser',
        });

        assert.equal(notFound.length, 1);
        assert.equal(
            notFound[0],
            'PRIVMSG #LVP.DevJS :Error: No history for FakeUser could be found in the database.');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!history Beaner',
        });

        assert.equal(result.length, 1);
        assert.equal(result[0], 'PRIVMSG #LVP.DevJS :Previous nicknames: [HOT]Lad1992, Beamer');
    });

    it('should allow changing a user\'s nickname to another one', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const onlinePlayer = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!changename [BB]Ricky92 ' + server.playerManager.getById(0).name,
        });

        assert.equal(onlinePlayer.length, 1);
        assert.equal(
            onlinePlayer[0],
            'PRIVMSG #LVP.DevJS :Error: Cannot change the details of in-game players.');
        
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!changename [BB]Ricky92 AmazingRicky',
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Success: [BB]Ricky92 will henceforth be known as AmazingRicky.');
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
        assert.includes(result[0], 'Success');
        assert.isTrue(/to ([a-zA-Z0-9]){12}$/.test(result[0]));

        assert.equal(commands.database_.changePassQueries.length, 1);
        assert.equal(commands.database_.changePassQueries[0].nickname, '[BB]Ricky92');
    });

    it('should be able to display a list of supported database fields', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const adminResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!supported',
        });

        assert.equal(adminResult.length, 1);
        assert.includes(adminResult[0], 'Supported fields');
        assert.includes(adminResult[0], kFieldAccessibleByAdmins);
        assert.doesNotInclude(adminResult[0], kFieldNotAccessibleByAdmins);

        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const managementResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!supported',
        });

        assert.equal(managementResult.length, 1);
        assert.includes(managementResult[0], 'Supported fields');
        assert.includes(managementResult[0], kFieldNotAccessibleByAdmins);
    });

    it('should be able to get individual account values for a player', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const invalidField = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getvalue [BB]Ricky92 ponies',
        });

        assert.equal(invalidField.length, 1);
        assert.includes(invalidField[0], 'Error');
        assert.includes(invalidField[0], 'not a field known');

        const invalidUser = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getvalue FakeUser kill_count',
        });

        assert.equal(invalidUser.length, 1);
        assert.includes(invalidUser[0], 'Error');
        assert.includes(invalidUser[0], 'could not be found');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getvalue [BB]Ricky92 kill_count',
        });

        assert.equal(result.length, 1);
        assert.doesNotInclude(result[0], 'Error');
        assert.includes(result[0], '1234');
    });

    it('should not allow updating information of in-game players', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!setvalue ' + server.playerManager.getById(0).name + ' is_vip 1',
        });

        assert.equal(result.length, 1);
        assert.equal(
            result[0],
            'PRIVMSG #LVP.DevJS :Error: Cannot update account data of in-game players.');
    });

    it('should enable updating player information through the commands', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const invalidField = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!setvalue [BB]Ricky92 ponies 31',
        });

        assert.equal(invalidField.length, 1);
        assert.includes(invalidField[0], 'Error');
        assert.includes(invalidField[0], 'not a field known');

        const invalidUser = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!setvalue FakeUser kill_count 100000000',
        });

        assert.equal(invalidUser.length, 1);
        assert.includes(invalidUser[0], 'Error');
        assert.includes(invalidUser[0], 'could not be found');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!setvalue [BB]Ricky92 kill_count 2345',
        });

        assert.equal(result.length, 1);
        assert.doesNotInclude(result[0], 'Error');
        assert.includes(result[0], 'Success');
    });

    it('should enable administrators to update certain fields as well', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'h');

        const noAccessGetResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getvalue [BB]Ricky92 ' + kFieldNotAccessibleByAdmins,
        });

        assert.equal(noAccessGetResult.length, 1);
        assert.includes(noAccessGetResult[0], 'Error');
        assert.includes(noAccessGetResult[0], 'is not accessible');

        const getResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!getvalue [BB]Ricky92 ' + kFieldAccessibleByAdmins,
        });

        assert.equal(getResult.length, 1);
        assert.doesNotInclude(getResult[0], 'Error');

        const setResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!setvalue [BB]Ricky92 ' + kFieldAccessibleByAdmins + ' 1234',
        });

        assert.equal(setResult.length, 1);
        assert.doesNotInclude(setResult[0], 'Error');

        const noAccessSetResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!setvalue [BB]Ricky92 ' + kFieldNotAccessibleByAdmins + ' 1234',
        });

        assert.equal(noAccessSetResult.length, 1);
        assert.includes(noAccessSetResult[0], 'Error');
        assert.includes(noAccessSetResult[0], 'is not accessible');
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
        server.playerManager.onPlayerConnect({
            playerid: 42,
            name: 'NevahPC',
            npc: true,
        })

        assert.isNotNull(server.playerManager.getByName('NevahPC'));

        result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players',
        });

        assert.equal(result.length, 1);
        assert.equal(result[0], 'PRIVMSG #LVP.DevJS :Online players (3): Gunther, Lucy, Russell');
    });

    it('should be able to find information about a particular player', async (assert) => {
        const notFound = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players NameThatDoesNotExist',
        });

        assert.equal(notFound.length, 1);
        assert.equal(
            notFound[0],
            'PRIVMSG #LVP.DevJS :Error: Sorry, I don\'t know who NameThatDoesNotExist is.');

        const singleSuggestion = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players newski',
        });

        assert.equal(singleSuggestion.length, 1);
        assert.doesNotInclude(singleSuggestion[0], ' or ');
        assert.includes(singleSuggestion[0], '(2xC)Newski');

        const multipleSuggestions = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players Joe',
        });

        assert.equal(multipleSuggestions.length, 1);
        assert.includes(multipleSuggestions[0], '[BB]Joe, EvilJoe or SupahEvilJoe');

        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players Beaner',
        });

        assert.equal(result.length, 1);
        assert.doesNotInclude(result[0], 'has not registered with us');
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

        assert.includes(await withLevelVip('Management', false), 'a Management member');
        assert.includes(await withLevelVip('Administrator', false), 'an administrator');
        assert.includes(await withLevelVip('Moderator', false), 'a player');
        assert.includes(await withLevelVip('Player', false), 'a player');
        assert.includes(await withLevelVip('Player', true), 'a VIP');
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

        assert.includes(await withOnlineTime(0), 'never been online yet');
        assert.includes(await withOnlineTime(1), 'been online for 1 second.');
        assert.includes(await withOnlineTime(2), 'been online for 2 seconds.');
        assert.includes(await withOnlineTime(60), 'been online for 1 minute.');
        assert.includes(await withOnlineTime(120), 'been online for 2 minutes.');
        assert.includes(await withOnlineTime(3600), 'been online for 1 hour.');
        assert.includes(await withOnlineTime(7200), 'been online for 2 hours.');
        assert.includes(await withOnlineTime(7200 * 1000), 'been online for 2,000 hours.');
        assert.includes(await withOnlineTime(3660), 'been online for 1 hour and 1 minute.');
        assert.includes(await withOnlineTime(3720), 'been online for 1 hour and 2 minutes.');
        assert.includes(await withOnlineTime(7260), 'been online for 2 hours and 1 minute.');
        assert.includes(
            await withOnlineTime(12345678), 'been online for 3,429 hours and 21 minutes.');
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

        assert.doesNotInclude(await withKillDeaths(0, 0), 'killed');
        assert.includes(
            await withKillDeaths(5, 0), 'killed 5 people, but have never died themselves yet');
        assert.includes(await withKillDeaths(0, 5), 'killed anyone yet, but have died 5 times');
        assert.includes(await withKillDeaths(5, 5), 'killed 5 people and have died 5 times');
        assert.includes(
            await withKillDeaths(1400, 15000), 'killed 1,400 people and have died 15,000 times');

        assert.includes(await withKillDeaths(10, 10), 'a ratio of 1.');
        assert.includes(await withKillDeaths(20, 10), 'a ratio of 2.');
        assert.includes(await withKillDeaths(10, 20), 'a ratio of 0.5.');
        assert.includes(await withKillDeaths(425, 127), 'a ratio of 3.35.');
    });

    it('should be able to format recency information in player summaries', async (assert) => {
        const withLastSeen = async (time) => {
            commands.database_.summary.lastSeen =
                time ? new Date(Date.now() - time * 1000).toString()
                     : time;

            const result = await issueCommand(bot, commandManager, {
                source: kCommandSource,
                command: '!players Beaner',
            });

            return result[0];
        };

        assert.doesNotInclude(await withLastSeen(0), 'last seen');
        assert.includes(await withLastSeen(1), '1 second ago');
        assert.includes(await withLastSeen(23 * 60 * 60), '23 hours ago');
        assert.includes(await withLastSeen(24 * 60 * 60), '1 day ago');
        assert.includes(await withLastSeen(48 * 60 * 60), '2 days ago');
        assert.includes(await withLastSeen(480 * 60 * 60), '20 days ago');
        assert.includes(await withLastSeen(30.5 * 86400), '1 month ago');
        assert.includes(await withLastSeen(61 * 86400), '2 months ago');
        assert.includes(await withLastSeen(365 * 86400), '1 year ago');
        assert.includes(await withLastSeen(1095 * 86400), '3 years ago');
    });

    it('should properly encode the nickname in the url', async (assert) => {
        const result = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players [BB]Ricky92',
        });

        assert.equal(result.length, 1);
        assert.includes(result[0], 'https://profile.sa-mp.nl/%5BBB%5DRicky92');
    });

    it('should be able to highlight when players are currently online', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        gunther.identify({ userId: 42 });

        const differentNameResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players [BB]Ricky92',
        });

        assert.equal(differentNameResult.length, 1);
        assert.includes(
            differentNameResult[0], '[BB]Ricky92 is currently playing on the server as Gunther!');

        gunther.name = '[BB]Ricky92';
        
        const sameNameResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players [BB]Ricky92',
        });

        assert.equal(sameNameResult.length, 1);
        assert.includes(sameNameResult[0], '[BB]Ricky92 is currently playing on the server!');

        gunther.setUndercover(true);

        const undercoverResult = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!players [BB]Ricky92',
        });

        assert.equal(undercoverResult.length, 1);
        assert.doesNotInclude(undercoverResult[0], 'is currently playing on the server');
    });

    it('should be able to format a nice message for whereis queries', async (assert) => {
        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const usageResults = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!whereis',
        });

        assert.equal(usageResults.length, 1);
        assert.includes(usageResults[0], '!whereis');

        const results = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!whereis Gunther',
        });

        assert.equal(results.length, 1);
        assert.includes(results[0], '127.0.0.1');
        assert.includes(results[0], 'is a known proxy');
    });

    it('should be able to find player identifies when they are undercover', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        gunther.setIpForTesting('37.48.87.211');
        gunther.setSerialForTesting(1337);  // no results

        bot.setUserModesInEchoChannelForTesting(kCommandSourceUsername, 'a');

        const usageResults = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!whois',
        });

        assert.equal(usageResults.length, 1);
        assert.includes(usageResults[0], '!whois');

        const noResults = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!whois Gunther',
        });

        assert.equal(noResults.length, 1);
        assert.includes(noResults[0], 'No results were found');

        gunther.setSerialForTesting(9001);  // results
        
        const results = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!whois Gunther',
        });

        assert.equal(results.length, 1);
        assert.includes(results[0], '[BB]Joe');

        const explicitResults = await issueCommand(bot, commandManager, {
            source: kCommandSource,
            command: '!whois 37.48.87.211 9001',
        });

        assert.equal(explicitResults.length, 1);
        assert.includes(explicitResults[0], 'TotallyNotJoe');
    });
});
