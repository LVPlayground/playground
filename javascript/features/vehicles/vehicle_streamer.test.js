// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockServer = require('test/mock_server.js');
const MockVehicle = require('test/mock_vehicle.js');
const PriorityQueue = require('base/priority_queue.js');
const Vector = require('base/vector.js');
const VehicleStreamer = require('features/vehicles/vehicle_streamer.js');

const createStoredVehicle = require('features/vehicles/test/create_stored_vehicle.js');

describe('VehicleStreamer', (it, beforeEach, afterEach) => {
    let streamer = null;

    MockServer.bindTo(beforeEach, afterEach,
        () => streamer = new VehicleStreamer(MockVehicle /* vehicleConstructor */),
        () => streamer.dispose());

    it('should properly group persistent and non-persistent vehicles', assert => {
        const persistentVehicle = createStoredVehicle({ persistent: true });
        const streamableVehicle = createStoredVehicle();

        streamer.initialize();

        streamer.addVehicle(persistentVehicle);
        streamer.addVehicle(streamableVehicle);

        assert.equal(streamer.persistentVehicleCount, 1);
        assert.equal(streamer.streamedVehicleCount, 1);

        streamer.removeVehicle(streamableVehicle);
        streamer.removeVehicle(persistentVehicle);

        assert.equal(streamer.persistentVehicleCount, 0);
        assert.equal(streamer.streamedVehicleCount, 0);
    });

    it('should not allow vehicles to be removed until the first initialization', assert => {
        const streamableVehicle = createStoredVehicle();

        streamer.addVehicle(streamableVehicle);

        assert.equal(streamer.streamedVehicleCount, 1);
        assert.isFalse(streamer.isInitialized());

        assert.throws(() => streamer.removeVehicle(streamableVehicle));

        assert.equal(streamer.streamedVehicleCount, 1);

        streamer.initialize();

        streamer.removeVehicle(streamableVehicle);
        assert.equal(streamer.streamedVehicleCount, 0);

        assert.throws(() => streamer.initialize());
    });

    it('should lazily create persistent vehicles', assert => {
        const persistentVehicle = createStoredVehicle({ persistent: true });

        streamer.addVehicle(persistentVehicle);
        assert.isNull(persistentVehicle.vehicle);

        streamer.initialize();
        assert.isNotNull(persistentVehicle.vehicle);

        streamer.removeVehicle(persistentVehicle);
        assert.isNull(persistentVehicle.vehicle);
    });

    it('should eagerly create persistent vehicles', assert => {
        const persistentVehicle = createStoredVehicle({ persistent: true });

        streamer.initialize();

        streamer.addVehicle(persistentVehicle);
        assert.isNotNull(persistentVehicle.vehicle);

        streamer.removeVehicle(persistentVehicle);
        assert.isNull(persistentVehicle.vehicle);
    });

    it('should not reference added streamable vehicles when no one is in range', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const streamableInfernus = createStoredVehicle({
            modelId: 411 /* Infernus */, positionX: 1000, positionY: 1000, positionZ: 0 });

        gunther.position = new Vector(1000, 2000, 0);  // 1000 units from the vehicle

        streamer.initialize();
        assert.equal(streamableInfernus.refCount, 0);

        streamer.addVehicle(streamableInfernus);
        assert.equal(streamableInfernus.refCount, 0);
    });

    it('should eagerly reference streamable vehicles when adding them', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const streamableInfernus = createStoredVehicle({
            modelId: 411 /* Infernus */, positionX: 1000, positionY: 1000, positionZ: 0 });

        gunther.position = new Vector(1000, 1050, 0);  // 50 units from the vehicle

        streamer.initialize();
        assert.equal(streamableInfernus.refCount, 0);

        streamer.addVehicle(streamableInfernus);
        assert.equal(streamableInfernus.refCount, 1);

        // TODO(Russell): Verify that the vehicle has been created.

        streamer.removeVehicle(streamableInfernus);
        assert.equal(streamableInfernus.refCount, 0);
    });

    // TODO(Russell): Write a test for lazily referencing vehicles.

    it('should order disposable vehicles by total ref count in ascending order', assert => {
        const queue = new PriorityQueue(VehicleStreamer.totalRefCountComparator);

        const streamableInfernus = createStoredVehicle({ modelId: 411 /* Infernus */ });
        streamableInfernus.increaseRefCount();
        streamableInfernus.increaseRefCount();

        const streamablePatriot = createStoredVehicle({ modelId: 470 /* Patriot */ });
        streamablePatriot.increaseRefCount();

        const streamableDinghy = createStoredVehicle({ modelId: 473 /* Dinghy */ });
        streamableDinghy.increaseRefCount();
        streamableDinghy.increaseRefCount();
        streamableDinghy.increaseRefCount();

        queue.push(streamableInfernus, streamablePatriot, streamableDinghy);

        assert.equal(queue.pop(), streamablePatriot);
        assert.equal(queue.pop(), streamableInfernus);
        assert.equal(queue.pop(), streamableDinghy);
    });
});
