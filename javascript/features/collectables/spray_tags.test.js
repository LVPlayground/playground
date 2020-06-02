// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';

import { kSprayTagTaggedModelId, kSprayTagUntaggedModelId } from 'features/collectables/spray_tags.js';

import * as achievements from 'features/collectables/achievements.js';
import { range } from 'base/range.js';

describe('SprayTags', (it, beforeEach) => {
    let collectables = null;
    let delegate = null;
    let gunther = null;

    beforeEach(() => {
        collectables = server.featureManager.loadFeature('collectables');
        delegate = collectables.manager_.getDelegate(CollectableDatabase.kSprayTag);
        gunther = server.playerManager.getById(/* Gunther= */ 0);

        delegate.initialize();
    });

    it('should create the right tag depending on whether they have been collected', assert => {
        const existingObjectCount = server.objectManager.count;

        // Create all spray tags, as if the player has not collected any yet.
        const emptyStatistics = CollectableDatabase.createDefaultCollectableStatistics();

        delegate.refreshCollectablesForPlayer(gunther, emptyStatistics);

        const updatedObjectCount = server.objectManager.count;
        const updatedObjects = [ ...server.objectManager ].map(object => object.modelId);

        assert.isAbove(updatedObjectCount, existingObjectCount);
        assert.includes(updatedObjects, kSprayTagUntaggedModelId);
        assert.doesNotInclude(updatedObjects, kSprayTagTaggedModelId);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);

        // Now update the tags to a situation in which half of 'em have been collected. The same
        // number of objects should be created, just with a different model Id composition.
        const progressedStatistics = CollectableDatabase.createDefaultCollectableStatistics();
        progressedStatistics.collectedRound = new Set([ ...range(50) ]);
        delegate.refreshCollectablesForPlayer(gunther, progressedStatistics);

        const refreshedObjectCount = server.objectManager.count;
        const refreshedObjects = [ ...server.objectManager ].map(object => object.modelId);

        assert.equal(refreshedObjectCount, updatedObjectCount);
        assert.includes(refreshedObjects, kSprayTagUntaggedModelId);
        assert.includes(refreshedObjects, kSprayTagTaggedModelId);
        assert.isAboveOrEqual(delegate.countCollectablesForPlayer(gunther).round, 1);

        // Remove all spray tags for the player, this should null them out again.
        delegate.clearCollectablesForPlayer(gunther);

        assert.equal(server.objectManager.count, existingObjectCount);
    });

    it('should replace spray tags after they have been sprayed', assert => {
        const existingObjectCount = server.objectManager.count;

        // Create all spray tags, as if the player has not collected any yet.
        delegate.refreshCollectablesForPlayer(
            gunther, CollectableDatabase.createDefaultCollectableStatistics());

        const updatedObjectCount = server.objectManager.count;

        assert.isAbove(updatedObjectCount, existingObjectCount);

        // Now have |gunther| spray one of the tags. This requires some poking around in the
        // internals of SprayTags to get the first spray tag created for |gunther|.
        const sprayTag = [ ...delegate.playerTags_.get(gunther).keys() ].shift();

        assert.isTrue(sprayTag.isConnected());

        // (1) Position |gunther| ahead of the spray tag, but have him spray in the wrong direction.
        gunther.position = sprayTag.position.translateTo2D(3, 90);
        gunther.rotation = 180;

        delegate.processSprayTagForPlayer(gunther.id);

        assert.isTrue(sprayTag.isConnected());

        // (2) Now change |gunther| to be facing the right direction, actually hitting the tag.
        gunther.rotation = -90;

        delegate.processSprayTagForPlayer(gunther.id);

        assert.isFalse(sprayTag.isConnected());

        // The tag should've been replaced, not removed from the map, so count stays equal.
        assert.equal(server.objectManager.count, updatedObjectCount);
    });

    it('awards achievements when exploding a certain number of spray tags', async (assert) => {
        const kTotal = 100;
        const kMilestones = new Map([
            [  10, achievements.kAchievementSprayTagBronze ],
            [  40, achievements.kAchievementSprayTagSilver ],
            [  90, achievements.kAchievementSprayTagGold ],
            [ 100, achievements.kAchievementSprayTagPlatinum ],
        ]);

        // Create all spray tags, as if the player has not collected any yet.
        delegate.refreshCollectablesForPlayer(
            gunther, CollectableDatabase.createDefaultCollectableStatistics());
        
        // Now, one by one, tag each of the spray tags in the game. This should, progressively,
        // have |gunther| collect all of the achievements.
        for (let i = 1; i <= delegate.getCollectableCount(); ++i) {
            assert.setContext('tag ' + i);

            const achievement = kMilestones.get(i);
            if (achievement)
                assert.isFalse(collectables.hasAchievement(gunther, achievement));
            
            const sprayTag = [ ...delegate.playerTags_.get(gunther).keys() ].shift();
            gunther.position = sprayTag.position.translateTo2D(3, 90);
            gunther.rotation = 270;

            delegate.processSprayTagForPlayer(gunther.id);

            assert.equal(delegate.countCollectablesForPlayer(gunther).round, i);

            if (achievement) {
                assert.isTrue(collectables.hasAchievement(gunther, achievement));
                kMilestones.delete(i);
            }
        }
        
        assert.equal(kMilestones.size, 0);
    });

    it('should be possible to start new rounds for Spray Tags', assert => {
        delegate.refreshCollectablesForPlayer(
            gunther, CollectableDatabase.createDefaultCollectableStatistics());

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 0);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);

        // (1) Tag one Spray Tag for |gunther|.
        const sprayTag = [ ...delegate.playerTags_.get(gunther).keys() ].shift();
        gunther.position = sprayTag.position.translateTo2D(3, 90);
        gunther.rotation = 270;

        delegate.processSprayTagForPlayer(gunther.id);

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 1);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 1);

        // (2) Start a new round for |gunther|.
        delegate.startCollectableRoundForPlayer(gunther);

        assert.equal(delegate.countCollectablesForPlayer(gunther).total, 1);
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);
    });
});
