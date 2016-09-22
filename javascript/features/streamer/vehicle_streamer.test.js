// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredVehicle = require('features/streamer/stored_vehicle.js');
const VehicleStreamer = require('features/streamer/vehicle_streamer.js');

describe('VehicleStreamer', it => {
    // Creates a StoredVehicle with a random position.
    function createStoredVehicle({ respawnDelay = -1 } = {}) {
        return new StoredVehicle({
            modelId: 520 /* Hydra */,
            position: new Vector(Math.floor(Math.random() * 3000) + 3000,
                                 Math.floor(Math.random() * 3000) + 3000,
                                 Math.floor(Math.random() * 30) - 10),
            rotation: 270,
            interiorId: 0,
            virtualWorld: 0,
            primaryColor: 7,
            secondaryColor: 8,
            paintjob: 2,
            siren: true,
            respawnDelay: respawnDelay
        });
    }

    it('should create the appropriate vehicle on the server', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const originalVehicleCount = server.vehicleManager.count;

        const streamer = new VehicleStreamer();
        const storedVehicle = createStoredVehicle();

        assert.doesNotThrow(() => streamer.add(storedVehicle));
        assert.isNull(streamer.getVehicleForTesting(storedVehicle));

        gunther.position = storedVehicle.position.translate({ z: 2 });
        await streamer.stream();

        assert.equal(server.vehicleManager.count, originalVehicleCount + 1);

        const vehicle = streamer.getVehicleForTesting(storedVehicle);
        assert.isNotNull(vehicle);

        assert.isTrue(vehicle.isConnected());

        assert.equal(vehicle.modelId, storedVehicle.modelId);
        assert.equal(vehicle.position, storedVehicle.position);
        assert.equal(vehicle.rotation, storedVehicle.rotation);
        assert.equal(vehicle.interiorId, storedVehicle.interiorId);
        assert.equal(vehicle.virtualWorld, storedVehicle.virtualWorld);
        assert.equal(vehicle.primaryColor, storedVehicle.primaryColor);
        assert.equal(vehicle.secondaryColor, storedVehicle.secondaryColor);
        assert.equal(vehicle.paintjob, storedVehicle.paintjob);
        assert.equal(vehicle.siren, storedVehicle.siren);
        assert.equal(vehicle.respawnDelay, storedVehicle.respawnDelay);

        streamer.dispose();

        assert.equal(server.vehicleManager.count, originalVehicleCount);
        assert.isFalse(vehicle.isConnected());
    });

    it('should respawn a vehicle after it has been destroyed', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const streamer = new VehicleStreamer();
        const storedVehicle = createStoredVehicle({ respawnDelay: 40 });

        assert.doesNotThrow(() => streamer.add(storedVehicle));
        assert.equal(streamer.size, 1);

        gunther.position = storedVehicle.position.translate({ z: 2 });
        await streamer.stream();

        const vehicle = streamer.getVehicleForTesting(storedVehicle);
        assert.isNotNull(vehicle);

        vehicle.position = new Vector(1000, 1500, 2000);
        vehicle.death();

        assert.deepEqual(vehicle.position, new Vector(1000, 1500, 2000));
        assert.equal(vehicle.respawnCount, 0);

        await server.clock.advance(10 * 1000);  // 10 seconds, a fourth of the respawn delay

        assert.deepEqual(vehicle.position, storedVehicle.position);
        assert.equal(vehicle.respawnCount, 1);
    });

    it('should respawn a vehicle after the last player leaves', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const streamer = new VehicleStreamer();
        const storedVehicle = createStoredVehicle({ respawnDelay: 40 });

        assert.doesNotThrow(() => streamer.add(storedVehicle));
        assert.equal(streamer.size, 1);

        gunther.position = storedVehicle.position.translate({ z: 2 });
        await streamer.stream();

        const vehicle = streamer.getVehicleForTesting(storedVehicle);
        assert.isNotNull(vehicle);

        vehicle.position = new Vector(1000, 1500, 2000);
        
        // (1) Have both Gunther and Russell enter the vehicle.
        gunther.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);
        russell.enterVehicle(vehicle, Vehicle.SEAT_PASSENGER);

        assert.equal(gunther.vehicle, vehicle);
        assert.equal(russell.vehicle, vehicle);

        assert.equal(vehicle.driver, gunther);

        await server.clock.advance(40 * 1000);  // 40 seconds, the respawn delay

        assert.deepEqual(vehicle.position, new Vector(1000, 1500, 2000));
        assert.equal(vehicle.respawnCount, 0);

        // (2) Have Gunther leave the vehicle as its driver.
        gunther.leaveVehicle();

        assert.isNull(gunther.vehicle);
        assert.equal(russell.vehicle, vehicle);

        assert.isNull(vehicle.driver);

        await server.clock.advance(40 * 1000);  // 40 seconds, the respawn delay

        assert.deepEqual(vehicle.position, new Vector(1000, 1500, 2000));
        assert.equal(vehicle.respawnCount, 0);

        // (3) Have Russell leave the vehicle as its passenger.
        russell.leaveVehicle();

        assert.isNull(gunther.vehicle);
        assert.isNull(russell.vehicle);

        assert.isNull(vehicle.driver);

        await server.clock.advance(38 * 1000);  // 38 seconds, just less than the respawn delay

        assert.deepEqual(vehicle.position, new Vector(1000, 1500, 2000));
        assert.equal(vehicle.respawnCount, 0);

        // (4) Have Gunther enter the vehicle again, as the driver.
        gunther.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);

        assert.equal(gunther.vehicle, vehicle);
        assert.isNull(russell.vehicle);

        assert.equal(vehicle.driver, gunther);

        await server.clock.advance(40 * 1000);  // 40 seconds, the respawn delay

        assert.deepEqual(vehicle.position, new Vector(1000, 1500, 2000));
        assert.equal(vehicle.respawnCount, 0);

        // (5) Have Gunther leave the vehicle again, as the driver.
        gunther.leaveVehicle();

        assert.isNull(gunther.vehicle);
        assert.isNull(russell.vehicle);

        assert.isNull(vehicle.driver);

        await server.clock.advance(40 * 1000);  // 40 seconds, the respawn delay

        assert.deepEqual(vehicle.position, storedVehicle.position);
        assert.equal(vehicle.respawnCount, 1);
    });
});
