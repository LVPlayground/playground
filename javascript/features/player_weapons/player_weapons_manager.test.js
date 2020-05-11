// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPawnInvoke from 'base/test/mock_pawn_invoke.js';

describe('PlayerSettingsManager', (it, beforeEach, afterEach) => {
    let manager = null;
    let playerWeapons = null;

    beforeEach(() => {
        playerWeapons = server.featureManager.loadFeature('player_weapons');

        manager = playerWeapons.manager_;
    });

    it('should invoke the pawn command upon trying to give a weapon.', assert => {
        let counter = 0;

        var mockPawnInvoke = MockPawnInvoke.getInstance();

        manager.giveWeapon(0, 24, 1000);

        assert.equal(mockPawnInvoke.calls[0].fn, 'OnGiveWeapon');
        assert.equal(mockPawnInvoke.calls[0].signature, 'iii');
        assert.equal(mockPawnInvoke.calls[0].args[0], 0);
        assert.equal(mockPawnInvoke.calls[0].args[1], 24);
        assert.equal(mockPawnInvoke.calls[0].args[2], 1000);
    });

    it('should invoke the pawn command upon trying to reset weapons.', assert => {
        let counter = 0;

        var mockPawnInvoke = MockPawnInvoke.getInstance();

        manager.resetWeapons(0);

        assert.equal(mockPawnInvoke.calls[0].fn, 'OnResetPlayerWeapons');
        assert.equal(mockPawnInvoke.calls[0].signature, 'i');
        assert.equal(mockPawnInvoke.calls[0].args[0], 0);
    });

    afterEach(() => {
        playerWeapons.dispose();
    });
});