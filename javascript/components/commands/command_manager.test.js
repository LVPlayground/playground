// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { CommandObserver } from 'components/commands/command_observer.js';

describe('CommandManager', it => {
    it('has the ability to register and remove commands from the server', async (assert) => {
        assert.isFalse(server.commandManager.hasCommand('test'));

        let executed = false;

        server.commandManager.buildCommand('test')
            .description('Command to run a unit test.')
            .build(() => executed = true);

        assert.isTrue(server.commandManager.hasCommand('test'));
        assert.equal([ ...server.commandManager.commands ].length, 1);

        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        assert.isFalse(executed);
        assert.isTrue(await gunther.issueCommand('/test'));
        assert.isTrue(executed);

        server.commandManager.removeCommand('test');

        assert.isFalse(server.commandManager.hasCommand('test'));
        assert.equal([ ...server.commandManager.commands ].length, 0);
    });

    it('should be able to display error messages issued by the executor', async (assert) => {
        let executed = false;

        server.commandManager.buildCommand('test')
            .description('Command to run a unit test.')
            .sub('usage')
                .description('Displays usage information.')
                .parameters([ { name: 'param', type: CommandBuilder.kTypeNumber } ])
                .build(() => executed = true)
            .parameters([ { name: 'target', type: CommandBuilder.kTypePlayer } ])
            .build(() => executed = true);

        assert.isTrue(server.commandManager.hasCommand('test'));

        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        assert.isFalse(await gunther.issueCommand('/test usage'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.COMMAND_USAGE, '/test usage [param]'));

        assert.isFalse(await gunther.issueCommand('/test hawkeye'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1], Message.format(Message.COMMAND_ERROR_UNKNOWN_PLAYER, 'hawkeye'));
    });

    it('should have the ability to inform command observers of what happens', async (assert) => {
        let events = [];
        let executed = 0;
        let unknowns = [];

        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        server.commandManager.buildCommand('test')
            .description('Command to run a unit test.')
            .sub('usage')
                .description('Displays usage information.')
                .parameters([ { name: 'param', type: CommandBuilder.kTypeNumber } ])
                .build(() => executed++)
            .parameters([ { name: 'target', type: CommandBuilder.kTypePlayer } ])
            .build(() => executed++);

        server.commandManager.addObserver(new class extends CommandObserver {
            onCommandExecuted(player, command, result) {
                events.push({ player, command, result });
            }
            onUnknownCommandExecuted(player, commandName) {
                unknowns.push({ player, commandName });
            }
        });

        assert.equal(executed, 0);
        assert.equal(events.length, 0);

        // (1) Failed execution: parsing failed
        assert.isFalse(await gunther.issueCommand('/test usage'));

        assert.equal(executed, 0);
        assert.equal(events.length, 1);

        assert.strictEqual(events[0].player, gunther);
        assert.equal(events[0].command.command, '/test usage');
        assert.isFalse(events[0].result);

        // (2) Failed exeuction: unknown player
        assert.isFalse(await gunther.issueCommand('/test hawkeye'));

        assert.equal(executed, 0);
        assert.equal(events.length, 2);

        assert.strictEqual(events[1].player, gunther);
        assert.equal(events[1].command.command, '/test');
        assert.isFalse(events[1].result);

        // (3) Successful execution (sub command)
        assert.isTrue(await gunther.issueCommand('/test usage 21'));

        assert.equal(executed, 1);
        assert.equal(events.length, 3);

        assert.strictEqual(events[2].player, gunther);
        assert.equal(events[2].command.command, '/test usage');
        assert.isTrue(events[2].result);

        // (4) Successful execution (main command)
        assert.isTrue(await gunther.issueCommand('/test Russell'));

        assert.equal(executed, 2);
        assert.equal(events.length, 4);

        assert.strictEqual(events[3].player, gunther);
        assert.equal(events[3].command.command, '/test');
        assert.isTrue(events[3].result);

        // (5) Unknown commands
        assert.isFalse(await gunther.issueCommand('/bananaboat'));

        assert.equal(executed, 2);
        assert.equal(unknowns.length, 1);

        assert.strictEqual(unknowns[0].player, gunther);
        assert.equal(unknowns[0].commandName, '/bananaboat');
    });
});
