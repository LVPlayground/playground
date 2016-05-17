// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');
const Vector = require('base/vector.js');

describe('ScopedEntities', it => {
    it('should be able to create and dispose of scoped actors', assert => {
        const entities = new ScopedEntities();

        const gunther = entities.createActor({ modelId: 121, position: new Vector(12, 13, 14) });
        assert.isNotNull(gunther);
        assert.isTrue(gunther.isConnected());

        entities.dispose();

        assert.isNotNull(gunther);
        assert.isFalse(gunther.isConnected());
    });

    // TODO(Russell): Test with objects once that moves to an object manager.

    it('should be able to create and dispose of scoped vehicles', assert => {
        const entities = new ScopedEntities();

        const infernus = entities.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) });
        assert.isNotNull(infernus);
        assert.isTrue(infernus.isConnected());

        entities.dispose();

        assert.isNotNull(infernus);
        assert.isFalse(infernus.isConnected());
    });
});
