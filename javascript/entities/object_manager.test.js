// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ObjectManager = require('entities/object_manager.js');
const MockObject = require('entities/test/mock_object.js');
const Vector = require('base/vector.js');

describe('ObjectManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new ObjectManager(MockObject /* objectConstructor */));
    afterEach(() => manager.dispose());

    it('should fly', assert => {
        assert.isTrue(true);
    });
});
