// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';

describe('CollectableBase', (it, beforeEach) => {
    let manager = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');
        manager = feature.manager_;
    });

    it('should be able to load the predefined collectable data', assert => {
        const applicableDelegates = [
            [ CollectableDatabase.kSprayTag, 'Spray Tags' ],
            [ CollectableDatabase.kRedBarrel, 'Red Barrels' ],
        ];

        for (const [ type, name ] of applicableDelegates) {
            assert.setContext(name);

            const delegate = manager.getDelegate(type);

            // If this test fails, then there's an error in JSON file that's associated with the
            // collectable indicated in the "context" of the error message.
            assert.doesNotThrow(() => delegate.initialize());
            assert.isAbove(delegate.getCollectableCount(), 0);
        }
    });

    it('is able to show and hide map icons for each of the defined barrels', assert => {
        const applicableDelegates = [
            [ CollectableDatabase.kSprayTag, 'Spray Tags' ],
            [ CollectableDatabase.kRedBarrel, 'Red Barrels' ],
        ];

        for (const [ type, name ] of applicableDelegates) {
            assert.setContext(name);

            const delegate = manager.getDelegate(type);

            // If any of these asserts fail, pay attention to the "context" part of the error
            // message which will tell you what kind of collectable has an issue. This most likely
            // has to do with the data format not having a position vector.
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

            assert.equal(server.mapIconManager.count, existingIconCount);
        }
    });
});
