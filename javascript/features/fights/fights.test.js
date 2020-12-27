// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Fights', it => {
    it('should register all fighting games when its dependency is reloaded', async (assert) => {
        server.featureManager.loadFeature('fights');

        const settings = server.featureManager.loadFeature('settings');

        const kCommand = 'sniper';

        await settings.ready;

        assert.isTrue(server.commandManager.hasCommand(kCommand));

        assert.isTrue(await server.featureManager.liveReload('fights'));
        assert.isTrue(server.commandManager.hasCommand(kCommand));

        assert.isTrue(await server.featureManager.liveReload('games'));
        assert.isTrue(server.commandManager.hasCommand(kCommand));

        assert.isTrue(await server.featureManager.liveReload('games_deathmatch'));
        assert.isTrue(server.commandManager.hasCommand(kCommand));

        assert.isTrue(await server.featureManager.liveReload('fights'));
        assert.isTrue(server.commandManager.hasCommand(kCommand));
    });
});
