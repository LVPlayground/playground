// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { Treasures } from 'features/collectables/treasures.js';

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
    });
});
