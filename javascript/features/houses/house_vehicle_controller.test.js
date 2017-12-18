// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import HouseParkingLot from 'features/houses/house_parking_lot.js';
import HouseVehicle from 'features/houses/house_vehicle.js';
import HouseVehicleController from 'features/houses/house_vehicle_controller.js';

describe('HouseVehicleController', (it, beforeEach, afterEach) => {
    let controller = null;

    beforeEach(() => {
        server.featureManager.loadFeature('streamer');

        controller = new HouseVehicleController(
            server.featureManager.createDependencyWrapperForFeature('streamer'));
    });

    afterEach(() => {
        if (controller)
            controller.dispose();
    });

    // Object instance that can be used as a location in the vehicle controller.
    const location = Object.create({});

    // Returns a random number between |min| and |max|, inclusive.
    const between = (min, max) => min + Math.floor(Math.random() * (max - min));

    // Creates a house vehicle instance with random, but valid data.
    function createRandomVehicle() {
        const parkingLot = new HouseParkingLot({
            id: between(0, 10000),
            position: new Vector(between(-100, 100), between(-100, 100), between(-5, 5)),
            rotation: between(0, 360),
            interiorId: between(0, 17)
        });

        return new HouseVehicle({
            id: between(0, 10000),
            modelId: between(400, 610)

        }, parkingLot);
    }

    it('should be able to create vehicles for any location', assert => {
        const serverVehicleCount = server.vehicleManager.count;

        assert.equal(controller.count, 0);

        for (let i = 0; i < 10; ++i)
            controller.createVehicle(location, createRandomVehicle());

        assert.equal(controller.count, 10);
        assert.equal(server.vehicleManager.count, serverVehicleCount + 10);

        // The controller should clean up after itself.
        controller.dispose();
        controller = null;

        assert.equal(server.vehicleManager.count, serverVehicleCount);
    });

    it('should be able to remove individual vehicles', assert => {
        const serverVehicleCount = server.vehicleManager.count;
        const vehicle = createRandomVehicle();

        assert.equal(controller.count, 0);

        controller.createVehicle(location, vehicle);
        for (let i = 0; i < 10; ++i)
            controller.createVehicle(location, createRandomVehicle());

        assert.equal(controller.count, 11);
        assert.equal(server.vehicleManager.count, serverVehicleCount + 11);

        controller.removeVehicle(location, vehicle);

        assert.equal(controller.count, 10);
        assert.equal(server.vehicleManager.count, serverVehicleCount + 10);
    });

    it('should be able to remove vehicles for a location', assert => {
        const secondLocation = Object.create({});
        const serverVehicleCount = server.vehicleManager.count;

        assert.equal(controller.count, 0);

        for (let i = 0; i < 10; ++i)
            controller.createVehicle(location, createRandomVehicle());

        for (let i = 0; i < 10; ++i)
            controller.createVehicle(secondLocation, createRandomVehicle());

        assert.equal(controller.count, 20);
        assert.equal(server.vehicleManager.count, serverVehicleCount + 20);

        controller.removeVehiclesForLocation(secondLocation);

        assert.equal(controller.count, 10);
        assert.equal(server.vehicleManager.count, serverVehicleCount + 10);
    });

    it('should reattach vehicles when the streamer reloads', async assert => {
        assert.equal(controller.count, 0);

        for (let i = 0; i < 10; ++i)
            controller.createVehicle(location, createRandomVehicle());

        assert.equal(controller.count, 10);
        assert.equal(controller.streamer.size, 10);

        const oldStreamer = controller.streamer;

        assert.isTrue(await server.featureManager.liveReload('streamer'));

        assert.notEqual(controller.streamer, oldStreamer);
        assert.equal(controller.streamer.size, 10);
    });
});
