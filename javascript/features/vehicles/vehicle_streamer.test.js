// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockVehicle = require('test/mock_vehicle.js');
const VehicleStreamer = require('features/vehicles/vehicle_streamer.js');

const createStoredVehicle = require('features/vehicles/test/create_stored_vehicle.js');

describe('VehicleStreamer', (it, beforeEach, afterEach) => {
    let streamer = null;

    beforeEach(() => streamer = new VehicleStreamer(MockVehicle /* vehicleConstructor */));
    afterEach(() => streamer.dispose());

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
});
