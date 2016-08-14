// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class represents the interior information of a given house.
class HouseInterior {
    constructor(house) {
        this.id_ = house.id;

        this.interiorId_ = house.interiorId;
    }

    // Gets the interior Id (in the interior list) that this house is tied to.
    get interiorId() { return this.interiorId_; }

    dispose() {}
}

exports = HouseInterior;
