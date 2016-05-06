// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const InteriorSelector = require('components/interior_selector/interior_selector.js');
const MockServer = require('test/mock_server.js');

describe('InteriorSelector', (it, beforeEach, afterEach) => {
    let gunther = null;

    MockServer.bindTo(beforeEach, afterEach, server => {
        gunther = server.playerManager.getById(0 /* Gunther */);
    });

    it('should resolve with null', assert => {
        return InteriorSelector.select(gunther).then(result => assert.isNull(result));
    });
});
