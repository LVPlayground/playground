// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DerbyRegistry } from 'features/derbies/derby_registry.js';

describe('DerbyRegistry', it => {
    it('should be able to initialize all derbies known to the server', assert => {
        const registry = new DerbyRegistry();

        // Initialize all the JSON files that exist in the //data/ directory.
        registry.initialize();

        assert.isAbove(registry.size, 0);
    })
});
