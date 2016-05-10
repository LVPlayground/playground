// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Supports exactly the same API as a regular Vehicle entity, but will only store the data locally
// instead of actually creating the vehicle on the server.
class MockVehicle {
    constructor(options) {
        this.vehicleId_ = Math.floor(Math.random() * 10000000);
        this.modelId_ = options.modelId || 411;

        this.position_ = options.position || new Vector(0, 0, 0);
        this.rotation_ = options.rotation || 0;

        this.colors_ = options.colors || [0, 0];
        this.paintjob_ = options.paintjob || null;

        this.interiorId_ = options.interiorId || 0;
    }

    // Returns whether this vehicle has been created on the server.
    isLive() { return this.vehicleId_ !== null; }

    // Gets the model Id associated with this vehicle.
    get modelId() { return this.modelId_; }

    // Gets or sets the position of this vehicle.
    get position() { return this.position_; }
    set position(value) { this.position_ = value; }

    // Gets or sets the rotation of this vehicle.
    get rotation() { return this.rotation_; }
    set rotation(value) { this.rotation_ = value; }

    // Gets or sets the colors that have been applied to this vehicle.
    get colors() { return this.colors_; }
    set colors(value) { this.colors_ = value; }

    // Gets or sets the paintjob that have been applied to this vehicle.
    get paintjob() { return this.paintjob_; }
    set paintjob(value) { this.paintjob_ = value; }

    // Gets or sets the interior that this vehicle has been linked to.
    get interiorId() { return this.interiorId_; }
    set interiorId(value) { this.interiorId_ = value; }

    // Disposes the vehicle by removing it from the server.
    dispose() {
        this.vehicleId_ = null;
    }
}

exports = MockVehicle;
