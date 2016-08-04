// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('PlaygroundJS', it => {
    const MOCK_COUNTER_FILE = 'base/test/mock_counter.js';

    it('should cache require() imports by default', assert => {
        assert.equal(require(MOCK_COUNTER_FILE)(), 1);
        assert.equal(require(MOCK_COUNTER_FILE)(), 2);
        assert.equal(require(MOCK_COUNTER_FILE)(), 3);

        const fn = require(MOCK_COUNTER_FILE);
        assert.equal(fn(), 4);
    });

    it('should be able to clear the require() caches', assert => {
        require.clear(MOCK_COUNTER_FILE);

        assert.equal(require(MOCK_COUNTER_FILE)(), 1);
        assert.equal(require(MOCK_COUNTER_FILE)(), 2);
        assert.equal(require(MOCK_COUNTER_FILE)(), 3);

        // Clearing by full relative filename.
        require.clear(MOCK_COUNTER_FILE);

        assert.equal(require(MOCK_COUNTER_FILE)(), 1);
        assert.equal(require(MOCK_COUNTER_FILE)(), 2);
        assert.equal(require(MOCK_COUNTER_FILE)(), 3);

        // Clearing by file prefix.
        require.clear('base/test/mock_cou');

        assert.equal(require(MOCK_COUNTER_FILE)(), 1);
        assert.equal(require(MOCK_COUNTER_FILE)(), 2);
        assert.equal(require(MOCK_COUNTER_FILE)(), 3);
    });
});
