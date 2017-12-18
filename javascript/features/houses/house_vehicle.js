// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a vehicle that's associated with a house. A vehicle is tied to a particular parking
// lot and to a particular house.
class HouseVehicle {
    constructor(vehicle, parkingLot) {
        this.id_ = vehicle.id;
        this.modelId_ = vehicle.modelId;

        this.parkingLot_ = parkingLot;
    }

    // Gets the Id of this vehicle in the database.
    get id() { return this.id_; }

    // Gets the Id of the model that should be used to represent this vehicle.
    get modelId() { return this.modelId_; }

    // Gets the parking lot on which this vehicle should be parked.
    get parkingLot() { return this.parkingLot_; }
}

export default HouseVehicle;
