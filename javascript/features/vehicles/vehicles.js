// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const Vector = require('base/vector.js');

// Walking around in Grand Theft Auto shows vehicles everywhere around you, it's never hard to find
// one. Traditionally, due to a limit of two thousand vehicles, this has not been the same in online
// games. The Vehicles feature implements management commands and a vehicle streaming mechanism that
// set of to reproduce this same feeling.
class Vehicles extends Feature {
    constructor() {
        super();

        provideNative('CreateVehicleJS', 'iffffiiii',
                (modelId, x, y, z, angle, primaryColor, secondaryColor, respawnDelay, siren) => {
            const vehicle = server.vehicleManager.createVehicle({
                modelId: modelId,
                position: new Vector(x, y, z),
                rotation: angle,
                primaryColor: primaryColor,
                secondaryColor: secondaryColor,
                respawnDelay: respawnDelay,
                siren: !!siren
            });

            return vehicle.id;
        });

        provideNative('DestroyVehicleJS', 'i', vehicleId => {
            const vehicle = server.vehicleManager.getById(vehicleId);
            if (vehicle)
                vehicle.dispose();
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the vehicles feature.
    // ---------------------------------------------------------------------------------------------

    // TODO(Russell): Define the public API of the vehicles class.

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = Vehicles;
