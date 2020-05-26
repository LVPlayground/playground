// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RedBarrels } from 'features/collectables/red_barrels.js';

describe('RedBarrels', (it, beforeEach, afterEach) => {
    let delegate = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');
        delegate = new RedBarrels(feature.manager_);
    });

    afterEach(() => {
        if (delegate)
            delegate.dispose();
    });

    it('should be able to load the predefined barrels', assert => {
        // If this test fails, then there's an error in the "red_barrels.json" data file that would
        // prohibit the server from loading this feature correctly.

        assert.doesNotThrow(() => delegate.initialize());
        assert.isAbove(delegate.barrels_.size, 0);
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
});
