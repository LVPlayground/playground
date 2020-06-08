// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';

// Model Id for the Infernus vehicle in GTA: San Andreas.
const kInfernus = 411;

describe('VehicleSelectionManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let registry = null;

    let kSelectionIntervalMs = 0;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('streamer');
        const settings = server.featureManager.loadFeature('settings');

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

        // Move gunther to somewhere far away.
        gunther.position = new Vector(-3000, -3000, 0);

        await server.clock.advance(kSelectionIntervalMs);

        assert.equal(server.vehicleManager.count, 0);
        assert.isNull(vehicles[0].live);

        // Predispose of the manager, 
        manager.disposed_ = true;

        await Promise.all([
            server.clock.advance(kSelectionIntervalMs),
            selectPromise
        ]);
    });

    it('should automatically respawn vehicles after a certain period of time', async (assert) => {
        // (1) Respawning ephemeral vehicles should delete them.
        // (2) Respawning persistent vehicles should keep them.
    });

    it('should not delete vehicles when they are known to the respawn manager', async (assert) => {
        // (1) This is the case when requesting creation of a vehicle.
        // (2) This is the case when a vehicle has been used by a player.
    });
});
