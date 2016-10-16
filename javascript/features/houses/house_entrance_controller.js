// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseSettings = require('features/houses/house_settings.js');
const Portal = require('features/location/portal.js');
const ScopedEntities = require('entities/scoped_entities.js');

// The radius around a house pickup within which the label will be visible.
const HOUSE_AVAILABLE_LABEL_DRAW_DISTANCE = 20;

// The house entrance controller is responsible for the entrances associated with each of the house
// locations, regardless of whether the location has been occupied.
//
// Available houses will be represented with a pickup that will enable the player to purchase the
// house when it's available. Occupied houses will use a Portal provided by the Location Feature for
// creating an entrance and exit, still guarded by this class' permission checking.
class HouseEntranceController {
    constructor(manager, abuse, economy, friends, gangs, locationFeature) {
        this.entities_ = new ScopedEntities();

        this.abuse_ = abuse;
        this.manager_ = manager;
        this.economy_ = economy;
        this.friends_ = friends;

        this.gangsFeature_ = gangs;
        this.gangsFeature_.addReloadObserver(
            this, HouseEntranceController.prototype.reattachGangObserver);

        this.gangsFeature_().addObserver(this);

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
                drawDistance: HOUSE_AVAILABLE_LABEL_DRAW_DISTANCE,
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

            const exitData = interiorData.exits[0];

            const entrancePoint = {
                position: location.position.translate({ z: -1 }),
                facingAngle: exitData.rotation,
                interiorId: location.interiorId,
                virtualWorld: 0 /* main world */
            };

            const exitPoint = {
                position: new Vector(...exitData.position).translate({ z: -1 }),
                facingAngle: location.facingAngle,
                interiorId: interiorData.interior,
                virtualWorld: VirtualWorld.forHouse(location)
            };

            const portal = new Portal('House ' + location.settings.id, entrancePoint, exitPoint, {
                color: location.settings.markerColor,
                accessCheckFn:
                    HouseEntranceController.prototype.hasAccessToHouse.bind(this, location),
                enterFn:
                    HouseEntranceController.prototype.onPlayerEnterHouse.bind(this, location),
                exitFn:
                    HouseEntranceController.prototype.onPlayerExitHouse.bind(this, location),
                label:
                    location.settings.name + '\n{FFFF00}' + location.settings.ownerName
            });

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

    // Updates the |location|'s |setting| to be |value|. This requires the |location| to be occupied
    updateLocationSetting(location, setting, value) {
        if (!this.locations_.has(location))
            throw new Error('The |location| has not yet been added to the entrance controller.');

        const portal = this.occupiedLocationPortals_.get(location);
        if (!portal)
            throw new Error('The |location| must be occupied in order to update the settings.');

        // Update the portal's setting through the Location feature's interior manager.
        this.locationFeature_().updatePortalSetting(
            portal, setting,
            setting === 'label' ? value + '\n{FFFF00}' + location.settings.ownerName
                                : value);
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

                // Remove any players who are currently in the |location| from the house.
                server.playerManager.forEach(player => {
                    if (this.currentHouse_.get(player) !== location)
                        return;

                    this.exitHouse(player);
                });

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

    // Called when the `gangs` feature on the server reloads.
    reattachGangObserver(gangsFeature) {
        gangsFeature.addObserver(this);
    }

    // Called when the |userId| has left a particular gang.
    onUserJoinGang(userId, gangId) {
        for (const location of this.occupiedLocationPortals_.keys()) {
            if (location.settings.ownerId !== userId)
                continue;

            location.settings.ownerGangId = gangId;
        }
    }

    // Called when the |userId| has joined the gang having Id |gangId|.
    onUserLeaveGang(userId, gangId) {
        for (const location of this.occupiedLocationPortals_.keys()) {
            if (location.settings.ownerId !== userId)
                continue;

            location.settings.ownerGangId = null;
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Makes the |player| enter the |location|. Any sort of entrance restrictions will be skipped.
    enterHouse(player, location) {
        if (location.isAvailable())
            throw new Error('The |location| must be occupied in order to enter it.');

        const portal = this.occupiedLocationPortals_.get(location);

        // Trigger a force-enter through the Location feature.
        this.locationFeature_().enterPortal(player, portal, 'entrance');
    }

    // Returns the location of the current house that the player is standing in, or NULL otherwise.
    getCurrentHouseForPlayer(player) {
        return this.currentHouse_.get(player) || null;
    }

    // Makes the |player| leave the house that they're currently in, unless an explicit location has
    // been given (for instance because we would like them to spawn outside).
    exitHouse(player, explicitLocation = null) {
        const location = explicitLocation || this.currentHouse_.get(player);
        if (!location)
            throw new Error('The |player| is not currently inside a house.');

        const portal = this.occupiedLocationPortals_.get(location);

        // Trigger a force-leave through the Location feature.
        this.locationFeature_().enterPortal(player, portal, 'exit');
    }

    // ---------------------------------------------------------------------------------------------

    // Determines whether the |player| has access to the |location|. This is the case when they're
    // the owner or are on the friends list of the owning player.
    async hasAccessToHouse(location, player) {
        if (!player.isRegistered()) {
            player.sendMessage(Message.HOUSE_NO_ACCESS_UNREGISTERED, location.settings.ownerName);
            return false;
        }

        const teleportStatus = this.abuse_().canTeleport(player, { enforceTimeLimit: false });

        if (!teleportStatus.allowed) {
            player.sendMessage(Message.HOUSE_NO_TELEPORT, teleportStatus.reason);
            return false;
        }

        if (player.userId == location.settings.ownerId)
            return true;

        let message = null;

        switch (location.settings.access) {
            case HouseSettings.ACCESS_EVERYBODY:
                return true;

            case HouseSettings.ACCESS_FRIENDS_AND_GANG:
                if (location.settings.ownerGangId && location.settings.ownerGangId == player.gangId)
                    return true;  // the owner is in the same gang as |player|

                // Deliberate fall-through.

            case HouseSettings.ACCESS_FRIENDS:
                if (await this.friends_().isFriendedBy(player, location.settings.ownerId))
                    return true;  // the owner has friended |player|

                message = Message.HOUSE_NO_ACCESS_FRIENDS;
                break;

            case HouseSettings.ACCESS_PERSONAL:
                message = Message.HOUSE_NO_ACCESS_PERSONAL;
                break;

            default:
                throw new Error('Invalid house access value: ' + location.settings.access);
        }

        if (player.isAdministrator())
            message = Message.HOUSE_NO_ACCESS_ADMIN;

        player.sendMessage(message, location.settings.ownerName);
        return false;
    }

    // Called when the |player| has entered |location| through a portal.
    onPlayerEnterHouse(location, player) {
        this.abuse_().reportTeleport(player, { timeLimited: false });

        this.currentHouse_.set(player, location);
        this.manager_.invokeExtensions('onPlayerEnterHouse', player, location);
    }

    // Called when the |player| has left the |location| through a portal.
    onPlayerExitHouse(location, player) {
        this.manager_.invokeExtensions('onPlayerLeaveHouse', player, location);
        this.currentHouse_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| enters the |pickup| of, potentially, an available house. Advertise
    // the house's availability to them if this is the case.
    onPlayerEnterPickup(player, pickup) {
        const location = this.availablePickups_.get(pickup);
        if (!location)
            return;

        // Play a sound for |player| to audibly inform them that they entered a house.
        player.playSound(1058);

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
        return this.currentLocation_.get(player) || null;
    }

    // Called when the |player| leaves the pickup they were standing in.
    onPlayerLeavePickup(player) {
        this.currentLocation_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the pickup created for |location| indicates that the entrance is occupied.
    // This method must only be used for testing purposes.
    isLocationPickupOccupiedForTesting(location) {
        return this.locations_.get(location) === 'occupied';
    }

    dispose() {
        server.pickupManager.removeObserver(this);

        this.gangsFeature_().removeObserver(this);

        // Forcefully remove all players who currently are in a house to go outside again.
        server.playerManager.forEach(player => {
            if (this.currentHouse_.has(player))
                this.exitHouse(player);
        });

        for (const portal of this.occupiedLocationPortals_.values())
            this.locationFeature_().removePortal(portal);

        this.occupiedLocationPortals_.clear();
        this.occupiedLocationPortals_ = null;

        this.locationFeature_.removeReloadObserver(this);
        this.locationFeature_ = null;

        // Finally remove all the entities that were created by the entrance controller.
        this.entities_.dispose();
    }
}

exports = HouseEntranceController;
