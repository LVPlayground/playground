// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('VehicleManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let streamer = null;

    // The position at which the test vehicle should be created.
    const kPosition = new Vector(6000, 6000, 6000);

    beforeEach(async() => {
        const feature = server.featureManager.loadFeature('vehicles');

        gunther = server.playerManager.getById(0 /* Gunther */);
        manager = feature.manager_;
        streamer = server.featureManager.loadFeature('streamer');

        await manager.loadVehicles();

        // Move |gunther| to the starting position for these tests.
        gunther.position = kPosition;
    });

    it('should load vehicle data from the database by default', async(assert) => {
        assert.isAbove(manager.size, 0);

        const vehicles = [ ...manager.vehicles_.values() ];
        assert.equal(vehicles.length, manager.size);

        const originalVehicleCount = server.vehicleManager.count;

        // Stream the vehicles. The vehicle closest to |gunther| should be created.
        gunther.position = vehicles[0].position.translate({ z: 2 });

        await streamer.streamForTesting([ gunther ]);

        assert.equal(server.vehicleManager.count, originalVehicleCount + 1);

        // Dispose of the VehicleManager. All created vehicles should be removed.
        manager.dispose();
        manager.dispose = () => true;

        assert.equal(server.vehicleManager.count, originalVehicleCount);
    });

    it('should recreate vehicles when the streamer reloads', async assert => {
        const originalStreamerSize = streamer.sizeForTesting;

        assert.isTrue(server.featureManager.isEligibleForLiveReload('streamer'));
        assert.isTrue(await server.featureManager.liveReload('streamer'));

        const newStreamer = server.featureManager.loadFeature('streamer');
        assert.notStrictEqual(newStreamer, streamer);
        assert.equal(newStreamer.sizeForTesting, originalStreamerSize);
    });

    it('should automatically stream created vehicles in', assert => {
        gunther.position = kPosition;
        gunther.rotation = 127;

        const streamableVehicle = manager.createVehicle(gunther, /* Hydra= */ 520);
        assert.isNotNull(streamableVehicle);
        assert.isNotNull(streamableVehicle.live);

        const vehicle = streamableVehicle.live;
        assert.isTrue(vehicle.isConnected());

        assert.equal(vehicle.modelId, 520 /* Hydra */);
        assert.equal(vehicle.numberPlate, gunther.name);

        assert.deepEqual(vehicle.position, kPosition);
        assert.equal(vehicle.rotation, 127);
        assert.equal(vehicle.interiorId, 0);
        assert.equal(vehicle.virtualWorld, 0);
    });

    it('should limit ephemeral vehicles to a single one for players', assert => {
        assert.equal(manager.getVehicleLimitForPlayer(gunther), 1);

        const firstStreamableVehicle = manager.createVehicle(gunther, /* Infernus= */ 411);
        assert.isNotNull(firstStreamableVehicle);

        const firstVehicle = firstStreamableVehicle.live;

        assert.isNotNull(firstVehicle);
        assert.isTrue(firstVehicle.isConnected());
        assert.equal(firstVehicle.numberPlate, gunther.name);

        const secondStreamableVehicle = manager.createVehicle(gunther, /* Hydra= */ 520);
        assert.isNotNull(secondStreamableVehicle);

        const secondVehicle = secondStreamableVehicle.live;

        assert.isNotNull(secondVehicle);
        assert.isTrue(secondVehicle.isConnected());

        // The Infernus should now have been destroyed.
        assert.isFalse(firstVehicle.isConnected());
    });

    it('should be able to tell whether it manages a vehicle', assert => {
        const streamableVehicle = manager.createVehicle(gunther, /* Hydra= */ 520);
        const managedVehicle = streamableVehicle.live;

        assert.isTrue(managedVehicle.isConnected());
        assert.isTrue(manager.isManagedVehicle(managedVehicle));

        const unmanagedVehicle = server.vehicleManager.createVehicle({
            modelId: 412 /* Infernus */,
            position: new Vector(2500, 3000, 3500)
        });

        assert.isTrue(unmanagedVehicle.isConnected());
        assert.isFalse(manager.isManagedVehicle(unmanagedVehicle));

        // Dispose of the VehicleManager. All managed created vehicles should be removed.
        manager.dispose();
        manager.dispose = () => true;

        assert.isFalse(managedVehicle.isConnected());
        assert.isTrue(unmanagedVehicle.isConnected());
    });

    it('should be able to delete vehicles from the game', async(assert) => {
        const streamableVehicle = manager.createVehicle(gunther, /* Hydra= */ 520);
        const vehicle = streamableVehicle.live;

        assert.isTrue(vehicle.isConnected());
        assert.isTrue(manager.isManagedVehicle(vehicle));

        const originalVehicleCount = server.vehicleManager.count;

        await manager.deleteVehicle(vehicle);

        assert.isFalse(vehicle.isConnected());
        assert.isFalse(manager.isManagedVehicle(vehicle));

        assert.equal(server.vehicleManager.count, originalVehicleCount - 1);
    });

    return;  // disabled! xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    it('should be able to store new vehicles in the database', async(assert) => {
        const managedVehicle = manager.createVehicle(gunther, /* Hydra= */ 520);
        assert.isNotNull(managedVehicle);
        assert.isTrue(managedVehicle.isConnected());

        assert.isFalse(manager.isPersistentVehicle(managedVehicle));

        const updatedVehicle = await manager.storeVehicle(managedVehicle);
        assert.isNotNull(updatedVehicle);

        assert.isFalse(managedVehicle.isConnected());
        assert.isTrue(updatedVehicle.isConnected());

        assert.isTrue(manager.isPersistentVehicle(updatedVehicle));
    });

    it('should be able to update existing vehicles in the database', async(assert) => {
        gunther.position = new Vector(500, 1000, 1500);
        await vehicleStreamer.stream();

        assert.equal(manager.count, 1);

        const managedDatabaseVehicle = [...manager.vehicles][0];
        assert.isTrue(managedDatabaseVehicle.isPersistent());

        const managedVehicle = manager.streamer.getLiveVehicle(managedDatabaseVehicle);
        assert.isNotNull(managedVehicle);
        assert.isTrue(managedVehicle.isConnected());

        const updatedVehicle = await manager.storeVehicle(managedVehicle);
        assert.isNotNull(updatedVehicle);

        assert.equal(manager.count, 1);

        const updatedDatabaseVehicle = [...manager.vehicles][0];
        assert.notEqual(updatedDatabaseVehicle, managedDatabaseVehicle);
        assert.equal(updatedDatabaseVehicle.databaseId, managedDatabaseVehicle.databaseId);
        assert.isTrue(updatedDatabaseVehicle.isPersistent());

        assert.isFalse(managedVehicle.isConnected());
        assert.isTrue(updatedVehicle.isConnected());
    });

    it('should move players over to the updated vehicle automatically', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy = server.playerManager.getById(2 /* Lucy */);

        const vehicle = manager.createVehicle(kHydra);
        assert.isTrue(vehicle.isConnected());

        gunther.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);
        russell.enterVehicle(vehicle, Vehicle.SEAT_PASSENGER);
        lucy.enterVehicle(vehicle, Vehicle.SEAT_PASSENGER + 2 /* 3rd passenger */);

        assert.equal(gunther.vehicle, vehicle);
        assert.equal(russell.vehicle, vehicle);
        assert.equal(lucy.vehicle, vehicle);

        const updatedVehicle = await manager.storeVehicle(vehicle);
        assert.isNotNull(updatedVehicle);

        assert.isNull(gunther.vehicle);
        assert.isNull(russell.vehicle);
        assert.isNull(lucy.vehicle);

        lucy.disconnectForTesting();  // the management should consider this as a signal

        await server.clock.advance(500);  // half a second

        assert.equal(gunther.vehicle, updatedVehicle);
        assert.equal(gunther.vehicleSeat, Vehicle.SEAT_DRIVER);

        assert.equal(russell.vehicle, updatedVehicle);
        assert.equal(russell.vehicleSeat, Vehicle.SEAT_PASSENGER);

        assert.isNull(lucy.vehicle);
    });
});
