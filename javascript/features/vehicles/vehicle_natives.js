// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides the native functions to Pawn allowing it to interact with the JavaScript-based
// vehicle system, for instance to detect whether a vehicle is persistent.
class VehicleNatives {
    constructor(manager) {
        this.manager_ = manager;

        provideNative(
            'IsPersistentVehicle', 'i', VehicleNatives.prototype.isPersistentVehicle.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // native IsPersistentVehicle(vehicleId);
    isPersistentVehicle(vehicleId) {
        const vehicle = server.vehicleManager.getById(vehicleId);
        if (vehicle)
            return this.manager_.isPersistentVehicle(vehicle) ? 1 : 0;

        return 0;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('IsPersistentVehicle', 'i', vehicleId => 0 /* no */);
    }
}

export default VehicleNatives;
