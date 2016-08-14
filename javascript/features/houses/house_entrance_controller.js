// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');

// The radius around a house pickup within which the label will be visible.
const HOUSE_LABEL_DRAW_DISTANCE = 30;

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

        server.pickupManager.addObserver(this);
    }

    // Adds |location| to the set of locations to be tracked by the entrance controller. It will
    // create both the exterior entrances for the |location|, and when occupied, the interior exits.
    addLocation(location) {
        const pickup = this.entities_.createPickup({
            position: location.position,
            modelId: location.isAvailable() ? 19524 /* yellow house */
                                            : 19902 /* yellow marker */
        });

        
        const label = this.entities_.createTextLabel({
            text: this.compileLocationDescription(location),
            color: Color.fromRGB(255, 255, 0),
            position: location.position.translate({ z: 0.6 }),
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

        // TODO(Russell): Improve the `occupied` label for houses to mention their owner.
        return 'Occupied';
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

    // Makes the |player| enter the house created at |location|.
    enterHouse(player, location) {
        // TODO: Implement this function.
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

        this.entities_.dispose();
    }
}

exports = HouseEntranceController;
