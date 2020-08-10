// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Races', it => {
    it('should register the race game when its dependency is reloaded', async (assert) => {
        server.featureManager.loadFeature('races');

        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('races'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games_vehicles'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games_vehicles'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('races'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games'));
        assert.isTrue(server.commandManager.hasCommand('race'));
    });
});
