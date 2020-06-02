// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';

import * as achievements from 'features/collectables/achievements.js';
import { range } from 'base/range.js';

describe('RedBarrels', (it, beforeEach) => {
    let collectables = null;
    let delegate = null;
    let gunther = null;

    beforeEach(() => {
        collectables = server.featureManager.loadFeature('collectables');
        delegate = collectables.manager_.getDelegate(CollectableDatabase.kRedBarrel);
        gunther = server.playerManager.getById(/* Gunther= */ 0);

        delegate.initialize();
    });

    it('should only create barrels when they have not been collected yet', assert => {
        const existingObjectCount = server.objectManager.count;

        // Create all barrels, as if the player has not collected any yet.
        const emptyStatistics = CollectableDatabase.createDefaultCollectableStatistics();

        delegate.refreshCollectablesForPlayer(gunther, emptyStatistics);

        const updatedObjectCount = server.objectManager.count;

        assert.isAbove(updatedObjectCount, existingObjectCount);

        // Now update the barrels to a situation in which half of 'em have been collected.
        const progressedStatistics = CollectableDatabase.createDefaultCollectableStatistics();
        progressedStatistics.collectedRound = new Set([ ...range(50) ]);

        delegate.refreshCollectablesForPlayer(gunther, progressedStatistics);

        assert.isAbove(server.objectManager.count, existingObjectCount);
        assert.isBelow(server.objectManager.count, updatedObjectCount);

        // Remove all barrels for the player, this should null them out again.
        delegate.clearCollectablesForPlayer(gunther);

        assert.equal(server.objectManager.count, existingObjectCount);
    });

    it('should remove barrels when they have been shot', assert => {
        const existingObjectCount = server.objectManager.count;

        // Create all barrels, as if the player has not collected any yet.
        delegate.refreshCollectablesForPlayer(
            gunther, CollectableDatabase.createDefaultCollectableStatistics());

        const updatedObjectCount = server.objectManager.count;

        assert.isAbove(updatedObjectCount, existingObjectCount);

        // Now have |gunther| shoot one of their barrels. This requires some poking around in the
        // internals of RedBarrels to get the first barrel created for |gunther|.
        const barrel = [ ...delegate.playerBarrels_.get(gunther).keys() ].shift();

        assert.isTrue(barrel.isConnected());

        // Fakes an OnPlayerShootDynamicObject event, which have been deferred.
        server.objectManager.onPlayerShootObject({
            playerid: gunther.id,
            objectid: barrel.id,
        });

        assert.isFalse(barrel.isConnected());
        assert.equal(server.objectManager.count, updatedObjectCount - 1);
    });

    it('should award achievements when one of the milestones has been hit', assert => {
        const kTotal = 100;
        const kMilestones = new Map([
            [  10, achievements.kAchievementRedBarrelBronze ],
            [  40, achievements.kAchievementRedBarrelSilver ],
            [  90, achievements.kAchievementRedBarrelGold ],
            [ 100, achievements.kAchievementRedBarrelPlatinum ],
        ]);

        // Create all barrels, as if the player has not collected any yet.
        delegate.refreshCollectablesForPlayer(
            gunther, CollectableDatabase.createDefaultCollectableStatistics());
        
        // Now, one by one, shoot each barrel in the game. Assess that the achievement will be
        // awarded as expected.
        for (let i = 1; i <= delegate.getCollectableCount(); ++i) {
            assert.setContext('barrel ' + i);

            const achievement = kMilestones.get(i);
            if (achievement)
                assert.isFalse(collectables.hasAchievement(gunther, achievement));
            
            const barrel = [ ...delegate.playerBarrels_.get(gunther).keys() ].shift();
            server.objectManager.onPlayerShootObject({
                playerid: gunther.id,
                objectid: barrel.id,
            });

            assert.equal(delegate.countCollectablesForPlayer(gunther).round, i);

            if (achievement) {
                assert.isTrue(collectables.hasAchievement(gunther, achievement));
                kMilestones.delete(i);
            }
        }
        
        assert.equal(kMilestones.size, 0);
    });

    it('should be possible to start new rounds for Red Barrels', assert => {
        delegate.refreshCollectablesForPlayer(
            gunther, CollectableDatabase.createDefaultCollectableStatistics());

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 0);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);

        // (1) Blow up one red barrel for |gunther|.
        const barrel = [ ...delegate.playerBarrels_.get(gunther).keys() ].shift();
        server.objectManager.onPlayerShootObject({
            playerid: gunther.id,
            objectid: barrel.id,
        });

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 1);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 1);

        // (2) Start a new round for |gunther|.
        delegate.startCollectableRoundForPlayer(gunther);

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 1);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);
    });
});
