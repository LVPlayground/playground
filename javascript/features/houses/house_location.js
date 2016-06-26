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
    }

    // Gets the unique Id representing this location in the database.
    get id() { return this.id_; }

    // Gets the position of this house location.
    get position() { return this.position_; }

    // Returns whether this location is available for purchase.
    isAvailable() { return true; }
}

exports = HouseLocation;
