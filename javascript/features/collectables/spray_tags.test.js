// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { SprayTags,
         kSprayTagTaggedModelId,
         kSprayTagUntaggedModelId } from 'features/collectables/spray_tags.js';

import { range } from 'base/range.js';

describe('SprayTags', (it, beforeEach, afterEach) => {
    let collectables = null;
    let delegate = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');

        collectables = new class {
            achievements = [];

            awardAchievement(player, achievement) {
                this.achievements.push(achievement);
            }
        };

        delegate = new SprayTags(collectables, feature.manager_);
    });

    afterEach(() => {
        if (delegate)
            delegate.dispose();
    });

    it('should create the right tag depending on whether they have been collected', assert => {
        delegate.initialize();

        const existingObjectCount = server.objectManager.count;
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        // Create all spray tags, as if the player has not collected any yet.
        const emptyStatistics = CollectableDatabase.createDefaultCollectableStatistics();

        delegate.refreshCollectablesForPlayer(gunther, emptyStatistics);

        const updatedObjectCount = server.objectManager.count;
        const updatedObjects = [ ...server.objectManager ].map(object => object.modelId);

        assert.isAbove(updatedObjectCount, existingObjectCount);
        assert.includes(updatedObjects, kSprayTagUntaggedModelId);
        assert.doesNotInclude(updatedObjects, kSprayTagTaggedModelId);
        assert.equal(
            delegate.countRemainingTagsForPlayer(gunther),
            updatedObjectCount - existingObjectCount);

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
        assert.isBelow(
            delegate.countRemainingTagsForPlayer(gunther),
            updatedObjectCount - existingObjectCount - 1);

        // Remove all spray tags for the player, this should null them out again.
        delegate.clearCollectablesForPlayer(gunther);

        assert.equal(server.objectManager.count, existingObjectCount);
    });

    it('should replace spray tags after they have been sprayed', assert => {
        delegate.initialize();

        const existingObjectCount = server.objectManager.count;
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

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

    it('awards achievements when exploding a certain number of barrels', async (assert) => {

    });
});
