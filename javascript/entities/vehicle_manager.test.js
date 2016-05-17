// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockVehicle = require('test/mock_vehicle.js');
const Vector = require('base/vector.js');
const VehicleManager = require('entities/vehicle_manager.js');

describe('VehicleManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new VehicleManager(MockVehicle /* vehicleConstructor */));
    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should be able to count the number of created vehicles', assert => {
        manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        manager.createVehicle({ modelId: 520, position: new Vector(1, 1, 1) });

        assert.equal(manager.count, 2);
    });

    it('should create the correct vehicle', assert => {
        const vehicle = manager.createVehicle({
            modelId: 411,
            position: new Vector(42, 43, 44),
            rotation: 45,
            primaryColor: 50,
            secondaryColor: 100,
            siren: true,
            paintjob: 2,
            interiorId: 5,
            virtualWorld: 6
        });

        assert.isNotNull(vehicle);
        assert.isNotNull(vehicle.id);

        assert.equal(vehicle.modelId, 411);
        assert.deepEqual(vehicle.position, new Vector(42, 43, 44));
        assert.equal(vehicle.rotation, 45);
        assert.equal(vehicle.primaryColor, 50);
        assert.equal(vehicle.secondaryColor, 100);
        assert.isTrue(vehicle.siren);
        assert.equal(vehicle.paintjob, 2);
        assert.equal(vehicle.interiorId, 5);
        assert.equal(vehicle.virtualWorld, 6);
    });

    it('should be able to return a vehicle by its Id', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        assert.isNotNull(vehicle);

        const foundVehicle = manager.getById(vehicle.id /* vehicleId */);
        assert.isNotNull(foundVehicle);

        assert.equal(vehicle, foundVehicle);
    });

    it('should not return vehicles that have not been created by JavaScript', assert => {
        assert.equal(manager.count, 0);
        assert.isNull(manager.getById(51 /* vehicleId */));
    });

    it('should remove references to a vehicle that has been disposed of', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        assert.isTrue(vehicle.isConnected());

        assert.isNotNull(manager.getById(vehicle.id /* vehicleId */));
        assert.equal(manager.count, 1);

        vehicle.dispose();
        assert.isFalse(vehicle.isConnected());

        assert.isNull(manager.getById(vehicle.id /* vehicleId */));
        assert.equal(manager.count, 0);
    });

    it('should clear all vehicles being disposed', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        assert.isTrue(vehicle.isConnected());

        manager.dispose();
        manager = null;

        assert.isFalse(vehicle.isConnected());
    });
});
