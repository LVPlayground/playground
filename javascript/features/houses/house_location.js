// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information about a location at which a house can be created by a player. The
// locations can be created by administrators, although the prices are to be determined by an
// algorithm in the general economy code.
class HouseLocation {
    constructor(id, locationInfo) {
        this.id_ = id;

        this.position_ = locationInfo.position;
        this.facingAngle_ = locationInfo.facingAngle;
        this.interiorId_ = locationInfo.interiorId;

        this.parkingLots_ = new Map();

        this.settings_ = null;
        this.interior_ = null;

        // Load the |parkingLots| from the database to this location.
        if (locationInfo.hasOwnProperty('parkingLots')) {
            locationInfo.parkingLots.forEach(parkingLot =>
                this.parkingLots_.set(parkingLot.id, parkingLot));
        }
    }

    // Gets the unique Id representing this location in the database.
    get id() { return this.id_; }

    // Returns whether this location is available for purchase.
    isAvailable() { return !this.settings_; }

    // Gets the position of this house location.
    get position() { return this.position_; }

    // Gets the facing angle for the player when leaving this location.
    get facingAngle() { return this.facingAngle_; }

    // Gets the interior Id in which this location had been created.
    get interiorId() { return this.interiorId_; }

    // Gets the array of parking lots associated with this location.
    get parkingLots() { return this.parkingLots_.values(); }

    // Gets the (mutable) map of parking lot Id to parking lot instance for this location.
    get parkingLotsMap() { return this.parkingLots_; }

    // Gets the number of parking lots associated with this location.
    get parkingLotCount() { return this.parkingLots_.size; }

    // Gets the settings associated with this location. Only available when it's occupied.
    get settings() { return this.settings_; }

    // Gets the interior associated with this location. Only available when it's occupied.
    get interior() { return this.interior_; }

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

    // Sets the house occupying this location to |houseSettings| tied to the |houseInterior|.
    setHouse(houseSettings, houseInterior) {
        if (this.settings_ || this.interior_)
            throw new Error('This location is already occupied by a house. Remove it first.');

        this.settings_ = houseSettings;
        this.interior_ = houseInterior;
    }

    // Removes the house that's associated with this location.
    removeHouse() {
        if (!this.settings_ || !this.interior_)
            throw new Error('This location is not currently occupied; there is nothing to remove.');

        this.settings_.dispose();
        this.settings_ = null;

        this.interior_.dispose();
        this.interior_ = null;
    }

    dispose() {
        if (this.settings_) {
            this.settings_.dispose();
            this.settings_ = null;
        }

        if (this.interior_) {
            this.interior_.dispose();
            this.interior_ = null;
        }
    }
}

export default HouseLocation;
