// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('DerbyRegistry', (it, beforeEach) => {
    let registry = null;

    beforeEach(() => registry = server.featureManager.loadFeature('derbies').registry_);

    it('should be able to load all derbies defined in the JSON files', assert => {
        // If this test fails, then there's a configuration error in one of the JSON files that
        // contain the derbies available on Las Venturas Playground. Check out the detailed error.
        registry.ensureInitialized();

        // Iterate over each of the derbies, and make sure we can get them by ID.
        let iterations = 0;

        for (const description of registry.derbies()) {
            assert.strictEqual(registry.getDerby(description.id), description);
            iterations++;
        }

        assert.isAbove(iterations, 0);
    });
});
