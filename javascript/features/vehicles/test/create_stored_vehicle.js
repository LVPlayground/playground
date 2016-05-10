// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockVehicle = require('test/mock_vehicle.js');
const StoredVehicle = require('features/vehicles/stored_vehicle.js');

// Creates a new StoredVehicle instance based on the |options|. Reasonable defaults will be
// applied if no options are provided to this function.
function createStoredVehicle(options = {}) {
    return new StoredVehicle({
        vehicle_id: options.vehicleId || Math.floor(Math.random() * 1000000),
        persistent: options.persistent || false,
        model_id: options.modelId || 411,
        position_x: options.positionX || Math.floor(Math.random() * 6000) - 3000,
        position_y: options.positionY || Math.floor(Math.random() * 6000) - 3000,
        position_z: options.positionZ || Math.floor(Math.random() * 20),
        rotation: options.rotation || Math.floor(Math.random() * 360),
        primary_color: options.primaryColor || 0,
        secondary_color: options.secondaryColor || 0,
        paintjob: options.paintjob || 0,
        interior_id: options.interiorId || 0
    });
}

exports = createStoredVehicle;
