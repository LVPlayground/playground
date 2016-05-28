// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PickupManager = require('entities/pickup_manager.js');
const MockPickup = require('entities/test/mock_pickup.js');
const Vector = require('base/vector.js');

describe('PickupManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new PickupManager(MockPickup /* pickupConstructor */));
    afterEach(() => manager.dispose());

    it('should enable creation of manager', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        assert.isNotNull(pickup);

        assert.equal(pickup.modelId, 1225);
        assert.deepEqual(pickup.position, new Vector(1, 2, 3));
    });

    it('should count the number of created manager, and dispose of them appropriately', assert => {
        manager.createPickup({ modelId: 1222, position: new Vector(1, 2, 3) });
        manager.createPickup({ modelId: 1225, position: new Vector(4, 5, 6) });
        manager.createPickup({ modelId: 1230, position: new Vector(7, 8, 9) });

        assert.equal(manager.count, 3);

        manager.dispose();

        assert.equal(manager.count, 0);
    });

    it('should unregister manager when they get disposed of', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });

        assert.equal(manager.count, 1);

        pickup.dispose();

        assert.equal(manager.count, 0);
    });

    it('should throw on disposing invalid manager', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });

        assert.equal(manager.count, 1);

        pickup.dispose();

        assert.equal(manager.count, 0);

        assert.throws(() => pickup.dispose());
        assert.throws(() => manager.didDisposePickup(pickup));
    });
});
