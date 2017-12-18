// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked implementation of the VehicleDatabase class that does not actually interact with the
// database. Will be used instead of the real class in tests.
class MockVehicleDatabase {
    constructor() {
        this.latestVehicleId_ = 1000;
    }

    async loadVehicles() {
        return [
            {
                databaseId: 42,

                accessType: 'everyone',
                accessValue: 0,

                modelId: 412 /* Infernus */,
                position: new Vector(500, 1000, 1500),
                rotation: 90,

                interiorId: 0,
                virtualWorld: 0 /* main world */,

                primaryColor: 6,
                secondaryColor: 9,
                paintjob: 0
            }
        ];
    }

    async createVehicle(databaseVehicle) {
        databaseVehicle.databaseId = this.latestVehicleId_++;
    }

    async updateVehicle(databaseVehicle) {}

    async updateVehicleAccess(databaseVehicle) {}

    async deleteVehicle(databaseVehicle) {}
}

export default MockVehicleDatabase;
