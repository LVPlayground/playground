// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Derbies', it => {
    it('should register the derby game when its dependency is reloaded', async (assert) => {
        server.featureManager.loadFeature('derbies');

        assert.isTrue(server.commandManager.hasCommand('derby'));

        assert.isTrue(await server.featureManager.liveReload('derbies'));
        assert.isTrue(server.commandManager.hasCommand('derby'));

        assert.isTrue(await server.featureManager.liveReload('games'));
        assert.isTrue(server.commandManager.hasCommand('derby'));

        assert.isTrue(await server.featureManager.liveReload('derbies'));
        assert.isTrue(server.commandManager.hasCommand('derby'));

        assert.isTrue(await server.featureManager.liveReload('games'));
        assert.isTrue(server.commandManager.hasCommand('derby'));
    });
});
