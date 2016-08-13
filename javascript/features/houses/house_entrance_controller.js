// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');

// The radius around a house pickup within which the label will be visible.
const HOUSE_LABEL_DRAW_DISTANCE = 30;

// The house entrance controller is responsible for the entrances associated with each of the house
// locations, regardless of whether the location has been occupied.
class HouseEntranceController {
    constructor(manager, economy) {
        this.entities_ = new ScopedEntities();

        this.manager_ = manager;
        this.economy_ = economy;

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

        this.pickups_.delete(pickup);
        this.pickupLabels_.delete(pickup);
        this.locations_.delete(location);

        pickup.dispose();
    }

    // Called when the |player| enters the |pickup|, which could be one of the houses created on the
    // server. In that case we either teleport them, or show them the information dialog.
    onPlayerEnterPickup(player, pickup) {
        const location = this.pickups_.get(pickup);
        if (!location)
            return;

        // Store the |pickup| the |player| is currently standing in, powering `/house buy`.
        this.currentPickup_.set(player, pickup);

        const playerHouse = this.manager_.getHouseForPlayer(player);

        // Offer the |player| the ability to purchase the house when it's available and they don't
        // own another house yet (players are limited to owning one house at a time).
        if (location.isAvailable()) {
            const minimumPrice =
                this.economy_().calculateHousePrice(location.position, location.parkingLotCount,
                                                    0 /* interiorValue */);

            // The |location| is available, but the |player| owns a house.
            if (playerHouse !== null) {
                player.sendMessage(Message.HOUSE_PICKUP_CANNOT_PURCHASE, minimumPrice);
                return;
            }

            // The |location| is available, and the |player| does not own the house.
            player.sendMessage(Message.HOUSE_PICKUP_CAN_PURCHASE, minimumPrice);
            return;
        }

        // TODO: Respond to the player entering the occupied location's entrance.
        console.log('Entered location #' + location.id);
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

    dispose() {
        server.pickupManager.removeObserver(this);

        this.entities_.dispose();
    }
}

exports = HouseEntranceController;
