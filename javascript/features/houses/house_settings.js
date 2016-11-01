// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseVehicle = require('features/houses/house_vehicle.js');

// This class represents the settings associated with a given house.
class HouseSettings {
    constructor(house, parkingLotsMap) {
        this.id_ = house.id;
        this.name_ = house.name;

        this.owner_ = null;
        this.ownerId_ = house.ownerId;
        this.ownerGangId_ = house.ownerGangId;
        this.ownerName_ = house.ownerName;

        this.purchaseTime_ = house.purchaseTime;

        this.access_ = house.access;
        this.spawnPoint_ = house.spawnPoint;
        this.welcomeMessage_ = house.welcomeMessage;
        this.streamUrl_ = house.streamUrl;
        this.markerColor_ = house.markerColor;

        this.vehicles_ = new Map();

        // Load the vehicles associated with the |house| and link them to the |parkingLotsMap|.
        house.vehicles.forEach(vehicle => {
            const parkingLot = parkingLotsMap.get(vehicle.parkingLotId);
            if (!parkingLot) {
                console.log(
                    'Warning: Unassociated vehicle (' + vehicle.id + ') for house #' + house.id);
                return;
            }

            // Associate a new HouseVehicle instance with the given |parkingLot|.
            this.vehicles_.set(parkingLot, new HouseVehicle(vehicle, parkingLot))
        });
    }

    // Gets the internal Id of this house in the database.
    get id() { return this.id_; }

    // Gets or sets the name of this house, which can be set by the owner. Updating the name of a
    // house should only be done by the HouseManager.
    get name() { return this.name_; }
    set name(value) { this.name_ = value; }

    // Gets or sets the Player object of the owner when they're connected to the server. This
    // property should only be updated by the HouseManager, that keeps track of this data.
    get owner() { return this.owner_; }
    set owner(value) { this.owner_ = value; }

    // Gets the user Id of the player that own this house.
    get ownerId() { return this.ownerId_; }

    // Gets or sets the Id of the gang the house's owner is part of.
    get ownerGangId() { return this.ownerGangId_; }
    set ownerGangId(value) { this.ownerGangId_ = value; }

    // Gets the username of the player that owns this house. Should only be updated by the
    // HouseManager when it's been detected that a player changed their nickname.
    get ownerName() { return this.ownerName_; }
    set ownerName(value) { this.ownerName_ = value; }

    // Gets the UNIX timestamp, in seconds, at which the house was bought by the player.
    get purchaseTime() { return this.purchaseTime_; }

    // Gets or sets the access level of this house. Updating the access level should only be done
    // by the HouseManager, because it needs to be reflected in the database.
    get access() { return this.access_; }
    set access(value) { this.access_ = value; }

    // Returns whether this house should be the spawn point for the owner.
    isSpawn() { return this.spawnPoint_; }

    // Updates whether the house should be the spawn point for the owner.
    setSpawn(spawnPoint) { this.spawnPoint_ = spawnPoint; }

    // Gets or sets the welcome message of this house. An empty string will cause a default message
    // to be shown to entering players instead.
    get welcomeMessage() { return this.welcomeMessage_; }
    set welcomeMessage(value) { this.welcomeMessage_ = value; }

    // Gets or sets the audio stream URL for this house. An empty string will prevent any music from
    // playing when anyone enters the house.
    get streamUrl() { return this.streamUrl_; }
    set streamUrl(value) { this.streamUrl_ = value; }

    // Returns whether the house has a stream Url that can be played when players enter the house.
    hasAudioStream() { return this.streamUrl_ && this.streamUrl_.startsWith('http'); }

    // Gets or sets the color of the marker that should be used for the house's entrance. It must
    // be one of {yellow, red, green, blue}, which should be enforced elsewhere.
    get markerColor() { return this.markerColor_; }
    set markerColor(value) { this.markerColor_ = value; }

    // Gets the vehicles that have been created for this house. Mutable mapping from the parkingLot
    // instance associated with the location to the HouseVehicle instance associated with the house.
    get vehicles() { return this.vehicles_; }

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
