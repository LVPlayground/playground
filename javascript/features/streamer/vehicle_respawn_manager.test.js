// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';
import { VehicleRespawnManager } from 'features/streamer/vehicle_respawn_manager.js';

describe('VehicleRespawnManager', (it, beforeEach) => {
    let gunther = null;
    let respawnManager = null;
    let selectionManager = null;
    let settings = null;
    
    beforeEach(() => {
        const feature = server.featureManager.loadFeature('streamer');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        selectionManager = feature.selectionManager_;
        respawnManager = selectionManager.respawnManager_;
        settings = server.featureManager.loadFeature('settings');
    });

    it('should keep vehicles in the queue for the configured amount of time', async (assert) => {
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

        assert.isFalse(respawnManager.has(ephemeralVehicle));
        assert.isFalse(respawnManager.has(persistentVehicle));

        respawnManager.add(ephemeralVehicle);
        respawnManager.add(persistentVehicle);

        assert.isTrue(respawnManager.has(ephemeralVehicle));
        assert.isTrue(respawnManager.has(persistentVehicle));

        // Get the vehicles to respawn. This is what updates the queue. It's too early however, so
        // we don't expect the vehicle to leave the queue just yet.
        {
            const vehicles = respawnManager.getVehiclesToRespawn();
            assert.equal(vehicles.size, 0);
        }

        assert.isTrue(respawnManager.has(ephemeralVehicle));

        await server.clock.advance(respawnManager.ephemeralVehicleRespawnDelay * 1000);

        assert.isTrue(respawnManager.has(ephemeralVehicle));

        // Getting the vehicles to respawn again should now list the |vehicle| as part of it.
        {
            const vehicles = respawnManager.getVehiclesToRespawn();
            assert.equal(vehicles.size, 1);
            assert.equal([ ...vehicles ][0], ephemeralVehicle);
        }

        assert.isFalse(respawnManager.has(ephemeralVehicle));
        assert.isTrue(respawnManager.has(persistentVehicle));

        // Now wait for the full ten minutes to expire, after which the |persistentVehicle| should
        // be set to respawn on the server as well.
        await server.clock.advance((600 - respawnManager.ephemeralVehicleRespawnDelay) * 1000);

        assert.isTrue(respawnManager.has(persistentVehicle));

        // Getting the vehicles to respawn again should now list the |persistentVehicle|.
        {
            const vehicles = respawnManager.getVehiclesToRespawn();
            assert.equal(vehicles.size, 1);
            assert.equal([ ...vehicles ][0], persistentVehicle);
        }

        assert.isFalse(respawnManager.has(ephemeralVehicle));
        assert.isFalse(respawnManager.has(persistentVehicle));
    });

    it('should not respawn vehicles occupied by players', async (assert) => {
        const streamableVehicle = new StreamableVehicle(new StreamableVehicleInfo({
            modelId: 411,  // Infernus

            position: new Vector(0, 0, 0),
            rotation: 0,
        }));
        
        assert.equal(server.vehicleManager.count, 0);
        assert.isFalse(respawnManager.has(streamableVehicle));
        assert.isNull(streamableVehicle.live);

        // Request the |streamableVehicle| to be created. This should create the entry for it in
        // the RespawnManager as well, mimicing an immediate vehicle request.
        selectionManager.requestCreateVehicle(streamableVehicle);

        assert.equal(server.vehicleManager.count, 1);
        assert.isTrue(respawnManager.has(streamableVehicle));
        assert.isNotNull(streamableVehicle.live);

        // (1) Vehicles will not be respawned when a player is in them.
        gunther.enterVehicle(streamableVehicle.live);

        for (let iteration = 0; iteration < 3; ++iteration) {
            await server.clock.advance(respawnManager.ephemeralVehicleRespawnDelay * 1000);

            assert.equal(respawnManager.getVehiclesToRespawn().size, 0);
            assert.isTrue(respawnManager.has(streamableVehicle));
        }

        // (2) Leaving a vehicle as the last occupant will reset usage time.
        await server.clock.advance(respawnManager.ephemeralVehicleRespawnDelay * 500);

        // Update Gunther's position, which will respawn them.
        gunther.position = gunther.position;

        // This certainly shouldn't have an immediate effect..
        assert.equal(respawnManager.getVehiclesToRespawn().size, 0);
        assert.isTrue(respawnManager.has(streamableVehicle));

        await server.clock.advance(respawnManager.ephemeralVehicleRespawnDelay * 500);

        // Neither should it have an effect exactly the respawn delay after the last check.
        assert.equal(respawnManager.getVehiclesToRespawn().size, 0);
        assert.isTrue(respawnManager.has(streamableVehicle));

        await server.clock.advance(respawnManager.ephemeralVehicleRespawnDelay * 500);

        // But it should have an effect exactly the respawn delay *after* leaving the vehicle.
        assert.equal(respawnManager.getVehiclesToRespawn().size, 1);
        assert.isFalse(respawnManager.has(streamableVehicle));
    });

    it('should be able to schedule respawns after a vehicle death', async (assert) => {
        settings.setValue('vehicles/respawn_death_delay_sec', 45);

        // This test assumes that the after-death delay is lower than the regular delay.
        assert.isAbove(
            settings.getValue('vehicles/respawn_ephemeral_delay_sec'),
            settings.getValue('vehicles/respawn_death_delay_sec'));

        const streamableVehicle = new StreamableVehicle(new StreamableVehicleInfo({
            modelId: 411,  // Infernus

            position: new Vector(0, 0, 0),
            rotation: 0,
        }));

        assert.isNull(streamableVehicle.live);
        selectionManager.requestCreateVehicle(streamableVehicle);
        assert.isNotNull(streamableVehicle.live);

        // Fake the |streamableVehicle|'s death. This is a signal that should reach the manager.
        streamableVehicle.live.death();

        await server.clock.advance(45000);  // respawn_death_delay_sec

        assert.equal(respawnManager.getVehiclesToRespawn().size, 1);
        assert.isFalse(respawnManager.has(streamableVehicle));
    });
});
