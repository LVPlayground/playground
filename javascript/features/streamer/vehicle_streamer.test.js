// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredVehicle = require('features/streamer/stored_vehicle.js');
const VehicleStreamer = require('features/streamer/vehicle_streamer.js');

describe('VehicleStreamer', it => {
    it('should create the appropriate vehicle on the server', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const originalVehicleCount = server.vehicleManager.count;

        const streamer = new VehicleStreamer();
        const storedVehicle = new StoredVehicle({
            modelId: 520 /* Hydra */,
            position: new Vector(1000, 1500, 2000),
            rotation: 270,
            interiorId: 0,
            virtualWorld: 0,
            primaryColor: 7,
            secondaryColor: 8,
            paintjob: 2,
            siren: true,
            respawnDelay: -1
        });

        assert.doesNotThrow(() => streamer.add(storedVehicle));
        assert.isNull(streamer.getVehicleForTesting(storedVehicle));

        gunther.position = new Vector(1010, 1490, 2000);
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
});
