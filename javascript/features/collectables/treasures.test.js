// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { Treasures } from 'features/collectables/treasures.js';

import { range } from 'base/range.js';

describe('Treasures', (it, beforeEach) => {
    let collectables = null;
    let delegate = null;
    let gunther = null;

    beforeEach(() => {
        collectables = server.featureManager.loadFeature('collectables');
        delegate = collectables.manager_.getDelegate(CollectableDatabase.kTreasures);
        gunther = server.playerManager.getById(/* Gunther= */ 0);

        delegate.initialize();
    });

    it('can properly count and keep track of collectables', assert => {
        // This collectable is a bit different from others, in that finding a book doesn't count
        // for the collectable's statistics, whereas finding a treasure does. Therefore certain
        // functions are expected to return half values.

        assert.equal(delegate.getCollectables().size, 100);
        assert.equal(delegate.getCollectableCount(), 50);
        
        assert.equal(delegate.getCollectable(0).type, Treasures.kTypeBook);
        assert.equal(delegate.getCollectable(50).type, Treasures.kTypeTreasure);

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 0);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);

        const statistics = CollectableDatabase.createDefaultCollectableStatistics();
        statistics.collected = new Set([
            /* books= */ 0, 10, 20, 30,
            /* treasures= */ 50, 60, 70, 
        ]);

        statistics.collectedRound = new Set([
            /* books= */ 0, 10, 20,
            /* treasures= */ 50, 60,
        ]);

        delegate.setPlayerStatistics(gunther, statistics);

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 3);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 2);
    });

    it('should either create a book, a treasure, or nothing, based on progression', assert => {
        const existingPickupCount = server.pickupManager.count;

        // Create all books, as if the player has not collected any yet.
        const emptyStatistics = CollectableDatabase.createDefaultCollectableStatistics();

        delegate.refreshCollectablesForPlayer(gunther, emptyStatistics);

        const updatedPickupCount = server.pickupManager.count;

        assert.isAbove(updatedPickupCount, existingPickupCount);

        // Now update the books to a situation in which half of 'em have been collected.
        const progressedStatistics = CollectableDatabase.createDefaultCollectableStatistics();
        progressedStatistics.collectedRound = new Set([ ...range(25) ]);

        delegate.refreshCollectablesForPlayer(gunther, progressedStatistics);

        assert.isAbove(server.pickupManager.count, existingPickupCount);
        assert.isBelowOrEqual(server.pickupManager.count, updatedPickupCount);

        // Remove all pickups for the player, this should null them out again.
        delegate.clearCollectablesForPlayer(gunther);

        assert.equal(server.pickupManager.count, existingPickupCount);
    });

    it('should be able to determine the treasure Id for a given book Id', async (assert) => {
        const russell = server.playerManager.getById(/* Russell= */ 1);

        // (1) Results for the same player are identical, but are different for different players.
        assert.equal(
            delegate.determineTreasureForBookForPlayer(gunther, 10),
            delegate.determineTreasureForBookForPlayer(gunther, 10));
        
        assert.equal(
            delegate.determineTreasureForBookForPlayer(gunther, 25),
            delegate.determineTreasureForBookForPlayer(gunther, 25));
        
        assert.notEqual(
            delegate.determineTreasureForBookForPlayer(gunther, 10),
            delegate.determineTreasureForBookForPlayer(russell, 10));
        
        assert.notEqual(
            delegate.determineTreasureForBookForPlayer(gunther, 26),
            delegate.determineTreasureForBookForPlayer(russell, 26));

        // (2) Results prefer the user ID when someone is registered, rather than nickname.
        const nameTreasure = delegate.determineTreasureForBookForPlayer(gunther, 30);

        await gunther.identify({ userId: 12345 });

        const userTreasure = delegate.determineTreasureForBookForPlayer(gunther, 30);
        assert.notEqual(nameTreasure, userTreasure);

        // (3) Two players signed in to the same account will get identical results.
        assert.notEqual(
            delegate.determineTreasureForBookForPlayer(gunther, 35),
            delegate.determineTreasureForBookForPlayer(russell, 35));

        await russell.identify({ userId: 12345 });
            
        assert.equal(
            delegate.determineTreasureForBookForPlayer(gunther, 35),
            delegate.determineTreasureForBookForPlayer(russell, 35));
    });
});
