// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SprayTags } from 'features/collectables/spray_tags.js';

describe('SprayTags', (it, beforeEach) => {
    let delegate = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');
        delegate = new SprayTags(feature.manager_);
    });

    it('should be able to load the predefined spray tags', assert => {
        // If this test fails, then there's an error in the "spray_tags.json" data file that would
        // prohibit the server from loading this feature correctly.

        assert.doesNotThrow(() => delegate.initialize());
        assert.isAbove(delegate.tags_.size, 0);
    });
});
