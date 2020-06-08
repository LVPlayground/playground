// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';
import { VehicleRespawnManager } from 'features/streamer/vehicle_respawn_manager.js';

describe('VehicleRespawnManager', it => {
    it('should keep vehicles in the queue for the configured amount of time', async (assert) => {
        const settings = server.featureManager.loadFeature('settings');
        const manager = new VehicleRespawnManager(() => settings);

        // Create an ephemeral vehicle, which will respawn after a configured amount of time.
        const ephemeralVehicle = new StreamableVehicle(new StreamableVehicleInfo({
            modelId: 411,  // Infernus

            position: new Vector(0, 0, 0),
            rotation: 0,
        }));

        // Create a persistent vehicle, which will respawn after a set amount of time.
        const persistentVehicle = new StreamableVehicle(new StreamableVehicleInfo({
            modelId: 411,  // Infernus

            position: new Vector(0, 0, 0),
            rotation: 0,

            respawnDelay: 600,  // ten minutes
        }));

        assert.isFalse(manager.has(ephemeralVehicle));
        assert.isFalse(manager.has(persistentVehicle));

        manager.add(ephemeralVehicle);
        manager.add(persistentVehicle);

        assert.isTrue(manager.has(ephemeralVehicle));
        assert.isTrue(manager.has(persistentVehicle));

        // Get the vehicles to respawn. This is what updates the queue. It's too early however, so
        // we don't expect the vehicle to leave the queue just yet.
        {
            const vehicles = manager.getVehiclesToRespawn();
            assert.equal(vehicles.size, 0);
        }

        assert.isTrue(manager.has(ephemeralVehicle));

        await server.clock.advance(manager.ephemeralVehicleRespawnDelay * 1000);

        assert.isTrue(manager.has(ephemeralVehicle));

        // Getting the vehicles to respawn again should now list the |vehicle| as part of it.
        {
            const vehicles = manager.getVehiclesToRespawn();
            assert.equal(vehicles.size, 1);
            assert.equal([ ...vehicles ][0], ephemeralVehicle);
        }

        assert.isFalse(manager.has(ephemeralVehicle));
        assert.isTrue(manager.has(persistentVehicle));

        // Now wait for the full ten minutes to expire, after which the |persistentVehicle| should
        // be set to respawn on the server as well.
        await server.clock.advance((600 - manager.ephemeralVehicleRespawnDelay) * 1000);

        assert.isTrue(manager.has(persistentVehicle));

        // Getting the vehicles to respawn again should now list the |persistentVehicle|.
        {
            const vehicles = manager.getVehiclesToRespawn();
            assert.equal(vehicles.size, 1);
            assert.equal([ ...vehicles ][0], persistentVehicle);
        }

        assert.isFalse(manager.has(ephemeralVehicle));
        assert.isFalse(manager.has(persistentVehicle));

        // Dispose of the |manager| to clean up our work.
        manager.dispose();
    });
});
