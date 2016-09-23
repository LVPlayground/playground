// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredVehicle = require('features/streamer/stored_vehicle.js');

// Class that extends StoredVehicle with the persistent information of the vehicle.
class DatabaseVehicle extends StoredVehicle {
    constructor(args) {
        super(args);

        this.databaseId_ = args.databaseId;
    }

    // Gets the Id through which this vehicle is represented in the database. May be NULL. The
    // setter of this property should only be used by the VehicleDatabase class.
    get databaseId() { return this.databaseId_; }
    set databaseId(value) { this.databaseId_ = value; }

    // Returns whether this vehicle is persistent. A persistent vehicle is stored in the database
    // and will continue to exist between restarts of the gamemode.
    isPersistent() { return this.databaseId_ !== null; }
}

exports = DatabaseVehicle;
