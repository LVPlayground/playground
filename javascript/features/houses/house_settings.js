// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class represents the settings associated with a given house.
class HouseSettings {
    constructor(house) {
        this.id_ = house.id;
        this.name_ = house.name;

        this.ownerId_ = house.ownerId;
        this.ownerName_ = house.ownerName;
    }

    // Gets the internal Id of this house in the database.
    get id() { return this.id_; }

    // Gets the name of this house, which can be set by the owner.
    get name() { return this.name_; }

    // Gets the user Id of the player that own this house.
    get ownerId() { return this.ownerId_; }

    // Gets the username of the player that owns this house.
    get ownerName() { return this.ownerName_; }

    dispose() {}
}

exports = HouseSettings;
