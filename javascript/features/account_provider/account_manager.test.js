// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('AccountManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(() => {
        const account = server.featureManager.loadFeature('account');
        manager = account.manager_;
    });

    it('applies the guest name for players who failed identification', assert => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        assert.equal(gunther.name, 'Gunther');

        dispatchEvent('playerguestlogin', {
            playerId: gunther.id,
        });

        assert.notEqual(gunther.name, 'Gunther');
    });
});
