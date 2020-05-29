// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RedBarrels } from 'features/collectables/red_barrels.js';

import { range } from 'base/range.js';

describe('RedBarrels', (it, beforeEach, afterEach) => {
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

        delegate = new RedBarrels(collectables, feature.manager_);
    });

    afterEach(() => {
        if (delegate)
            delegate.dispose();
    });

    it('should be able to load the predefined barrels', assert => {
        // If this test fails, then there's an error in the "red_barrels.json" data file that would
        // prohibit the server from loading this feature correctly.

        assert.doesNotThrow(() => delegate.initialize());
        assert.isAbove(delegate.getCollectableCount(), 0);
    });

    it('is able to show and hide map icons for each of the defined barrels', assert => {
        delegate.initialize();

        const existingIconCount = server.mapIconManager.count;

        // Disabling the icons when they're already disabled has no effect.
        delegate.refreshCollectableMapIcons(false);

        assert.equal(server.mapIconManager.count, existingIconCount);

        // Creating the icons will add a bunch of map icons to the server.
        delegate.refreshCollectableMapIcons(true);

        const updatedIconCount = server.mapIconManager.count;
        assert.isAbove(updatedIconCount, existingIconCount);

        // Creating the icons again will be a no-op as well, as they already exist.
        delegate.refreshCollectableMapIcons(true);

        assert.equal(server.mapIconManager.count, updatedIconCount);

        // Disabling the icons again will bring us back to the original icon count.
        delegate.refreshCollectableMapIcons(false);

        assert.equal(server.mapIconManager.count, existingIconCount);

        // Creating them again, and then disposing the delegate, should remove all of them.
        delegate.refreshCollectableMapIcons(true);

        assert.equal(server.mapIconManager.count, updatedIconCount);

        delegate.dispose();
        delegate = null;

        assert.equal(server.mapIconManager.count, existingIconCount);
    });

    it('should only create barrels when they have not been collected yet', assert => {
        delegate.initialize();

        const existingObjectCount = server.objectManager.count;
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        // Create all barrels, as if the player has not collected any yet.
        delegate.refreshCollectablesForPlayer(gunther, new Set());

        const updatedObjectCount = server.objectManager.count;

        assert.isAbove(updatedObjectCount, existingObjectCount);

        // Now update the barrels to a situation in which half of 'em have been collected.
        delegate.refreshCollectablesForPlayer(gunther, new Set([ ...range(50) ]));

        assert.isAbove(server.objectManager.count, existingObjectCount);
        assert.isBelow(server.objectManager.count, updatedObjectCount);

        // Remove all barrels for the player, this should null them out again.
        delegate.clearCollectablesForPlayer(gunther);

        assert.equal(server.objectManager.count, existingObjectCount);
    });

    it('should remove barrels when they have been shot', assert => {
        delegate.initialize();

        const existingObjectCount = server.objectManager.count;
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        // Create all barrels, as if the player has not collected any yet.
        delegate.refreshCollectablesForPlayer(gunther, new Set());

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

    it('awards achievements when exploding a certain number of barrels', async (assert) => {

    });
});
