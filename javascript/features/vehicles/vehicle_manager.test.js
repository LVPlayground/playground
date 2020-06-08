// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('VehicleManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let streamer = null;

    // The position at which the test vehicle should be created.
    const kPosition = new Vector(6000, 6000, 6000);

    // Settings required to create a Hydra with the VehicleManager.
    const kHydra = {
        modelId: 520 /* Hydra */,
        position: kPosition,
        rotation: 90,
        interiorId: 0,
        virtualWorld: 0
    };

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

    return;  // disabled!

    it('should automatically stream created vehicles in', assert => {
        gunther.position = new Vector(0, 0, 0);
        assert.isNull(manager.createVehicle({
            modelId: 412 /* Infernus */,
            position: new Vector(3000, 3000, 3000),
            rotation: 180,
            interiorId: 0,
            virtualWorld: 0
        }));

        gunther.position = kPosition;
        const vehicle = manager.createVehicle(kHydra);

        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.equal(vehicle.modelId, 520 /* Hydra */);
        assert.isNull(vehicle.numberPlate);

        assert.deepEqual(vehicle.position, kPosition);
        assert.equal(vehicle.rotation, 90);
        assert.equal(vehicle.interiorId, 0);
        assert.equal(vehicle.virtualWorld, 0);
    });

    it('should be able to tell whether it manages a vehicle', assert => {
        const managedVehicle = manager.createVehicle(kHydra);

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

    it('should be able to store new vehicles in the database', async(assert) => {
        const managedVehicle = manager.createVehicle(kHydra);
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

    it('should be able to delete vehicles from the game', async(assert) => {
        const vehicle = manager.createVehicle(kHydra);

        assert.isTrue(vehicle.isConnected());
        assert.isTrue(manager.isManagedVehicle(vehicle));

        const originalVehicleCount = server.vehicleManager.count;

        await manager.deleteVehicle(vehicle);

        assert.isFalse(vehicle.isConnected());
        assert.isFalse(manager.isManagedVehicle(vehicle));

        assert.equal(server.vehicleManager.count, originalVehicleCount - 1);
    });

    it('should be able to pin and unpin managed vehicles in the streamer', assert => {
        const vehicle = manager.createVehicle(kHydra);

        assert.isTrue(vehicle.isConnected());
        assert.isTrue(manager.isManagedVehicle(vehicle));

        const storedVehicle = Array.from(manager.vehicles).pop();
        assert.equal(storedVehicle.modelId, vehicle.modelId);

        assert.isFalse(manager.streamer.isPinned(storedVehicle));

        manager.pinVehicle(vehicle);

        assert.isTrue(manager.streamer.isPinned(storedVehicle));

        manager.unpinVehicle(vehicle);

        assert.isFalse(manager.streamer.isPinned(storedVehicle));
    });

    it('should apply vehicle access settings when creating them', async(assert) => {
        await gunther.identify({ userId: 5198 });

        const vehicle = manager.createVehicle(kHydra);
        assert.isTrue(vehicle.isConnected());

        const databaseVehicle = manager.getManagedDatabaseVehicle(vehicle);
        assert.isNotNull(databaseVehicle);

        assert.equal(databaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_EVERYONE);
        assert.equal(databaseVehicle.accessValue, 0);

        // Update the values directly. They should carry over when storing the vehicle.
        databaseVehicle.accessType = DatabaseVehicle.ACCESS_TYPE_PLAYER;
        databaseVehicle.accessValue = gunther.account.userId;

        const updatedVehicle = await manager.storeVehicle(vehicle);

        const updatedDatabaseVehicle = manager.getManagedDatabaseVehicle(updatedVehicle);
        assert.isNotNull(updatedDatabaseVehicle);

        // Make sure that the values were carried over appropriately.
        assert.equal(updatedDatabaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_PLAYER);
        assert.equal(updatedDatabaseVehicle.accessValue, gunther.account.userId);

        // Make sure that the given rights were applied in the VehicleAccessManager.
        assert.isTrue(
            manager.access.isLocked(updatedDatabaseVehicle, VehicleAccessManager.LOCK_PLAYER));
    });

    it('should be able to update vehicle access settings', async(assert) => {
        const vehicle = manager.createVehicle(kHydra);
        assert.isTrue(vehicle.isConnected());

        const databaseVehicle = manager.getManagedDatabaseVehicle(vehicle);
        assert.isNotNull(databaseVehicle);

        assert.equal(databaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_EVERYONE);
        assert.equal(databaseVehicle.accessValue, 0);

        await manager.updateVehicleAccess(vehicle, DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP, 0);

        assert.equal(databaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP);
        assert.equal(databaseVehicle.accessValue, 0);

        // Make sure that the given rights were applied in the VehicleAccessManager.
        assert.isTrue(
            manager.access.isLocked(databaseVehicle, VehicleAccessManager.ACCESS_TYPE_PLAYER_VIP));
    });

    it('should reset vehicle access settings when they respawn', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        await gunther.identify({ userId: 8432 });
        await russell.identify({ userId: 1451 });

        const vehicle = manager.createVehicle(kHydra);
        assert.isTrue(vehicle.isConnected());

        const databaseVehicle = manager.getManagedDatabaseVehicle(vehicle);
        assert.isNotNull(databaseVehicle);

        await manager.updateVehicleAccess(
            vehicle, DatabaseVehicle.ACCESS_TYPE_PLAYER, gunther.account.userId);

        // Make sure that the given rights were applied in the VehicleAccessManager.
        assert.isTrue(manager.access.isLocked(databaseVehicle, VehicleAccessManager.LOCK_PLAYER));

        assert.isTrue(manager.access.canAccessVehicle(gunther, databaseVehicle));
        assert.isFalse(manager.access.canAccessVehicle(russell, databaseVehicle));

        // Pretend as if Russell is locking the vehicle. Normally this wouldn't be possible, unless
        // Russell was an administrator and used the `/v enter` command.
        manager.access.restrictToPlayer(databaseVehicle, russell.account.userId);

        assert.isFalse(manager.access.canAccessVehicle(gunther, databaseVehicle));
        assert.isTrue(manager.access.canAccessVehicle(russell, databaseVehicle));

        // Now make sure that the |databaseVehicle| respawns, which should reset the original access
        // rights, overriding the ephemeral changes.
        vehicle.death();

        await server.clock.advance(180 * 1000);  // 3 minutes, the respawn duration
        await Promise.resolve();  // flush the streamer

        assert.isTrue(manager.access.canAccessVehicle(gunther, databaseVehicle));
        assert.isFalse(manager.access.canAccessVehicle(russell, databaseVehicle));
    });

    it('should limit ephemeral vehicles to a single one for players', assert => {
        assert.equal(manager.getVehicleLimitForPlayer(gunther), 1);

        const firstVehicle = manager.createVehicle({
            player: gunther,

            modelId: 411 /* Infernus */,
            position: gunther.position,
            rotation: 90,
            interiorId: gunther.interiorId,
            virtualWorld: gunther.virtualWorld
        });

        assert.isNotNull(firstVehicle);
        assert.isTrue(firstVehicle.isConnected());
        assert.equal(firstVehicle.numberPlate, gunther.name);

        const secondVehicle = manager.createVehicle({
            player: gunther,

            modelId: 520 /* Hydra */,
            position: gunther.position,
            rotation: 90,
            interiorId: gunther.interiorId,
            virtualWorld: gunther.virtualWorld
        });

        assert.isNotNull(secondVehicle);
        assert.isTrue(secondVehicle.isConnected());

        // The Infernus should now have been destroyed.
        assert.isFalse(firstVehicle.isConnected());
    });

    it('should limit the ephemeral vehicles to five for administrators', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.level = Player.LEVEL_ADMINISTRATOR;
        russell.level = Player.LEVEL_PLAYER;

        assert.equal(manager.getVehicleLimitForPlayer(gunther), 5);
        assert.equal(manager.getVehicleLimitForPlayer(russell), 1);

        const vehicles = [];
        for (let i = 0; i < manager.getVehicleLimitForPlayer(gunther); ++i) {
            vehicles.push(manager.createVehicle({
                player: gunther,

                modelId: 411 /* Infernus */,
                position: gunther.position,
                rotation: 90,
                interiorId: gunther.interiorId,
                virtualWorld: gunther.virtualWorld
            }));
        }

        // Create a vehicle for |russell| that should be left alone.
        const russellVehicle = manager.createVehicle({
            player: russell,

            modelId: 520 /* Hydra */,
            position: russell.position,
            rotation: 270,
            interiorId: russell.interiorId,
            virtualWorld: russell.virtualWorld

        });

        vehicles.forEach(vehicle =>
            assert.isTrue(vehicle.isConnected()));

        assert.isTrue(russellVehicle.isConnected());

        // Make |gunther| enter the oldest vehicle, so that it'll be ignored for pruning.
        gunther.enterVehicle(vehicles[0], Vehicle.SEAT_DRIVER);

        const newVehicle = manager.createVehicle({
            player: gunther,

            modelId: 520 /* Hydra */,
            position: gunther.position,
            rotation: 90,
            interiorId: gunther.interiorId,
            virtualWorld: gunther.virtualWorld
        });

        assert.isTrue(vehicles[0].isConnected());
        assert.equal(gunther.vehicle, vehicles[0]);

        // The second vehicle should have been removed.
        assert.isFalse(vehicles[1].isConnected());

        // Russell's vehicle should've been left alone.
        assert.isTrue(russellVehicle.isConnected());
    });

    it('should delete ephemeral vehicles on respawn', async(assert) => {
        const vehicle = manager.createVehicle({
            player: gunther,

            modelId: 411 /* Infernus */,
            position: gunther.position,
            rotation: 90,
            interiorId: gunther.interiorId,
            virtualWorld: gunther.virtualWorld
        });

        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        gunther.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);
        assert.equal(gunther.vehicle, vehicle);

        gunther.leaveVehicle(vehicle);
        assert.isNull(gunther.vehicle);

        await server.clock.advance(180 * 1000);  // 3 minutes, the respawn duration
        await Promise.resolve();  // flush the streamer

        assert.isFalse(vehicle.isConnected());
    });

    it('should recreate vehicles when the streamer reloads', async assert => {
        const originalStreamerSize = vehicleStreamer.size;

        assert.isTrue(server.featureManager.isEligibleForLiveReload('streamer'));
        assert.isTrue(await server.featureManager.liveReload('streamer'));

        const streamer = server.featureManager.loadFeature('streamer');
        assert.notEqual(streamer.getVehicleStreamer(), vehicleStreamer);
        assert.equal(streamer.getVehicleStreamer().size, originalStreamerSize);
    });
});
