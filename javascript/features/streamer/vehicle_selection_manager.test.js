// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';

// Model Id for the Infernus vehicle in GTA: San Andreas.
const kInfernus = 411;

describe('VehicleSelectionManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let registry = null;
    let settings = null;

    let kSelectionIntervalMs = 0;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('streamer');
        settings = server.featureManager.loadFeature('settings');

        kSelectionIntervalMs = settings.getValue('vehicles/streamer_interval_ms');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.selectionManager_;
        registry = feature.registry_;

        feature.streamer_.setPlayersForTesting([ gunther ]);
    });
    
    // Creates a vehicle of the given |modelId| at the |x|, |y|, |z| position.
    function createVehicle(modelId, x, y, z) {
        const vehicleInfo = new StreamableVehicleInfo({
            modelId,

            position: new Vector(x, y, z),
            rotation: 180,

            respawnDelay: 180,
        });

        return registry.createVehicle(vehicleInfo);
    }

    it('should be able to stream in the vehicles closest to Gunther', async (assert) => {
        assert.equal(server.vehicleManager.count, 0);

        const vehicles = [
            createVehicle(kInfernus, 10, 10, 0),
            createVehicle(kInfernus, -10, -10, 0),
            createVehicle(kInfernus, 0, 0, 0),
            createVehicle(kInfernus, 3000, 3000, 0),
        ];

        assert.equal(server.vehicleManager.count, 0);
        assert.isNull(vehicles[0].live);

        const selectPromise = manager.select();

        await server.clock.advance(kSelectionIntervalMs);

        assert.equal(server.vehicleManager.count, 3);
        assert.isNotNull(vehicles[0].live);

        // Move |gunther| to somewhere near the far away vehicle.
        gunther.position = new Vector(2950, 2950, 0);

        await server.clock.advance(kSelectionIntervalMs);

        // The (now far away) vehicles should have moved to the cached list.
        assert.equal(server.vehicleManager.count, 4);
        assert.isNotNull(vehicles[0].live);

        // It should still be possible to immediately delete vehicles.
        manager.requestDeleteVehicle(vehicles[0]);

        assert.equal(server.vehicleManager.count, 3);
        assert.isNull(vehicles[0].live);

        // Predispose of the manager, 
        manager.disposed_ = true;

        await Promise.all([
            server.clock.advance(kSelectionIntervalMs),
            selectPromise
        ]);
    });

    it('should be able to create vehicles with specified components', async (assert) => {
        assert.equal(server.vehicleManager.count, 0);

        const vehicleInfo = new StreamableVehicleInfo({
            modelId: 411,  // Infernus

            position: new Vector(0, 0, 0),
            rotation: 180,
            components: [
                1010,  // 10x Nitro
                1097,  // Virtual Wheels
                1185,  // Slamin Front Bumper - invalid for Infernus!
            ],

            respawnDelay: 180,
        });

        assert.equal(vehicleInfo.components.length, 2);
        assert.deepEqual(vehicleInfo.components, [ 1010, 1097 ]);

        const streamableVehicle = registry.createVehicle(vehicleInfo);

        assert.equal(server.vehicleManager.count, 0);
        assert.isNull(streamableVehicle.live);

        // Request immediate creation of the vehicle.
        manager.requestCreateVehicle(streamableVehicle);

        assert.equal(server.vehicleManager.count, 1);
        assert.isNotNull(streamableVehicle.live);

        const vehicle = streamableVehicle.live;

        assert.equal(vehicle.getComponents().length, 2);
        assert.isTrue(vehicle.hasComponent(1010));
        assert.isTrue(vehicle.hasComponent(1097));

        vehicle.addComponent(1096 /* Ahab Wheels */);

        assert.equal(vehicle.getComponents().length, 2);
        assert.isTrue(vehicle.hasComponent(1010));
        assert.isTrue(vehicle.hasComponent(1096));  // <-- Ahab Wheels

        // Respawn the vehicle. This should reset its customization state back to default.
        vehicle.respawn();

        assert.equal(vehicle.getComponents().length, 2);
        assert.isTrue(vehicle.hasComponent(1010));
        assert.isTrue(vehicle.hasComponent(1097));  // <-- Virtual Wheels
    });

    it('should try to keep the maximum number of vehicles alive', async (assert) => {
        manager.maxVisible_ = 10;

        assert.equal(server.vehicleManager.count, 0);

        // Create ten vehicles near [0, 0], and five vehicles near [3000, 3000], to create two
        // clusters that should stream independently from each other.
        const vehicles = [];

        for (let nearVehicleIndex = 0; nearVehicleIndex < 10; ++nearVehicleIndex)
            vehicles.push(createVehicle(kInfernus, 0, 0, 0));
        
        for (let farVehicleIndex = 0; farVehicleIndex < 5; ++farVehicleIndex)
            vehicles.push(createVehicle(kInfernus, 3000, 3000, 0));

        const selectPromise = manager.select();
        
        await server.clock.advance(kSelectionIntervalMs);

        assert.equal(server.vehicleManager.count, 10);

        assert.equal(manager.vehicles_.size, 10);
        assert.equal(manager.vehicleCache_.size, 0);

        let nearLive, farLive;

        // The first ten vehicles should be live, none of the far vehicles should be live.
        nearLive = vehicles.slice(0, 10).filter(streamableVehicle => !!streamableVehicle.live);
        farLive = vehicles.slice(10).filter(streamableVehicle => !!streamableVehicle.live);

        assert.equal(nearLive.length, 10);
        assert.equal(farLive.length, 0);

        // Move Gunther to the far away position, and try this again.
        gunther.position = new Vector(2950, 2950, 0);

        await server.clock.advance(kSelectionIntervalMs);

        assert.equal(server.vehicleManager.count, 10);

        assert.equal(manager.vehicles_.size, 5);
        assert.equal(manager.vehicleCache_.size, 5);

        // All far vehicles should be live, but only five of the near vehicles (which are now in
        // the cached array). Verify this.
        nearLive = vehicles.slice(0, 10).filter(streamableVehicle => !!streamableVehicle.live);
        farLive = vehicles.slice(10).filter(streamableVehicle => !!streamableVehicle.live);

        assert.equal(nearLive.length, 5);
        assert.equal(farLive.length, 5);

        // Move Gunther back to the original position. This should swap over the vehicles again.
        gunther.position = new Vector(0, 0, 0);

        await server.clock.advance(kSelectionIntervalMs);

        assert.equal(server.vehicleManager.count, 10);

        assert.equal(manager.vehicles_.size, 10);
        assert.equal(manager.vehicleCache_.size, 0);

        // And verify that all the far vehicles have been removed.
        nearLive = vehicles.slice(0, 10).filter(streamableVehicle => !!streamableVehicle.live);
        farLive = vehicles.slice(10).filter(streamableVehicle => !!streamableVehicle.live);

        assert.equal(nearLive.length, 10);
        assert.equal(farLive.length, 0);

        // Predispose of the manager, 
        manager.disposed_ = true;

        await Promise.all([
            server.clock.advance(kSelectionIntervalMs),
            selectPromise
        ]);
    });
});
