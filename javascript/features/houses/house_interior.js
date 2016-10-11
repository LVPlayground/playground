// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const InteriorList = require('features/houses/utils/interior_list.js');

// This class represents the interior information of a given house.
class HouseInterior {
    constructor(house) {
        this.id_ = house.id;

        this.interiorId_ = house.interiorId;
        this.features_ = house.features;
    }

    // Gets the interior Id (in the interior list) that this house is tied to.
    get interiorId() { return this.interiorId_; }

    // Gets access to the map in which the features available to this house are stored.
    get features() { return this.features_; }

    // Gets an object with the data associated with the assigned interior Id. Will throw if the
    // stored interior is not valid, which should never happen.
    getData() {
        return InteriorList.getById(this.interiorId_);
    }

    dispose() {}
}

exports = HouseInterior;
