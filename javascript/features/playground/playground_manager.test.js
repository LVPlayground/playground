// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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
});
