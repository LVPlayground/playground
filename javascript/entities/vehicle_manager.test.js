// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('VehicleManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(() => manager = server.vehicleManager);

    // Observer recording all calls that can be used with the VehicleManager.
    class MyVehicleObserver {
        constructor() {
            this.spawned = [];
            this.deaths = [];

            this.attached = [];
            this.detached = [];
        }

        onVehicleSpawn(vehicle) { this.spawned.push(vehicle); }
        onVehicleDeath(vehicle) { this.deaths.push(vehicle); }

        onTrailerAttached(vehicle, trailer) { this.attached.push({ vehicle, trailer }); }
        onTrailerDetached(vehicle, trailer) { this.detached.push({ vehicle, trailer }); }
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
        manager.dispose = () => null;

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

    it('should keep track of the trailers attached to vehicles', async(assert) => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const trailer1 = manager.createVehicle({ modelId: 611, position: new Vector(0, 0, 0) });
        const trailer2 = manager.createVehicle({ modelId: 611, position: new Vector(0, 0, 0) });

        // Behaviour of the attachTrailer() and detachTrailer() functions for vehicles.
        assert.isNull(vehicle.trailer);
        assert.isNull(trailer1.parent);
        assert.isNull(trailer2.parent);

        manager.reportTrailerUpdate(vehicle.id, trailer1.id);

        assert.strictEqual(vehicle.trailer, trailer1);
        assert.strictEqual(trailer1.parent, vehicle);
        assert.isNull(trailer2.parent);

        manager.reportTrailerUpdate(vehicle.id, trailer2.id);

        assert.strictEqual(vehicle.trailer, trailer2);
        assert.isNull(trailer1.parent);
        assert.strictEqual(trailer2.parent, vehicle);

        manager.reportTrailerUpdate(vehicle.id, null);

        assert.isNull(vehicle.trailer);
        assert.isNull(trailer1.parent);
        assert.isNull(trailer2.parent);

        vehicle.trailer = trailer1;

        assert.strictEqual(vehicle.trailer, trailer1);
        assert.strictEqual(trailer1.parent, vehicle);
        assert.isNull(trailer2.parent);

        vehicle.trailer = trailer2;

        assert.strictEqual(vehicle.trailer, trailer2);
        assert.isNull(trailer1.parent);
        assert.strictEqual(trailer2.parent, vehicle);

        vehicle.trailer = null;

        assert.isNull(vehicle.trailer);
        assert.isNull(trailer1.parent);
        assert.isNull(trailer2.parent);
    });

    it('should magically carry over trailers when teleporting the vehicle', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const trailer = manager.createVehicle({ modelId: 611, position: new Vector(0, 0, 0) });

        vehicle.trailer = trailer;

        assert.equal(vehicle.trailer, trailer);
        assert.equal(trailer.parent, vehicle);

        {
            vehicle.interiorId = 7;
            assert.equal(trailer.interiorId, vehicle.interiorId);
        }
        {
            vehicle.virtualWorld = 100;
            assert.equal(trailer.virtualWorld, vehicle.virtualWorld);
        }
    });

    it('should track modifications that players apply to vehicles', assert => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });

        gunther.enterVehicle(vehicle);

        let defaultPrevented = false;

        // (1) The vehicle should not have components by default.
        assert.equal(vehicle.getComponents().length, 0);

        // (2) Components get added through tuning.
        dispatchEvent('vehiclemod', {
            preventDefault: () => defaultPrevented = true,

            playerid: gunther.id,
            vehicleid: vehicle.id,
            componentid: 1096,  // Ahab Wheels
        });

        assert.isFalse(defaultPrevented);
        assert.isTrue(vehicle.hasComponent(1096));
        assert.equal(vehicle.getComponents().length, 1);
        assert.equal(vehicle.getComponentInSlot(Vehicle.kComponentSlotWheels), 1096);

        // (3) Components get added through programmatic modifications.
        assert.isTrue(vehicle.addComponent(1010 /* 10x Nitro */));

        assert.isTrue(vehicle.hasComponent(1010));
        assert.equal(vehicle.getComponents().length, 2);
        assert.equal(vehicle.getComponentInSlot(Vehicle.kComponentSlotNitro), 1010);

        // (4) Components get overridden through tuning.
        dispatchEvent('vehiclemod', {
            preventDefault: () => defaultPrevented = true,

            playerid: gunther.id,
            vehicleid: vehicle.id,
            componentid: 1008,  // 5x Nitro
        });

        assert.isTrue(vehicle.hasComponent(1008));
        assert.isFalse(vehicle.hasComponent(1010));  // 10x Nitro, overridden
        assert.equal(vehicle.getComponents().length, 2);
        assert.equal(vehicle.getComponentInSlot(Vehicle.kComponentSlotNitro), 1008);

        // (5) Components get overridden through programmatic modifications.
        assert.isTrue(vehicle.addComponent(1081 /* Grove Wheels */));

        assert.isTrue(vehicle.hasComponent(1081));
        assert.isFalse(vehicle.hasComponent(1096));  // Ahab Wheels, overridden
        assert.equal(vehicle.getComponents().length, 2);
        assert.equal(vehicle.getComponentInSlot(Vehicle.kComponentSlotWheels), 1081);

        // (6) Components cannot be removed if they haven't been added to the car.
        assert.isFalse(vehicle.removeComponent(1096 /* Ahab Wheels */));

        // (6) Components get removed through programmatic modifications.
        assert.isTrue(vehicle.removeComponent(1081 /* Grove Wheels */));
        
        assert.isFalse(vehicle.hasComponent(1081));
        assert.equal(vehicle.getComponents().length, 1);
        assert.isNull(vehicle.getComponentInSlot(Vehicle.kComponentSlotWheels));

        // (7) Components get removed through clearing all components.
        vehicle.clearComponents();

        assert.isFalse(vehicle.hasComponent(1008));
        assert.equal(vehicle.getComponents().length, 0);
        assert.isNull(vehicle.getComponentInSlot(Vehicle.kComponentSlotNitro));
    });
});
