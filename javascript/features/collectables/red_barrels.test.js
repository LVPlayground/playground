// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RedBarrels } from 'features/collectables/red_barrels.js';

describe('RedBarrels', (it, beforeEach) => {
    let delegate = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');
        delegate = new RedBarrels(feature.manager_);
    });

    it('should be able to load the predefined barrels', assert => {
        // If this test fails, then there's an error in the "red_barrels.json" data file that would
        // prohibit the server from loading this feature correctly.

        assert.doesNotThrow(() => delegate.initialize());
        assert.isAbove(delegate.barrels_.size, 0);
    });
});