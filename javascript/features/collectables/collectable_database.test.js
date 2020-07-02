// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { MockCollectableDatabase } from 'features/collectables/test/mock_collectable_database.js';

describe('CollectableDatabase', it => {
    it('has the ability to collate collectables by type and round', async (assert) => {
        const database = new MockCollectableDatabase();
        const results = await database.loadCollectablesForPlayer();

        const sprayTags = results.get(CollectableDatabase.kSprayTag);
        const redBarrels = results.get(CollectableDatabase.kRedBarrel);
        const treasures = results.get(CollectableDatabase.kTreasures);

        assert.equal(sprayTags.collected.size, 5);
        assert.equal(sprayTags.collectedRound.size, 2);
        assert.equal(sprayTags.round, 2);

        assert.equal(redBarrels.collected.size, 6);
        assert.equal(redBarrels.collectedRound.size, 6);
        assert.equal(redBarrels.round, 1);

        assert.equal(treasures.collected.size, 3);
        assert.equal(treasures.collectedRound.size, 3);
        assert.equal(treasures.round, 1);
    });
});
