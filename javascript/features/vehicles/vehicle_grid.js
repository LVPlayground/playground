// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The vehicle grid stores all vehicles on a grid in order to provide reasonably fast KNN updates.
class VehicleGrid {
    constructor(streamDistance) {
        this.streamDistance_ = streamDistance;
        this.grid_ = {};
    }
}

exports = VehicleGrid;
