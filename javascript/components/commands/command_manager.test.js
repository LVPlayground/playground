// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';

describe('CommandManager', it => {
    it('has the ability to register and remove commands from the server', async (assert) => {
        assert.isFalse(server.commandManager.hasCommand('test'));

        let executed = false;

        server.commandManager.buildCommand('test')
            .description('Command to run a unit test.')
            .build(() => executed = true);

        assert.isTrue(server.commandManager.hasCommand('test'));

        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        assert.isFalse(executed);
        assert.isTrue(await gunther.issueCommand('/test'));
        assert.isTrue(executed);

        server.commandManager.removeCommand('test');

        assert.isFalse(server.commandManager.hasCommand('test'));
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

        assert.isTrue(await gunther.issueCommand('/test usage'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.COMMAND_USAGE, '/test usage [param]'));

        assert.isTrue(await gunther.issueCommand('/test hawkeye'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1], Message.format(Message.COMMAND_ERROR_UNKNOWN_PLAYER, 'hawkeye'));
    });
});
