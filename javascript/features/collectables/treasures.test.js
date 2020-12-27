// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { Treasures,
         kBookPickupModelId, kTreasurePickupModelId } from 'features/collectables/treasures.js';

import { range } from 'base/range.js';

describe('Treasures', (it, beforeEach) => {
    let collectables = null;
    let delegate = null;
    let finance = null;
    let gunther = null;

    beforeEach(() => {
        collectables = server.featureManager.loadFeature('collectables');
        delegate = collectables.manager_.getDelegate(CollectableDatabase.kTreasures);
        finance = server.featureManager.loadFeature('finance');
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

    it('should only expose hints for treasures when all books have been collected', assert => {
        // Create all books, as if the player has not collected any yet.
        const emptyStatistics = CollectableDatabase.createDefaultCollectableStatistics();

        delegate.refreshCollectablesForPlayer(gunther, emptyStatistics);

        assert.equal(delegate.getCollectablesForHints(gunther).size, 50);
        for (const [ id, data ] of delegate.getCollectablesForHints(gunther))
            assert.equal(data.type, Treasures.kTypeBook);
        
        // Now update the books to a situation in which all books have been collected.
        const progressedStatistics = CollectableDatabase.createDefaultCollectableStatistics();
        progressedStatistics.collectedRound = new Set([ ...range(50) ]);

        delegate.refreshCollectablesForPlayer(gunther, progressedStatistics);

        assert.equal(delegate.getCollectablesForHints(gunther).size, 50);
        for (const [ id, data ] of delegate.getCollectablesForHints(gunther))
            assert.equal(data.type, Treasures.kTypeTreasure);
    });

    it('should either create a book, a treasure, or nothing, based on progression', assert => {
        const existingAreaSize = server.areaManager.size;
        const existingObjectSize = server.objectManager.size;

        // Create all books, as if the player has not collected any yet.
        const emptyStatistics = CollectableDatabase.createDefaultCollectableStatistics();

        delegate.refreshCollectablesForPlayer(gunther, emptyStatistics);

        assert.equal(server.areaManager.size, existingAreaSize + delegate.getCollectableCount());
        assert.equal(
            server.objectManager.size, existingObjectSize + delegate.getCollectableCount());
        
        assert.isTrue(delegate.playerObjectMapping_.has(gunther));
        for (const object of delegate.playerObjectMapping_.get(gunther).values())
            assert.equal(object.modelId, kBookPickupModelId);

        // Now update the books to a situation in which half of 'em have been collected.
        const progressedStatistics = CollectableDatabase.createDefaultCollectableStatistics();
        progressedStatistics.collectedRound = new Set([ ...range(25) ]);

        delegate.refreshCollectablesForPlayer(gunther, progressedStatistics);

        assert.equal(server.areaManager.size, existingAreaSize + delegate.getCollectableCount());
        assert.equal(
            server.objectManager.size, existingObjectSize + delegate.getCollectableCount());
        
        const distribution = {
            [kBookPickupModelId]: 0,
            [kTreasurePickupModelId]: 0,
        };

        assert.isTrue(delegate.playerObjectMapping_.has(gunther));
        for (const object of delegate.playerObjectMapping_.get(gunther).values())
            distribution[object.modelId]++;
        
        assert.equal(distribution[kBookPickupModelId], 25);
        assert.equal(distribution[kTreasurePickupModelId], 25);

        // Clear all the collectables, expect area and object sizes to have reset.
        delegate.clearCollectablesForPlayer(gunther);

        assert.equal(server.areaManager.size, existingAreaSize);
        assert.equal(server.objectManager.size, existingObjectSize);
    });

    it('should enable players to pick up the treasures', async (assert) => {
        // Create a mixture of books (ID <50) and treasures (ID >=50) for Gunther.
        const progressedStatistics = CollectableDatabase.createDefaultCollectableStatistics();
        progressedStatistics.collectedRound = new Set([ ...range(25) ]);

        delegate.refreshCollectablesForPlayer(gunther, progressedStatistics);

        // Get all the areas that have been created for Gunther.
        const areas = [ ...delegate.playerAreaMapping_.get(gunther).keys() ];
        assert.equal(areas.length, 50);

        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);

        // (1) Have Gunther pick up a book, which should transition into a treasure.
        delegate.onPlayerEnterArea(gunther, areas[25]);

        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);
        assert.isFalse(areas[25].isConnected());

        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[0], 'mentions a treasure');
        assert.equal(gunther.messages[1], Message.COLLECTABLE_TREASURE_HOW);

        assert.equal(delegate.playerAreaMapping_.get(gunther).size, 50);
        assert.equal(delegate.playerObjectMapping_.get(gunther).size, 50);

        // (2) Have Gunther pick up a treasure, which should award what they deserve.
        delegate.onPlayerEnterArea(gunther, areas[0]);

        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 1);
        assert.isFalse(areas[0].isConnected());

        assert.equal(gunther.messages.length, 3);  // 2, +prize money notification

        assert.equal(delegate.playerAreaMapping_.get(gunther).size, 49);
        assert.equal(delegate.playerObjectMapping_.get(gunther).size, 49);
    });

    it('should award prize money when a treasure has been found', async (assert) => {
        // Put Gunther in a situation where they've collected all the books.
        const progressedStatistics = CollectableDatabase.createDefaultCollectableStatistics();
        progressedStatistics.collectedRound = new Set([ ...range(50) ]);

        delegate.refreshCollectablesForPlayer(gunther, progressedStatistics);

        assert.equal(delegate.playerAreaMapping_.get(gunther).size, 50);
        assert.equal(delegate.playerObjectMapping_.get(gunther).size, 50);

        let cash = finance.getPlayerCash(gunther);
        let messages = gunther.messages.length;

        // Iterate over all the areas that are available to Gunther.
        const areas = [ ...delegate.playerAreaMapping_.get(gunther).keys() ];

        for (const area of areas) {
            delegate.onPlayerEnterArea(gunther, area);

            const updatedCash = finance.getPlayerCash(gunther);
            const updatedMessages = gunther.messages.length;

            if (messages === 9)
                messages += 1;  // kAchievementTreasuresBronze
            else if (messages === 50)
                messages += 2;  // kAchievementTreasuresPlatinium & kBenefitVehicleKeysGravity

            assert.equal(updatedMessages, messages + 1);
            assert.equal(
                gunther.messages[messages],
                Message.format(Message.COLLECTABLE_TREASURE_FOUND, updatedCash - cash));

            cash = updatedCash;
            messages = updatedMessages;
        }
    });

    it('should be able to determine the treasure Id for a given book Id', async (assert) => {
        const russell = server.playerManager.getById(/* Russell= */ 1);

        delegate.createTreasureMapping(gunther);
        delegate.createTreasureMapping(russell);

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

        delegate.createTreasureMapping(gunther);

        const userTreasure = delegate.determineTreasureForBookForPlayer(gunther, 30);
        assert.notEqual(nameTreasure, userTreasure);

        // (3) Two players signed in to the same account will get identical results.
        assert.notEqual(
            delegate.determineTreasureForBookForPlayer(gunther, 35),
            delegate.determineTreasureForBookForPlayer(russell, 35));

        await russell.identify({ userId: 12345 });

        delegate.createTreasureMapping(russell);

        assert.equal(
            delegate.determineTreasureForBookForPlayer(gunther, 35),
            delegate.determineTreasureForBookForPlayer(russell, 35));
    });
});
