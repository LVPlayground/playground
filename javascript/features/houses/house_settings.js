// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class represents the settings associated with a given house.
class HouseSettings {
    constructor(house) {
        this.id_ = house.id;
        this.name_ = house.name;

        this.ownerId_ = house.ownerId;
        this.ownerGangId_ = house.ownerGangId;
        this.ownerName_ = house.ownerName;

        this.access_ = house.access;
        this.spawnPoint_ = house.spawnPoint;
    }

    // Gets the internal Id of this house in the database.
    get id() { return this.id_; }

    // Gets or sets the name of this house, which can be set by the owner. Updating the name of a
    // house should only be done by the HouseManager.
    get name() { return this.name_; }
    set name(value) { this.name_ = value; }

    // Gets the user Id of the player that own this house.
    get ownerId() { return this.ownerId_; }

    // Gets or sets the Id of the gang the house's owner is part of.
    get ownerGangId() { return this.ownerGangId_; }
    set ownerGangId(value) { this.ownerGangId_ = value; }

    // Gets the username of the player that owns this house.
    get ownerName() { return this.ownerName_; }

    // Gets or sets the access level of this house. Updating the access level should only be done
    // by the HouseManager, because it needs to be reflected in the database.
    get access() { return this.access_; }
    set access(value) { this.access_ = value; }

    // Returns whether this house should be the spawn point for the owner.
    isSpawn() { return this.spawnPoint_; }

    // Updates whether the house should be the spawn point for the owner.
    setSpawn(spawnPoint) { this.spawnPoint_ = spawnPoint; }

    dispose() {}
}

// The following values determine the access rules for houses.
HouseSettings.ACCESS_EVERYBODY = 0;
HouseSettings.ACCESS_FRIENDS_AND_GANG = 1;
HouseSettings.ACCESS_FRIENDS = 2;
HouseSettings.ACCESS_PERSONAL = 3;

// The default access level that will be given to new houses.
HouseSettings.ACCESS_DEFAULT = HouseSettings.ACCESS_FRIENDS;

exports = HouseSettings;
