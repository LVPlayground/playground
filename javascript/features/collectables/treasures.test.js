// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';

describe('SprayTags', (it, beforeEach) => {
    let collectables = null;
    let delegate = null;
    let gunther = null;

    beforeEach(() => {
        collectables = server.featureManager.loadFeature('collectables');
        delegate = collectables.manager_.getDelegate(CollectableDatabase.kTreasures);
        gunther = server.playerManager.getById(/* Gunther= */ 0);

        delegate.initialize();
    });
});
