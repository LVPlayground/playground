// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Portal = require('features/location/portal.js');
const ScopedEntities = require('entities/scoped_entities.js');

// The radius around a house pickup within which the label will be visible.
const HOUSE_LABEL_DRAW_DISTANCE = 20;

// The house entrance controller is responsible for the entrances associated with each of the house
// locations, regardless of whether the location has been occupied.
//
// Available houses will be represented with a pickup that will enable the player to purchase the
// house when it's available. Occupied houses will use a Portal provided by the Location Feature for
// creating an entrance and exit, still guarded by this class' permission checking.
//
// TODO: Re-enable the HouseEntranceController tests.
class HouseEntranceController {
    constructor(manager, economy, friends, locationFeature) {
        this.entities_ = new ScopedEntities();

        this.manager_ = manager;
        this.economy_ = economy;
        this.friends_ = friends;

        this.locationFeature_ = locationFeature;
        this.locationFeature_.addReloadObserver(
            this, HouseEntranceController.prototype.recreateLocationPortals);

        // Map of locations to their current availability status.
        this.locations_ = new Map();

        // Maps of available locations to the associated labels and pickups.
        this.availableLocationLabels_ = new Map();
        this.availableLocationPickups_ = new Map();

        // Map of pickups for available locations to the location.
        this.availablePickups_ = new Map();

        // Map of occupied locations to their associated portals.
        this.occupiedLocationPortals_ = new Map();

        // Weak map providing a reference to the location a player is currently in, and a weak map
        // providing a reference to the house a player currently is in.
        this.currentLocation_ = new WeakMap();
        this.currentHouse_ = new WeakMap();

        server.pickupManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Adds |location| to the set of locations to be tracked by the entrance controller. It will
    // create both the exterior entrances for the |location|, and when occupied, the interior exits.
    addLocation(location) {
        if (this.locations_.has(location))
            throw new Error('The |location| has already been added to the entrance controller.');

        this.locations_.set(location, location.isAvailable() ? 'available'
                                                             : 'occupied');

        if (location.isAvailable()) {
            const pickup = this.entities_.createPickup({
                position: location.position,
                modelId: 19524 /* yellow house */
            });

            const label = this.entities_.createTextLabel({
                position: location.position.translate({ z: 0.6 }),
                drawDistance: HOUSE_LABEL_DRAW_DISTANCE,
                testLineOfSight: true,

                text: 'Available House',
                color: Color.YELLOW
            });

            this.availableLocationLabels_.set(location, label);
            this.availableLocationPickups_.set(location, pickup);
            this.availablePickups_.set(pickup, location);

        } else {
            const interior = location.interior;
            const interiorData = interior.getData();

            if (interiorData.exits.length != 1)
                throw new Error('Houses may only have a single exit for now.');

            const entrancePoint = {
                position: location.position,
                facingAngle: 0 /** XXX This should be stored. **/,
                interiorId: 0 /** XXX This should be stored. **/,
                virtualWorld: 0 /* main world */
            };

            const exitData = interiorData.exits[0];
            const exitPoint = {
                position: new Vector(...exitData.position),
                facingAngle: exitData.rotation,
                interiorId: interiorData.interior,
                virtualWorld: VirtualWorld.forHouse(location)
            };

            // TODO: The |portal| should have a label.
            // TODO: The |portal| should have a custom access check.
            // TODO: The |portal| should have event listeners.

            const portal = new Portal('House ' + location.settings.id, entrancePoint, exitPoint);

            // Create the portal through the Location feature's interior manager.
            this.locationFeature_().createPortal(portal);

            this.occupiedLocationPortals_.set(location, portal);
        }
    }

    // Updates the |location|'s state within the entrance controller, for instance because a house
    // on the location has been purchased or sold. This is achieved by re-creating the entry.
    updateLocation(location) {
        this.removeLocation(location);
        this.addLocation(location);
    }

    // Removes |location| from the set of tracked locations. All entrances will be removed.
    removeLocation(location) {
        if (!this.locations_.has(location))
            throw new Error('The |location| has not yet been added to the entrance controller.');

        switch (this.locations_.get(location)) {
            case 'available':
                const label = this.availableLocationLabels_.get(location);
                const pickup = this.availableLocationPickups_.get(location);

                if (!label || !pickup)
                    throw new Error('The |location| must have an associated pickup/label.');

                this.availableLocationLabels_.delete(location);
                this.availableLocationPickups_.delete(location);                
                this.availablePickups_.delete(pickup);

                label.dispose();
                pickup.dispose();
                break

            case 'occupied':
                const portal = this.occupiedLocationPortals_.get(location);
                if (!portal)
                    throw new Error('The |location| must have an associated portal.');

                this.occupiedLocationPortals_.delete(location);

                // Remove the portal through the Location feature's interior manager.
                this.locationFeature_().removePortal(portal);
                break;

            default:
                throw new Error('Unexpected location occupancy: ' + this.locations_.get(location));
        }

        this.locations_.delete(location);
    }

    // ---------------------------------------------------------------------------------------------

    // Re-creates the location portals for all occupied properties. Automatically triggered when the
    // Location feature has been reloaded on the server, thereby destroying all portals.
    recreateLocationPortals(locationFeature) {
        for (const portal of this.occupiedLocationPortals_.values())
            locationFeature.createPortal(portal);
    }

    // ---------------------------------------------------------------------------------------------

    // Makes the |player| enter the |location|.
    enterHouse(player, location) {
        if (location.isAvailable())
            throw new Error('The |location| must be occupied in order to enter it.');

        // TODO: Implement this method.
    }

    // Returns the location of the current house that the player is standing in, or NULL otherwise.
    getCurrentHouse(player) {
        return this.currentHouse_.get(player);
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

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| enters the |pickup| of, potentially, an available house. Advertise
    // the house's availability to them if this is the case.
    onPlayerEnterPickup(player, pickup) {
        const location = this.availablePickups_.get(pickup);
        if (!location)
            return;

        // Store the |location| the |player| is currently standing in, powering `/house buy`.
        this.currentLocation_.set(player, location);

        const playerHouses = this.manager_.getHousesForPlayer(player);
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
    }

    // Returns the house location the |player| is currently standing in. May return NULL.
    getCurrentLocationForPlayer(player) {
        return this.currentLocation_.get(player);
    }

    // Called when the |player| leaves the pickup they were standing in.
    onPlayerLeavePickup(player) {
        this.currentPickup_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the pickup created for |location| indicates that the entrance is occupied.
    // This method must only be used for testing purposes.
    isLocationPickupOccupiedForTesting(location) {
        return this.locations_.get(location) === 'occupied';
    }

    dispose() {
        server.pickupManager.removeObserver(this);

        for (const portal of this.occupiedLocationPortals_.values())
            this.locationFeature_().removePortal(portal);

        this.occupiedLocationPortals_.clear();
        this.occupiedLocationPortals_ = null;

        this.locationFeature_.removeReloadObserver(this);
        this.locationFeature_ = null;

        // Forcefully remove all players who currently are in a house to go outside again.
        server.playerManager.forEach(player => {
            if (this.currentHouse_.has(player))
                this.exitHouse(player);
        });

        // Finally remove all the entities that were created by the entrance controller.
        this.entities_.dispose();
    }
}

exports = HouseEntranceController;
