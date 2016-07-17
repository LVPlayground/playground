// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseDatabase = require('features/houses/house_database.js');
const HouseEntranceController = require('features/houses/house_entrance_controller.js');
const HouseLocation = require('features/houses/house_location.js');

// The house manager orchestrates all details associated with housing, manages data and responds to
// player connection and disconnection events.
class HouseManager {
    constructor(economy) {
        this.database_ = new HouseDatabase();
        this.dataLoadedPromise_ = new Promise(resolver =>
            this.dataLoadedResolver_ = resolver);

        this.locations_ = new Set();

        // Responsible for all entrances and exits associated with the locations.
        this.entranceController_ = new HouseEntranceController(this, economy);
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

        // Create entrances and exits for each of the known |locations_|.
        this.locations_.forEach(location =>
            this.entranceController_.addLocation(location));

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
        this.entranceController_.addLocation(location);
    }

    // Returns the location closest to the position of |player|. The |maximumDistance| argument can
    // be provided when it must be within a certain range of the player.
    async findClosestLocation(player, maximumDistance = null) {
        await this.dataLoadedPromise_;

        // TODO: Return the current house if the |player| happens to be in one.

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

    // Returns the house owned by |player|. Assumes that the data has been loaded already.
    getHouseForPlayer(player) {
        return null;
    }

    // Removes the given house |location|, including the house tied to it, if any. This action can
    // only be reversed by someone with database access.
    async removeLocation(location) {
        if (!this.locations_.has(location))
            throw new Error('The |location| must be known to the HouseManager.');

        await this.database_.removeLocation(location);

        this.locations_.delete(location);
        this.entranceController_.removeLocation(location);
    }

    dispose() {
        this.entranceController_.dispose();
        this.locations_.clear();
    }
}

exports = HouseManager;
