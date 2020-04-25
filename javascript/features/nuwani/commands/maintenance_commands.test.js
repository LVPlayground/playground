// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandManager } from 'features/nuwani/commands/command_manager.js';
import { Configuration } from 'features/nuwani/configuration.js';
import { MaintenanceCommands } from 'features/nuwani/commands/maintenance_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

describe('MaintenanceCommands', (it, beforeEach, afterEach) => {
    let configuration = null;
    let bot = null;

    let commandManager = null;
    let commands = null;
    let nuwani = null;

    beforeEach(() => {
        configuration = new Configuration();
        bot = new TestBot();
        nuwani = server.featureManager.loadFeature('nuwani');

        commandManager = new CommandManager(/* runtime= */ null, configuration);
        commands = new MaintenanceCommands(commandManager, configuration, nuwani);
    });

    afterEach(() => {
        commands.dispose();
        commandManager.dispose();

        bot.dispose();
    });

    it('should output the results of !eval commands', async(assert) => {
        const missingParameters = await issueCommand(bot, commandManager, {
            source: configuration.owners[0].toString(),
            command: '!eval',
        });

        assert.equal(missingParameters.length, 1);
        assert.equal(missingParameters[0], 'PRIVMSG #echo :Usage: !eval [code]');

        const successfulCommand = await issueCommand(bot, commandManager, {
            source: configuration.owners[0].toString(),
            command: '!eval 1+1',
        });

        assert.equal(successfulCommand.length, 1);
        assert.equal(successfulCommand[0], 'PRIVMSG #echo :Result: 2');
    });

    it('should run the appropriate owner checks for the !eval command', async(assert) => {
        const unauthenticatedCommand = await issueCommand(bot, commandManager, {
            source: 'RandomPerson!user@hostname',
            command: '!eval 1+1',
        });
        
        assert.equal(unauthenticatedCommand.length, 1);
        assert.equal(
            unauthenticatedCommand[0],
            'PRIVMSG #echo :Error: Sorry, this command is only available to specific people.');
    });

    it('should be able to identify user levels with the !level command', async(assert) => {
        bot.setUserModesInEchoChannelForTesting('Joe', 'a');

        const selfManagement = await issueCommand(bot, commandManager, {
            source: 'Joe!joe@hostname',
            command: '!level',
        });

        assert.equal(selfManagement.length, 1);
        assert.equal(selfManagement[0], 'PRIVMSG #echo :Result: Joe is a Management member.');

        bot.setUserModesInEchoChannelForTesting('Joe', 'ho');

        const selfAdministrator = await issueCommand(bot, commandManager, {
            source: 'Joe!joe@hostname',
            command: '!level',
        });

        assert.equal(selfAdministrator.length, 1);
        assert.equal(selfAdministrator[0], 'PRIVMSG #echo :Result: Joe is an administrator.');

        bot.setUserModesInEchoChannelForTesting('Joe', 'v');

        const selfPlayer = await issueCommand(bot, commandManager, {
            source: 'Joe!joe@hostname',
            command: '!level',
        });

        assert.equal(selfPlayer.length, 1);
        assert.equal(selfPlayer[0], 'PRIVMSG #echo :Result: Joe is a player.');

        bot.removeUserFromEchoChannelForTesting('Joe');

        const selfNotInChannel = await issueCommand(bot, commandManager, {
            source: 'Joe!joe@hostname',
            command: '!level',
        });

        assert.equal(selfNotInChannel.length, 1);
        assert.equal(
            selfNotInChannel[0],
            'PRIVMSG #echo :Error: Joe does not seem to be in the echo channel.');

        bot.setUserModesInEchoChannelForTesting('Holsje', 'a');

        const otherManagement = await issueCommand(bot, commandManager, {
            source: 'Joe!joe@hostname',
            command: '!level Holsje',
        });

        assert.equal(otherManagement.length, 1);
        assert.equal(otherManagement[0], 'PRIVMSG #echo :Result: Holsje is a Management member.');

        bot.removeUserFromEchoChannelForTesting('Holsje');

        const otherNotInChannel = await issueCommand(bot, commandManager, {
            source: 'Joe!joe@hostname',
            command: '!level Holsje',
        });

        assert.equal(otherNotInChannel.length, 1);
        assert.equal(
            otherNotInChannel[0],
            'PRIVMSG #echo :Error: Holsje does not seem to be in the echo channel.');
    });

    it('should be able to request increases and decreases in bot count', async (assert) => {
        bot.setUserModesInEchoChannelForTesting('Holsje', 'a');
        let responses = null;

        assert.equal(nuwani.runtime.availableBots.size, 1);

        responses = await issueCommand(bot, commandManager, {
            source: 'Holsje!holsje@hostname',
            command: '!nuwani request-increase',
        });

        assert.equal(responses.length, 1);
        assert.isTrue(responses[0].includes('Success'));

        assert.equal(nuwani.runtime.availableBots.size, 0);

        responses = await issueCommand(bot, commandManager, {
            source: 'Holsje!holsje@hostname',
            command: '!nuwani request-increase',
        });

        assert.equal(responses.length, 1);
        assert.isFalse(responses[0].includes('Success'));

        assert.equal(nuwani.runtime.availableBots.size, 0);

        responses = await issueCommand(bot, commandManager, {
            source: 'Holsje!holsje@hostname',
            command: '!nuwani request-decrease',
        });

        assert.equal(responses.length, 1);
        assert.isTrue(responses[0].includes('Success'));

        assert.equal(nuwani.runtime.availableBots.size, 1);

        responses = await issueCommand(bot, commandManager, {
            source: 'Holsje!holsje@hostname',
            command: '!nuwani request-decrease',
        });

        assert.equal(responses.length, 1);
        assert.isFalse(responses[0].includes('Success'));

        assert.equal(nuwani.runtime.availableBots.size, 1);
    });
});
