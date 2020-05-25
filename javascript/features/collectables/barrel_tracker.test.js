// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BarrelTracker } from 'features/collectables/barrel_tracker.js';

describe('BarrelTracker', (it, beforeEach) => {
    let tracker = null;

    beforeEach(() => {
        const redBarrels = server.featureManager.loadFeature('collectables');
        tracker = redBarrels.tracker_;
    });

    it('should be able to load the predefined barrels', assert => {
        // If this test fails, then there's an error in the "red_barrels.json" data file that would
        // prohibit the server from loading this feature correctly.

        assert.doesNotThrow(() => tracker.loadBarrelsFromFile());
        assert.isAbove(tracker.barrels.size, 0);
    });
});
