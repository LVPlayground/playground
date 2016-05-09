// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Represents a stored vehicle. There is no limit to the number of vehicles that can be stored on
// Las Venturas Playground, as the vehicle streamer will create and destroy these on demand.
class StoredVehicle {
    constructor(vehicleData) {
        this.databaseId_ = vehicleData.vehicle_id;

        this.modelId_ = vehicleData.model_id;
        this.position_ =
            new Vector(vehicleData.position_x, vehicleData.position_y, vehicleData.position_z);
        this.rotation_ = vehicleData.rotation;

        this.primaryColor_ = vehicleData.primary_color;
        this.secondaryColor_ = vehicleData.secondary_color;
        this.paintjob_ = vehicleData.paintjob;

        this.interiorId_ = vehicleData.interior_id;
    }

    // Gets the persistent Id of this vehicle in the database.
    get databaseId() { return this.databaseId_; }

    // Gets the model Id of this stored vehicle.
    get modelId() { return this.modelId_ };

    // Gets the position of this stored vehicle as a vector.
    get position() { return this.position_; }

    // Gets the rotation of this stored vehicle.
    get rotation() { return this.rotation_; }

    // Gets the primary color of this vehicle as a SA-MP vehicle color Id.
    get primaryColor() { return this.primaryColor_; }

    // Gets the secondary color of this vehicle as a SA-MP vehicle color Id.
    get secondaryColor() { return this.secondaryColor_; }

    // Gets the paintjob that should be applied to this vehicle.
    get paintjob() { return this.paintjob_; }

    // Gets the interior Id this vehicle should be linked to.
    get interiorId() { return this.interiorId_; }
}

exports = StoredVehicle;
