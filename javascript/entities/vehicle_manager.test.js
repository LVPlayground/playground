// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockVehicle from 'entities/test/mock_vehicle.js';
import VehicleManager from 'entities/vehicle_manager.js';

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
        const TrailerStatusUpdateTimeMs = 1250;

        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const trailer1 = manager.createVehicle({ modelId: 611, position: new Vector(0, 0, 0) });
        const trailer2 = manager.createVehicle({ modelId: 611, position: new Vector(0, 0, 0) });

        const observer = new MyVehicleObserver();
        manager.addObserver(observer);

        // Behaviour of the attachTrailer() and detachTrailer() functions for vehicles.
        {
            assert.isNull(vehicle.trailer);
            assert.isNull(trailer1.parent);
            assert.isNull(trailer2.parent);

            vehicle.attachTrailer(trailer1);

            assert.equal(observer.detached.length, 0);
            assert.equal(observer.attached.length, 1);
            assert.strictEqual(vehicle.trailer, trailer1);
            assert.strictEqual(trailer1.parent, vehicle);
            assert.isNull(trailer2.parent);

            vehicle.attachTrailer(trailer2);

            assert.equal(observer.detached.length, 1);
            assert.equal(observer.attached.length, 2);
            assert.strictEqual(vehicle.trailer, trailer2);
            assert.isNull(trailer1.parent);
            assert.strictEqual(trailer2.parent, vehicle);

            vehicle.detachTrailer();

            assert.equal(observer.detached.length, 2);
            assert.equal(observer.attached.length, 2);
            assert.isNull(vehicle.trailer);
            assert.isNull(trailer1.parent);
            assert.isNull(trailer2.parent);
        }

        // Behaviour of trailers manually attached by players.
        {
            vehicle.setTrailerId(trailer1.id);  // fakes manual attachment

            await server.clock.advance(TrailerStatusUpdateTimeMs);

            assert.equal(observer.detached.length, 2);
            assert.equal(observer.attached.length, 3);
            assert.strictEqual(vehicle.trailer, trailer1);
            assert.strictEqual(trailer1.parent, vehicle);
            assert.isNull(trailer2.parent);

            vehicle.setTrailerId(trailer2.id);  // fakes another manual attachment

            await server.clock.advance(TrailerStatusUpdateTimeMs);

            assert.equal(observer.detached.length, 3);
            assert.equal(observer.attached.length, 4);
            assert.strictEqual(vehicle.trailer, trailer2);
            assert.isNull(trailer1.parent);
            assert.strictEqual(trailer2.parent, vehicle);

            vehicle.setTrailerId(0);  // fakes manual detachment

            await server.clock.advance(TrailerStatusUpdateTimeMs);

            assert.equal(observer.detached.length, 4);
            assert.equal(observer.attached.length, 4);
            assert.isNull(vehicle.trailer);
            assert.isNull(trailer1.parent);
            assert.isNull(trailer2.parent);
        }
    });

    it('should mark vehicles as detached when they respawn', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const trailer = manager.createVehicle({ modelId: 611, position: new Vector(0, 0, 0) });

        const observer = new MyVehicleObserver();
        manager.addObserver(observer);

        vehicle.attachTrailer(trailer);

        assert.equal(observer.detached.length, 0);
        assert.equal(observer.attached.length, 1);
        assert.equal(vehicle.trailer, trailer);
        assert.equal(trailer.parent, vehicle);

        vehicle.respawn();

        assert.equal(observer.detached.length, 1);
        assert.equal(observer.attached.length, 1);
        assert.isNull(vehicle.trailer);
        assert.isNull(trailer.parent);
    });

    it('should magically carry over trailers when teleporting the vehicle', assert => {
        const vehicle = manager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        const trailer = manager.createVehicle({ modelId: 611, position: new Vector(0, 0, 0) });

        vehicle.attachTrailer(trailer);

        assert.equal(vehicle.trailer, trailer);
        assert.equal(trailer.parent, vehicle);

        {
            vehicle.position = new Vector(500, 600, 700);
            assert.deepEqual(trailer.position, vehicle.position);
        }
        {
            vehicle.interiorId = 7;
            assert.equal(trailer.interiorId, vehicle.interiorId);
        }
        {
            vehicle.virtualWorld = 100;
            assert.equal(trailer.virtualWorld, vehicle.virtualWorld);
        }
    });

    it('should reapply locks to vehicles when they stream in for a player', assert => {
        const vehicle = manager.createVehicle({ modelId: 441, position: new Vector(200, 300, 50) });
        const gunther = server.playerManager.getById(0 /* Gunther */);

        let counter = 0;

        // Override the |lockForPlayer| method for the |vehicle| so that we can instrument it. The
        // parent method will still be called, so that normal functionality continues to work.
        vehicle.lockForPlayer = (function(player) {
            this.__proto__.lockForPlayer.call(this, player);
            counter++;

        }).bind(vehicle);

        vehicle.lockForPlayer(gunther);
        assert.isTrue(vehicle.isLockedForPlayer(gunther));
        assert.equal(counter, 1);

        vehicle.streamInForPlayer(gunther);
        assert.isTrue(vehicle.isLockedForPlayer(gunther));
        assert.equal(counter, 2);

        vehicle.unlockForPlayer(gunther);
        assert.isFalse(vehicle.isLockedForPlayer(gunther));
        assert.equal(counter, 2);

        vehicle.streamInForPlayer(gunther);
        assert.isFalse(vehicle.isLockedForPlayer(gunther));
        assert.equal(counter, 2);
    });
});
