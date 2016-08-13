// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked database class that implements the same API as the regular HouseDatabase class, but will
// return faked data for the purposes of testing rather than consult the database.
class MockHouseDatabase {
    constructor() {
        this.mockLocationId_ = 1000;
        this.mockParkingLotId_ = 2000;
    }

    async loadLocations() {
        return [
            { id: 1, position: new Vector(100, 150, 200) },
            { id: 2, position: new Vector(200, 250, 300) },
            { id: 3, position: new Vector(300, 350, 400) }
        ];
    }

    async createLocation(player, position) {
        return this.mockLocationId_++;
    }

    async createLocationParkingLot(player, location, parkingLot) {
        return this.mockParkingLotId_++;
    }

    async removeLocation(location) {}

    async removeLocationParkingLot(parkingLot) {}
}

exports = MockHouseDatabase;
