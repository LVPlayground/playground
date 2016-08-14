// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');

// The radius around a house pickup within which the label will be visible.
const HOUSE_LABEL_DRAW_DISTANCE = 20;

// The house entrance controller is responsible for the entrances associated with each of the house
// locations, regardless of whether the location has been occupied.
class HouseEntranceController {
    constructor(manager, economy, friends) {
        this.entities_ = new ScopedEntities();

        this.manager_ = manager;
        this.economy_ = economy;
        this.friends_ = friends;

        // Maps providing mappings from location to pickup, and from pickup to location.
        this.pickups_ = new Map();
        this.pickupLabels_ = new Map();
        this.locations_ = new Map();

        // Weak map providing a reference to the location pickup a player currently stands in.
        this.currentPickup_ = new WeakMap();

        // Weak map providing a reference to the location a player is currently in.
        this.currentHouse_ = new WeakMap();

        server.pickupManager.addObserver(this);
    }

    // Adds |location| to the set of locations to be tracked by the entrance controller. It will
    // create both the exterior entrances for the |location|, and when occupied, the interior exits.
    addLocation(location) {
        const style =
            location.isAvailable() ? { 
                                        pickupOffset: { z: 0 },
                                        pickupModel: 19524, /* yellow house */
                                        labelColor: Color.fromRGB(255, 255, 0),
                                        labelOffset: { z: 0.6 }
                                     }
                                   : {
                                        pickupOffset: { z: -0.95 },
                                        pickupModel: 19902, /* yellow marker */
                                        labelColor: Color.fromRGB(255, 255, 255),
                                        labelOffset: { z: 1.2 }
                                     };

        const pickup = this.entities_.createPickup({
            position: location.position.translate(style.pickupOffset),
            modelId: style.pickupModel
        });
        
        const label = this.entities_.createTextLabel({
            text: this.compileLocationDescription(location),
            color: style.labelColor,
            position: location.position.translate(style.labelOffset),
            drawDistance: HOUSE_LABEL_DRAW_DISTANCE,
            testLineOfSight: true
        });

        this.pickups_.set(pickup, location);
        this.pickupLabels_.set(pickup, label);
        this.locations_.set(location, pickup);
    }

    // Updates the |location|'s state within the entrance controller, for instance because a house
    // on the location has been purchased or sold. This is achieved by re-creating the entry.
    updateLocation(location) {
        this.removeLocation(location);
        this.addLocation(location);
    }

    // Compiles the description of the |location| that should be displayed in a text label above it.
    compileLocationDescription(location) {
        if (location.isAvailable())
            return 'Available House';

        const houseName = location.settings.name;
        const houseOwner = location.settings.ownerName;

        return houseName + '\n{FFFF00}' + houseOwner;
    }

    // Removes |location| from the set of tracked locations. All entrances will be removed.
    removeLocation(location) {
        const pickup = this.locations_.get(location);
        if (!pickup)
            throw new Error('An invalid |location| is being removed from the entrance controller.');

        const label = this.pickupLabels_.get(pickup);

        this.pickups_.delete(pickup);
        this.pickupLabels_.delete(pickup);
        this.locations_.delete(location);

        pickup.dispose();
        label.dispose();
    }

    // ---------------------------------------------------------------------------------------------

    // Makes the |player| enter the house created at |location|.
    enterHouse(player, location) {
        if (location.isAvailable())
            throw new Error('The |location| must be occupied in order to enter it.');

        const interiorData = location.interior.getData();

        player.interiorId = interiorData.interior;
        player.virtualWorld = VirtualWorld.forHouse(location),
        player.position = new Vector(...interiorData.exits[0].position);
        player.rotation = interiorData.exits[0].rotation;

        this.currentHouse_.set(player, location);
    }

    // Returns the location of the current house that the player is standing in, or NULL otherwise.
    getCurrentHouse(player) {
        return this.currentHouse_.has(player);
    }

    // Makes the |player| leave the house that they're currently in.
    exitHouse(player) {
        const location = this.currentHouse_.get(player);
        if (!location)
            throw new Error('The |player| is not currently inside a house.');

        // TODO: Implement this method.
    }

    // ---------------------------------------------------------------------------------------------

    // Determines whether the |player| has access to the |location|. This is the case when they're
    // the owner or are on the friends list of the owning player.
    async hasAccessToHouse(player, location) {
        if (!player.isRegistered())
            return false;  // unregistered players never have access

        if (player.userId == location.settings.ownerId)
            return true;  // the owner can always access their house

        const isFriended = await this.friends_().isFriendedBy(player, location.settings.ownerId);
        if (isFriended)
            return true;  // the owner has added the |player| as their friend

        return false;
    }

    // Called when the |player| enters the |pickup|, which could be one of the houses created on the
    // server. In that case we either teleport them, or show them the information dialog.
    async onPlayerEnterPickup(player, pickup) {
        const location = this.pickups_.get(pickup);
        if (!location)
            return;

        // Store the |pickup| the |player| is currently standing in, powering `/house buy`.
        this.currentPickup_.set(player, pickup);

        const playerHouses = this.manager_.getHousesForPlayer(player);

        // Offer the |player| the ability to purchase the house when it's available and they don't
        // own another house yet (players are limited to owning one house at a time).
        if (location.isAvailable()) {
            const minimumPrice =
                this.economy_().calculateHousePrice(location.position, location.parkingLotCount,
                                                    0 /* interiorValue */);

            // The |location| is available, but the |player| owns a house. This requirement may be
            // removed when we allow players to own multiple houses.
            if (playerHouses.length >= this.manager_.getMaximumHouseCountForPlayer(player)) {
                player.sendMessage(Message.HOUSE_PICKUP_CANNOT_PURCHASE, minimumPrice);
                return;
            }

            // The |location| is available, and the |player| does not own the house.
            player.sendMessage(Message.HOUSE_PICKUP_CAN_PURCHASE, minimumPrice);
            return;
        }

        // Determines whether the |player| has access to this location.
        const hasAccess = await this.hasAccessToHouse(player, location);
        if (hasAccess) {
            this.enterHouse(player, location);
            return;
        }

        const message = player.isAdministrator() ? Message.HOUSE_NO_ACCESS
                                                 : Message.HOUSE_NO_ACCESS_ADMIN;

        player.sendMessage(message, location.settings.ownerName);
    }

    // Returns the house location the |player| is currently standing in. May return NULL.
    getCurrentLocationForPlayer(player) {
        const pickup = this.currentPickup_.get(player);
        if (pickup)
            return this.pickups_.get(pickup);

        return null;
    }

    // Called when the |player| leaves the pickup they were standing in.
    onPlayerLeavePickup(player) {
        this.currentPickup_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the pickup created for |location| indicates that the entrance is occupied.
    // This method must only be used for testing purposes.
    isLocationPickupOccupiedForTesting(location) {
        const pickup = this.locations_.get(location);
        if (!pickup)
            throw new Error('An invalid |location| is being checked at the entrance controller.');

        return pickup.modelId === 19902 /* yellow marker */;
    }

    dispose() {
        server.pickupManager.removeObserver(this);

        // Forcefully remove all players who currently are in a house to go outside again.
        server.playerManager.forEach(player => {
            if (this.currentHouse_.has(player))
                this.exitHouse(player);
        });

        this.entities_.dispose();
    }
}

exports = HouseEntranceController;
