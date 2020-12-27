// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PersistentVehicleInfo } from 'features/vehicles/persistent_vehicle_info.js';

// Mocked implementation of the VehicleDatabase class that does not actually interact with the
// database. Will be used instead of the real class in tests.
class MockVehicleDatabase {
    constructor() {
        this.latestVehicleId_ = 1000;
    }

    async loadVehicles() {
        return [
            new PersistentVehicleInfo({
                vehicleId: 42,

                modelId: 412 /* Infernus */,

                position: new Vector(500, 1000, 1500),
                rotation: 90,

                primaryColor: 6,
                secondaryColor: 9,
                numberPlate: null,
                components: [],
            }),
        ];
    }

    async createVehicle(vehicleSettings) {
        return new PersistentVehicleInfo(vehicleSettings, {
            vehicleId: this.latestVehicleId_++,
        });
    }

    async updateVehicle(vehicleSettings, persistentVehicleInfo) {
        return new PersistentVehicleInfo(persistentVehicleInfo, vehicleSettings);
    }

    async updateVehicleAccess(databaseVehicle) {}

    async deleteVehicle(databaseVehicle) {}
}

export default MockVehicleDatabase;
