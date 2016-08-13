// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information about a location at which a house can be created by a player. The
// locations can be created by administrators, although the prices are to be determined by an
// algorithm in the general economy code.
class HouseLocation {
    constructor(location) {
        this.id_ = location.id;

        this.position_ = location.position;
        this.parkingLots_ = new Map();
    }

    // Gets the unique Id representing this location in the database.
    get id() { return this.id_; }

    // Returns whether this location is available for purchase.
    isAvailable() { return true; }

    // Gets the position of this house location.
    get position() { return this.position_; }

    // Gets the array of parking lots associated with this location.
    get parkingLots() { return this.parkingLots_.values(); }

    // Gets the number of parking lots associated with this location.
    get parkingLotCount() { return this.parkingLots_.size; }

    // Adds the |parkingLot| to this location. Must only be called by the HouseManager.
    addParkingLot(parkingLot) {
        this.parkingLots_.set(parkingLot.id, parkingLot);
    }

    // Returns whether this location owns the |parkingLot|. Must only be called by the HouseManager.
    hasParkingLot(parkingLot) {
        return this.parkingLots_.has(parkingLot.id);
    }

    // Removes the |parkingLot| from this location. Must only be called by the HouseManager.
    removeParkingLot(parkingLot) {
        if (!this.parkingLots_.has(parkingLot.id))
            throw new Error('The given |parkingLot| does not belong to this location.');

        this.parkingLots_.delete(parkingLot.id);
    }
}

exports = HouseLocation;
