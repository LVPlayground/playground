// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Class representing the persistent Id, position and location of a parking lot.
class HouseParkingLot {
    constructor(parkingLot) {
        this.id_ = parkingLot.id;
        this.position_ = parkingLot.position;
        this.rotation_ = parkingLot.rotation;
        this.interiorId_ = parkingLot.interiorId;
    }

    // Gets the Id of this parking lot in the database.
    get id() { return this.id_; }

    // Gets the intended position of the vehicle occupying this parking lot.
    get position() { return this.position_; }

    // Gets the intended rotation of the vehicle occupying this parking lot.
    get rotation() { return this.rotation_; }

    // Gets the interior Id in which this parking lot should exist.
    get interiorId() { return this.interiorId_; }
}

export default HouseParkingLot;
