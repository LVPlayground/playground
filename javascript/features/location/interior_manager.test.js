// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const InteriorManager = require('features/location/interior_manager.js');

describe('InteriorManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new InteriorManager());
    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should load the defined interior markers from the data file', assert => {
        assert.isAbove(manager.markerCount, 0);
        assert.equal(manager.markerCount % 2, 0);  // an even number
    });
});
