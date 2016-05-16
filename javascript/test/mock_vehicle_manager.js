// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const VehicleManager = require('entities/vehicle_manager.js');

// Mocked vehicle manager that provides the same functionality as the real vehicle manager, while
// not actually creating and interacting with vehicles on the SA-MP server.
class MockVehicleManager extends VehicleManager {
    constructor() {
        super();

        // Dispose the callbacks- the mock does not have to listen to global events.
        this.callbacks_.dispose();
    }
}

exports = MockVehicleManager;
