// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPawnInvoke from 'base/test/mock_pawn_invoke.js';

import Economy from 'features/economy/economy.js';
import Killtime from 'features/killtime/killtime.js';

describe('Killtime', (it, beforeEach) => {
    let manager = null;

    beforeEach(async () => {
        server.featureManager.registerFeaturesForTests({
            economy: Economy,
            killtime: Killtime
        });

        var killtime = server.featureManager.loadFeature('killtime');
        manager = killtime.manager_;
    });

    it('should give players weapon upon starting killtime', async assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.setIsNonPlayerCharacterForTesting(true);
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.activity = Player.PLAYER_ACTIVITY_JS_RACE;
        const luce    = server.playerManager.getById(2 /* Luce    */);
        const mockInvoke = MockPawnInvoke.getInstance();
        gunther.identify();
        russell.identify();
        luce.identify();
        manager.weapon_ = 35;

        await manager.run(2);

        // Add 3 extra due to money giving in Kill Time and activity change registered.
        assert.equal(mockInvoke.calls.length, 5);
        assert.equal(mockInvoke.calls[4].fn, 'OnGiveWeapon');
        assert.equal(mockInvoke.calls[4].args[1], 35);
        assert.equal(mockInvoke.calls[4 ].args[2], 9999);
    });

    it('should not give players weapon if no weapon defined', async assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const luce    = server.playerManager.getById(2 /* Luce    */);
        const mockInvoke = MockPawnInvoke.getInstance();

        gunther.identify();
        russell.identify();
        luce.identify();

        manager.weapon_ = null;

        await manager.run(2);

        // Add 3 extra due to money giving in Kill Time
        assert.equal(mockInvoke.calls.length, 3);
    });

    it('should remove players weapon upon ending killtime', async assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.setIsNonPlayerCharacterForTesting(true);
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.activity = Player.PLAYER_ACTIVITY_JS_RACE;
        const luce    = server.playerManager.getById(2 /* Luce    */);
        const mockInvoke = MockPawnInvoke.getInstance();

        gunther.identify();
        russell.identify();
        luce.identify();

        manager.weapon_ = 35;
        manager.isRunning_ = true;
        manager.stop();

        assert.equal(mockInvoke.calls.length, 1);
        assert.equal(mockInvoke.calls[0].fn, 'OnRemovePlayerWeapon');
        assert.equal(mockInvoke.calls[0].args[1], 35);
    });
});
