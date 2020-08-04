// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('SpectateManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let russell = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('spectate');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('should be able to maintain the global spectation group', assert => {
        const originalPlayerCount = server.playerManager.count;
        const group = manager.getGlobalGroup();

        // All existing players should've been added to the group already.
        assert.equal(group.size, originalPlayerCount);

        // Connect a new player as a non-player character, they should *not* be added.
        server.playerManager.onPlayerConnect({
            playerid: 42,
            npc: true,
        });

        assert.equal(group.size, originalPlayerCount);

        // Connet a new player as a regular, human player. They should in fact be added.
        server.playerManager.onPlayerConnect({
            playerid: 43,
            npc: false,
        });

        assert.equal(group.size, originalPlayerCount + 1);

        // Disconnect Russell from the server. They should be removed from the group.
        russell.disconnectForTesting();

        assert.equal(group.size, originalPlayerCount);

        // Disconnet the NPC that we connected. No change is expected to occur.
        server.playerManager.getById(42).disconnectForTesting();

        assert.equal(group.size, originalPlayerCount);
    });
});
