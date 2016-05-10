// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Represents a stored vehicle. There is no limit to the number of vehicles that can be stored on
// Las Venturas Playground, as the vehicle streamer will create and destroy these on demand.
class StoredVehicle {
    constructor(vehicleData) {
        this.databaseId_ = vehicleData.vehicle_id;
        this.persistent_ = vehicleData.persistent;

        this.modelId_ = vehicleData.model_id;
        this.position_ =
            new Vector(vehicleData.position_x, vehicleData.position_y, vehicleData.position_z);
        this.rotation_ = vehicleData.rotation;

        this.primaryColor_ = vehicleData.primary_color;
        this.secondaryColor_ = vehicleData.secondary_color;
        this.paintjob_ = vehicleData.paintjob;

        this.interiorId_ = vehicleData.interior_id;

        this.vehicle_ = null;

        this.totalRefCount_ = 0;
        this.refCount_ = 0;
    }

    // Gets the persistent Id of this vehicle in the database.
    get databaseId() { return this.databaseId_; }

    // Returns whether this is a persistent vehicle, which means that the vehicle should always be
    // created regardless of whether there are players nearby.
    isPersistent() { return this.persistent_; }

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

    // Gets or sets the vehicle on the server that represents this stored vehicle.
    get vehicle() { return this.vehicle_; }
    set vehicle(value) { this.vehicle_ = value; }

    // Gets the number of times this vehicle has currently been referenced.
    get refCount() { return this.refCount_; }

    // Gets the total number of times this vehicle has ever been referenced.
    get totalRefCount() { return this.totalRefCount_; }

    // Increases or decreases the number of times this vehicle has been referenced. Increasing the
    // reference count will also increase the total number of times it has been referenced.
    increaseRefCount() { ++this.refCount_; ++this.totalRefCount_; }
    decreaseRefCount() { --this.refCount_; }
}

exports = StoredVehicle;
