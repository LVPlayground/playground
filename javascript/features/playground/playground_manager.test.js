// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kAutoRestartReconnectionGraceSec } from 'features/playground/playground_manager.js';

describe('PlaygroundManager', it => {
    it('should be able to grant VIP rights to all players', async (assert) => {
        server.featureManager.loadFeature('playground');

        // (1) Enable the free VIP feature.
        const settings = server.featureManager.loadFeature('settings');
        settings.setValue('playground/enable_free_vip', true);

        // (2) Gunther should not have VIP rights by default.
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        assert.isFalse(gunther.isVip());

        await gunther.identify();

        assert.isFalse(gunther.isVip());

        // (3) After the predefined delay, Gunther should have been granted VIP rights.
        await server.clock.advance(5000);

        assert.isTrue(gunther.isVip());
        assert.equal(gunther.messages.length, 3);
    });

    it('should be able to automatically start the server', async (assert) => {
        server.featureManager.loadFeature('playground');

        const originalKillServer = global.killServer;
        const killServerPromise = new Promise(resolve => global.killServer = resolve);

        // (1) Enable the automatic restart feature.
        const settings = server.featureManager.loadFeature('settings');
        settings.setValue('server/auto_restart_enabled', true);
        settings.setValue('server/auto_restart_interval_hours', 24);

        // (2) Disconnecting all players before the interval is over should do nothing.
        for (const player of server.playerManager)
            player.disconnectForTesting();

        dispatchEvent('playerconnect', { playerid: 0 });
        dispatchEvent('playerconnect', { playerid: 1 });
        dispatchEvent('playerconnect', { playerid: 2, npc: true });

        // (3) Wait for 24 hours to pass. This should mean that the server's ready to restart.
        await server.clock.advance(24 * 60 * 60 * 1000);

        // (4) Disconnect the player with ID 0. Player with ID 1 remains online.
        server.playerManager.getById(0).disconnectForTesting();

        // (5) Disconnect the player with ID 1. No more humans, the timer should now start.
        server.playerManager.getById(1).disconnectForTesting();

        await server.clock.advance(kAutoRestartReconnectionGraceSec * 1000);

        // (6) No more players, we should be ded.
        await Promise.all([
            server.clock.advance(1500),
            killServerPromise,
        ]);

        global.killServer = originalKillServer;
    });
});
