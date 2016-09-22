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
});
