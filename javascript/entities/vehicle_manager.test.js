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

    // Observer recording all calls that can be used with the VehicleManager.
    class MyVehicleObserver {
        constructor() {
            this.spawned = [];
            this.deaths = [];
        }

        onVehicleSpawn(vehicle) { this.spawned.push(vehicle); }
        onVehicleDeath(vehicle) { this.deaths.push(vehicle); }
    }

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

    it('should not double-register observers to the vehicle manager', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const observer = new MyVehicleObserver();

        manager.addObserver(observer);
        manager.addObserver(observer);

        vehicle.spawn();

        assert.equal(observer.spawned.length, 1);
    });

    it('should not send events to observers when they removed themselves', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const observer = new MyVehicleObserver();

        manager.addObserver(observer);

        vehicle.spawn();
        assert.equal(observer.spawned.length, 1);

        manager.removeObserver(observer);

        vehicle.spawn();
        assert.equal(observer.spawned.length, 1);
    });

    it('should properly forward events to the observers', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const observer = new MyVehicleObserver();

        manager.addObserver(observer);

        vehicle.spawn();

        assert.equal(observer.spawned.length, 1);
        assert.equal(observer.spawned[0], vehicle);

        vehicle.death();

        assert.equal(observer.deaths.length, 1);
        assert.equal(observer.deaths[0], vehicle);
    });
});
