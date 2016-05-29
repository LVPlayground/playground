// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockPickup = require('entities/test/mock_pickup.js');
const Vector = require('base/vector.js');

describe('MockPickup', (it, beforeEach, afterEach) => {
    let pickup = null;

    beforeEach(() => {
        const modelId = 1254;
        const type = Pickup.TYPE_PERSISTENT;
        const position = new Vector(1000, 1750, 15);
        const virtualWorld = 42;

        pickup = new MockPickup(
            { didDisposePickup: () => 1 }, modelId, type, position, virtualWorld);
    });

    afterEach(() => {
        if (pickup.isConnected())
            pickup.dispose();
    });

    it('should allow getting the model Id of the pickup as a number', assert => {
        assert.equal(typeof pickup.modelId, 'number');
        assert.equal(pickup.modelId, 1254);

        assert.throws(() => pickup.modelId = null);
        assert.throws(() => pickup.modelId = 122);
    });

    it('should allow getting the position of the pickup as a vector', assert => {
        assert.equal(typeof pickup.position, 'object');
        assert.isTrue(pickup.position instanceof Vector);
        assert.deepEqual(pickup.position, new Vector(1000, 1750, 15));

        assert.throws(() => pickup.position = null);
        assert.throws(() => pickup.position = 42);
    });

    it('should allow getting the type of the pickup as a number', assert => {
        assert.equal(typeof pickup.type, 'number');
        assert.equal(pickup.type, Pickup.TYPE_PERSISTENT);

        assert.throws(() => pickup.type = null);
        assert.throws(() => pickup.type = Pickup.TYPE_VEHICLE);
    });

    it('should allow getting the virtual world of the pickup as a number', assert => {
        assert.equal(typeof pickup.virtualWorld, 'number');
        assert.equal(pickup.virtualWorld, 42);

        assert.throws(() => pickup.virtualWorld = null);
        assert.throws(() => pickup.virtualWorld = 0);
    });

    it('should allow disposing of the pickup', assert => {
        assert.isTrue(pickup.isConnected());

        pickup.dispose();

        assert.isFalse(pickup.isConnected());
    });

    it('should not be possible to add or delete properties from a pickup', assert => {
        assert.isTrue(Object.isSealed(pickup));

        assert.throws(() => pickup.hat = null);
        assert.throws(() => pickup.shadow = true);

        assert.equal(pickup.modelId, 1254);

        delete pickup.modelId;

        assert.equal(pickup.modelId, 1254);
    });

    it('should have an interface identical to that of a real Pickup', assert => {
        const pickupProperties = Object.getOwnPropertyNames(Pickup.prototype).sort();
        const mockPickupProperties = Object.getOwnPropertyNames(MockPickup.prototype).sort();

        assert.deepEqual(mockPickupProperties, pickupProperties);
    });
});
