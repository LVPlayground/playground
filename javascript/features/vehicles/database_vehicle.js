// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import StoredVehicle from 'features/streamer/stored_vehicle.js';

// Class that extends StoredVehicle with the persistent information of the vehicle.
class DatabaseVehicle extends StoredVehicle {
    constructor(args) {
        super(args);

        this.databaseId_ = args.databaseId;

        // Ignore the access type if the given value is invalid.
        if (!DatabaseVehicle.ACCESS_TYPES.includes(args.accessType)) {
            console.log('WARNING: Invalid vehicle access type for vehicle #' + args.databaseId);

            args.accessType = DatabaseVehicle.ACCESS_TYPE_EVERYONE;
            args.accessValue = 0;
        }

        this.accessType_ = args.accessType;
        this.accessValue_ = args.accessValue;
    }

    // Gets the Id through which this vehicle is represented in the database. May be NULL. The
    // setter of this property should only be used by the VehicleDatabase class.
    get databaseId() { return this.databaseId_; }
    set databaseId(value) { this.databaseId_ = value; }

    // Returns whether this vehicle is persistent. A persistent vehicle is stored in the database
    // and will continue to exist between restarts of the gamemode.
    isPersistent() { return this.databaseId_ !== null; }

    // Gets or sets the access type that this vehicle adheres to. Should only be updated by the
    // VehicleManager to make sure the values stay in sync everywhere.
    get accessType() { return this.accessType_; }
    set accessType(value) { this.accessType_ = value; }

    // Gets or sets the access value associated with the access type. Should only be updated by the
    // VehicleManager to make sure the values stay in sync everywhere.
    get accessValue() { return this.accessValue_; }
    set accessValue(value) { this.accessValue_ = value; }
}

// The different kinds of access types that can be stored with a vehicle.
DatabaseVehicle.ACCESS_TYPE_EVERYONE = 'everyone';
DatabaseVehicle.ACCESS_TYPE_PLAYER = 'player';
DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL = 'player_level';
DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP = 'player_vip';

// Array with the recognized access types for DatabaseVehicles.
DatabaseVehicle.ACCESS_TYPES = [
    DatabaseVehicle.ACCESS_TYPE_EVERYONE,
    DatabaseVehicle.ACCESS_TYPE_PLAYER,
    DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL,
    DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP
];

export default DatabaseVehicle;
