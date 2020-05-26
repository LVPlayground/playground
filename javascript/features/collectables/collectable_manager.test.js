// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';

describe('CollectableManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;
    });

    it('should start loading player state when they log in to their account', async (assert) => {
        assert.equal(manager.getCollectableCountForPlayer(gunther), 0);
        assert.equal(
            manager.getCollectableCountForPlayer(gunther, CollectableDatabase.kSprayTag), 0);
        assert.equal(
            manager.getCollectableCountForPlayer(gunther, CollectableDatabase.kRedBarrel), 0);

        await gunther.identify();

        assert.equal(manager.getCollectableCountForPlayer(gunther), 11);
        assert.equal(
            manager.getCollectableCountForPlayer(gunther, CollectableDatabase.kSprayTag), 5);
        assert.equal(
            manager.getCollectableCountForPlayer(gunther, CollectableDatabase.kRedBarrel), 6);
        
        assert.throws(() => manager.getCollectableCountForPlayer(gunther, 'bananas'));

        assert.equal(
            gunther.syncedData.collectables, manager.getCollectableCountForPlayer(gunther));
    });
});
