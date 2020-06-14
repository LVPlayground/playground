// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Vehicles from 'features/vehicles/vehicles.js';
import { kVehicleDecorations } from 'features/vehicles/vehicle_decorations.js';
import { Vector } from 'base/vector.js';

describe('VehicleDecorations', it => {
    const POSITION = new Vector(6000, 6000, 6000);

    // Settings required to create a Hydra with the VehicleManager.
    const DFT = {
        modelId: 578 /* DFT */,
        position: POSITION,
        rotation: 90,
        interiorId: 0,
        virtualWorld: 0
    };

    it('is able to load all the vehicle decorations defined for the server', assert => {
        const settings = server.featureManager.loadFeature('settings');
        const objects = server.objectManager.count;
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = POSITION;
        gunther.vehicleSeat = Vehicle.kSeatDriver;

        server.featureManager.registerFeaturesForTests({
            vehicles: Vehicles
        });

        // If this throws, then pay attention to the JavaScript error that's been shown in the
        // console. It should tell you which decoration file has issues.
        const vehicles = server.featureManager.loadFeature('vehicles');

        // Enable all decoration sets, to exercise all of the used code paths.
        for (const { setting } of kVehicleDecorations)
            settings.setValue(setting, true);

        var vehicle = server.vehicleManager.createVehicle(DFT);
        vehicles.decorations_.onPlayerEnterVehicle(gunther, vehicle);

        assert.isAbove(server.objectManager.count, objects);

        // Disable all decoration sets, which will bring the count back to zero.
        for (const { setting } of kVehicleDecorations)
            settings.setValue(setting, false);

        assert.equal(server.objectManager.count, objects);
    });
});
