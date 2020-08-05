// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('SpectateManager', (it, beforeEach) => {
    let gunther = null;
    let lucy = null;
    let manager = null;
    let russell = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('spectate');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        lucy = server.playerManager.getById(/* Lucy= */ 2);
        manager = feature.manager_;
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('should enable players to spectate others despite group changes', async (assert) => {
        const settings = server.featureManager.loadFeature('settings');

        const frequency = settings.getValue('playground/spectator_monitor_frequency_ms');
        const group = manager.getGlobalGroup();

        assert.isFalse(gunther.spectatingForTesting);
        assert.isFalse(russell.spectatingForTesting);
        assert.isFalse(lucy.spectatingForTesting);

        // (1) |gunther| should be able to spectate |russell|.
        assert.isTrue(manager.spectate(gunther, group, russell));

        assert.isTrue(gunther.spectatingForTesting);
        assert.isFalse(russell.spectatingForTesting);

        assert.strictEqual(gunther.spectateTargetForTesting, russell);

        // (2) |lucy| is unable to spectate |gunther|, as they're spectating already.
        assert.isFalse(manager.spectate(lucy, group, gunther));

        assert.isFalse(lucy.spectatingForTesting);
        assert.isNull(lucy.spectateTargetForTesting);

        // (3) When |russell| disconnects from the server, |gunther| should move to |lucy|.

        // TODO

        // (4) When |lucy|'s interior or virtual world changes, this should update for |gunther|.
        assert.equal(gunther.virtualWorld, russell.virtualWorld);
        assert.equal(gunther.interiorId, russell.interiorId);

        russell.virtualWorld = 12;
        russell.interiorId = 1;

        await server.clock.advance(frequency);

        assert.equal(gunther.virtualWorld, russell.virtualWorld);
        assert.equal(gunther.interiorId, russell.interiorId);
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
