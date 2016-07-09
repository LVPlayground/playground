// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseDatabase = require('features/houses/house_database.js');
const HouseLocation = require('features/houses/house_location.js');
const ScopedEntities = require('entities/scoped_entities.js');

// The house manager orchestrates all details associated with housing, manages data and responds to
// player connection and disconnection events.
class HouseManager {
    constructor() {
        this.database_ = new HouseDatabase();
        this.dataLoadedPromise_ = new Promise(resolver =>
            this.dataLoadedResolver_ = resolver);

        // Only to be used for the entrance/exit pickups associated with locations.
        this.entities_ = new ScopedEntities();

        this.locations_ = new Set();
        this.locationPickups_ = new Map();

        server.pickupManager.addObserver(this);
    }

    // Gets the number of house locations that have been made available.
    get locationCount() { return this.locations_.size; }

    // Loads all defined houses from the database to the house manager, creating the House instances
    // and associated objects where required.
    async loadHousesFromDatabase() {
        const locations = await this.database_.loadLocations();
        locations.forEach(location =>
            this.locations_.add(new HouseLocation(location)));

        // TODO: Load owners and bound interiors.
        // TODO: Load the vehicles associated with houses.
        // TODO: Load the objects associated with houses.

        // Create the pickup representing the house entrance at |location|.
        this.locations_.forEach(location =>
            this.createLocationPickup(location));

        this.dataLoadedResolver_();
    }

    // Creates a new house location at |position| as issued by |player|. It will immediately become
    // available for purchase by any in-game player.
    async createLocation(player, position) {
        if (!player.isRegistered())
            throw new Error('The |player| must be registered in order to create a location.');

        const id = await this.database_.createLocation(player, position);
        const location = new HouseLocation({ id, position });

        this.locations_.add(location);
        this.createLocationPickup(location);
    }

    // Returns the location closest to the position of |player|. The |maximumDistance| argument can
    // be provided when it must be within a certain range of the player.
    async findClosestLocation(player, maximumDistance = null) {
        await this.dataLoadedPromise_;

        const position = player.position;

        let closestLocation = null;
        let closestDistance = Number.MAX_SAFE_INTEGER;

        this.locations_.forEach(location => {
            const distance = position.squaredDistanceTo(location.position);
            if (distance > closestDistance)
                return;

            closestLocation = location;
            closestDistance = distance;
        });

        if (maximumDistance !== null && closestDistance > (maximumDistance * maximumDistance))
            return null;  // the location is too far away

        return closestLocation;
    }

    // Removes the given house |location|, including the house tied to it, if any. This action can
    // only be reversed by someone with database access.
    async removeLocation(location) {
        if (!this.locations_.has(location))
            throw new Error('The |location| must be known to the HouseManager.');

        await this.database_.removeLocation(location);

        this.locations_.delete(location);

        for (const [pickup, pickupLocation] of this.locationPickups_.entries()) {
            if (pickupLocation !== location)
                continue;

            this.locationPickups_.delete(pickup);
            pickup.dispose();
            break;
        }
    }

    // Creates a pickup for the |location| and stores it in the pickup map.
    createLocationPickup(location) {
        const pickup = this.entities_.createPickup({
            position: location.position,
            modelId: location.isAvailable() ? 19524 /* yellow house */
                                            : 19902 /* yellow marker */
        });

        this.locationPickups_.set(pickup, location);
    }

    // Called when the |player| enters the |pickup|, which could be one of the houses created on the
    // server. In that case we either teleport them, or show them the information dialog.
    onPlayerEnterPickup(player, pickup) {
        const location = this.locationPickups_.get(pickup);
        if (!location)
            return;

        // TODO: Respond to the player entering the location's entrance.
    }

    dispose() {
        this.entities_.dispose();

        this.locationPickups_.clear();
        this.locations_.clear();

        server.pickupManager.removeObserver(this);
    }
}

exports = HouseManager;
