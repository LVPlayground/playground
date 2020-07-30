// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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
});
