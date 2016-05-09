// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const VehicleGrid = require('features/vehicles/vehicle_grid.js');

// The default streaming distance for vehicles.
const DefaultStreamDistance = 300;

// The vehicle streamer is responsible for making sure that sufficient vehicles have been created
// around players to give everyone the feeling that there are plenty of them available. It does
// this by maintaining a grid of the original vehicle locations, so that the nearest vehicles to
// each players can quickly and accurately be determined.
class VehicleStreamer {
    constructor() {
        this.grid_ = new VehicleGrid(DefaultStreamDistance);
    }
}

exports = VehicleStreamer;
