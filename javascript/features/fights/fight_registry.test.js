// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('FightRegistry', (it, beforeEach) => {
    let registry = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('fights');

        registry = feature.registry_;
    });

    it('should be able to load all defined locations', assert => {
        // If this test fails, then one of the fight location JSON files contains invalid data. The
        // StructuredGameDescription class outputs clear and detailed exception messages.
        registry.initializeLocations();

        // At least one location must have been successfully loaded.
        assert.isAbove(registry.locations.size, 0);
    });
});
