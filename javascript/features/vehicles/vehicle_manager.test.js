// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Streamer = require('features/streamer/streamer.js');
const Vehicles = require('features/vehicles/vehicles.js');

describe('VehicleManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let vehicleStreamer = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);

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

        gunther.position = new Vector(6000, 6000, 6000);
        const vehicle = manager.createVehicle({
            modelId: 520 /* Hydra */,
            position: new Vector(6000, 6000, 6000),
            rotation: 90,
            interiorId: 0,
            virtualWorld: 0
        });

        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.equal(vehicle.modelId, 520 /* Hydra */);
        assert.deepEqual(vehicle.position, new Vector(6000, 6000, 6000));
        assert.equal(vehicle.rotation, 90);
        assert.equal(vehicle.interiorId, 0);
        assert.equal(vehicle.virtualWorld, 0);
    });

    it('should be able to tell whether it manages a vehicle', assert => {
        gunther.position = new Vector(6000, 6000, 6000);
        const managedVehicle = manager.createVehicle({
            modelId: 520 /* Hydra */,
            position: new Vector(6000, 6000, 6000),
            rotation: 90,
            interiorId: 0,
            virtualWorld: 0
        });

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
        gunther.position = new Vector(6000, 6000, 6000);
        const managedVehicle = manager.createVehicle({
            modelId: 520 /* Hydra */,
            position: new Vector(6000, 6000, 6000),
            rotation: 90,
            interiorId: 0,
            virtualWorld: 0
        });

        assert.isTrue(managedVehicle.isConnected());
        assert.isTrue(manager.isManagedVehicle(managedVehicle));

        const originalVehicleCount = server.vehicleManager.count;

        await manager.deleteVehicle(managedVehicle);

        assert.isFalse(managedVehicle.isConnected());
        assert.isFalse(manager.isManagedVehicle(managedVehicle));

        assert.equal(server.vehicleManager.count, originalVehicleCount - 1);
    });
});
