// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Streamer = require('features/streamer/streamer.js');
const Vehicles = require('features/vehicles/vehicles.js');

describe('VehicleManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let vehicleStreamer = null;

    // The position at which the test vehicle should be created.
    const POSITION = new Vector(6000, 6000, 6000);

    // Settings required to create a Hydra with the VehicleManager.
    const HYDRA = {
        modelId: 520 /* Hydra */,
        position: POSITION,
        rotation: 90,
        interiorId: 0,
        virtualWorld: 0
    };

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = POSITION;

        server.featureManager.registerFeaturesForTests({
            streamer: Streamer,
            vehicles: Vehicles
        });

        const vehicles = server.featureManager.loadFeature('vehicles');

        manager = vehicles.manager_;
        await manager.ready;

        vehicleStreamer = server.featureManager.loadFeature('streamer').getVehicleStreamer();
    });

    it('should load vehicle data from the database by default', async(assert) => {
        assert.isAbove(manager.count, 0);

        const vehicles = [...manager.vehicles];
        assert.equal(vehicles.length, manager.count);

        const originalVehicleCount = server.vehicleManager.count;

        // Stream the vehicles. The vehicle closest to |gunther| should be created.
        gunther.position = vehicles[0].position.translate({ z: 2 });
        await vehicleStreamer.stream();

        assert.equal(server.vehicleManager.count, originalVehicleCount + 1);

        // Dispose of the VehicleManager. All created vehicles should be removed.
        manager.dispose();
        manager.dispose = () => true;

        assert.equal(server.vehicleManager.count, originalVehicleCount);
    });

    it('should automatically stream created vehicles in', assert => {
        gunther.position = new Vector(0, 0, 0);
        assert.isNull(manager.createVehicle({
            modelId: 412 /* Infernus */,
            position: new Vector(3000, 3000, 3000),
            rotation: 180,
            interiorId: 0,
            virtualWorld: 0
        }));

        gunther.position = POSITION;
        const vehicle = manager.createVehicle(HYDRA);

        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.equal(vehicle.modelId, 520 /* Hydra */);
        assert.deepEqual(vehicle.position, POSITION);
        assert.equal(vehicle.rotation, 90);
        assert.equal(vehicle.interiorId, 0);
        assert.equal(vehicle.virtualWorld, 0);
    });

    it('should be able to tell whether it manages a vehicle', assert => {
        const managedVehicle = manager.createVehicle(HYDRA);

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
        const managedVehicle = manager.createVehicle(HYDRA);
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

        const managedVehicle = manager.internalGetLiveVehicle(managedDatabaseVehicle);
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
        // TODO: Implement this test.
    });

    it('should be able to delete vehicles from the game', async(assert) => {
        const managedVehicle = manager.createVehicle(HYDRA);

        assert.isTrue(managedVehicle.isConnected());
        assert.isTrue(manager.isManagedVehicle(managedVehicle));

        const originalVehicleCount = server.vehicleManager.count;

        await manager.deleteVehicle(managedVehicle);

        assert.isFalse(managedVehicle.isConnected());
        assert.isFalse(manager.isManagedVehicle(managedVehicle));

        assert.equal(server.vehicleManager.count, originalVehicleCount - 1);
    });
});
