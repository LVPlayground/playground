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

    it('is able to log in players undercover, override their rights', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        assert.equal(gunther.level, Player.LEVEL_PLAYER);
        assert.isFalse(gunther.isVip());
        assert.isFalse(gunther.isUndercover());
        assert.isFalse(gunther.account.isRegistered());
        assert.isFalse(gunther.account.isIdentified());

        await gunther.identify({ userId: 42 });

        assert.equal(gunther.level, Player.LEVEL_PLAYER);
        assert.isFalse(gunther.isVip());
        assert.isFalse(gunther.isUndercover());
        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(gunther.account.isIdentified());
        assert.equal(gunther.account.userId, 42);

        dispatchEvent('playermodlogin', {
            playerid: gunther.id,
            level: Player.LEVEL_ADMINISTRATOR + /* pawn offset= */ 1,
            vip: true,
        });

        assert.equal(gunther.level, Player.LEVEL_ADMINISTRATOR);
        assert.isTrue(gunther.isVip());
        assert.isTrue(gunther.isUndercover());
        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(gunther.account.isIdentified());
        assert.equal(gunther.account.userId, 42);
    });
});
