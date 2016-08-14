// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseDatabase = require('features/houses/house_database.js');
const HouseEntranceController = require('features/houses/house_entrance_controller.js');
const HouseInterior = require('features/houses/house_interior.js');
const HouseLocation = require('features/houses/house_location.js');
const HouseParkingLot = require('features/houses/house_parking_lot.js');
const HouseSettings = require('features/houses/house_settings.js');

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

    // Gets an iterator that can be used to iterate over the house locations.
    get locations() { return this.locations_.values(); }

    // Gets the number of house locations that have been made available.
    get locationCount() { return this.locations_.size; }

    // Loads all defined houses from the database to the house manager, creating the House instances
    // and associated objects where required.
    async loadHousesFromDatabase() {
        const locationMap = new Map();

        const locations = await this.database_.loadLocations();
        locations.forEach(locationInfo => {
            const location = new HouseLocation(locationInfo);
            this.locations_.add(location);

            locationMap.set(location.id, location);
        });

        const houses = await this.database_.loadHouses();
        houses.forEach((house, locationId) => {
            const location = locationMap.get(locationId);
            if (!location) {
                console.log(
                    'Warning: Unassociated house (' + house.id + ') for location #' + locationId);
                return;
            }

            if (!location.isAvailable()) {
                console.log(
                    'Warning: Duplicated houses (' + house.id + ') for location #' + locationId);
                return;
            }

            const houseSettings = new HouseSettings(house);
            const houseInterior = new HouseInterior(house);  // TODO: Is this the right thing to do?

            location.setHouse(houseSettings, houseInterior);
        });

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

    // Creates a new parking lot for |location| at |parkingLot|. The |player| will be written to
    // the database to attribute creation of the parking lot.
    async createLocationParkingLot(player, location, parkingLot) {
        if (!player.isRegistered())
            throw new Error('The |player| must be registered in order to create a parking lot.');

        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        const houseParkingLot = new HouseParkingLot({
            id: await this.database_.createLocationParkingLot(player, location, parkingLot),
            position: parkingLot.position,
            rotation: parkingLot.rotation
        });

        location.addParkingLot(houseParkingLot);
    }

    // Creates a new house in |location| owned by the |player|. The house interior of the house is
    // identified by |interiorId|, which must be included in the InteriorList.
    async createHouse(player, location, interiorId) {
        if (!player.isRegistered())
            throw new Error('The |player| must be registered in order to own a house.');

        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        if (!location.isAvailable())
            throw new Error('The given |location| already is occupied by another player.');

        const house = await this.database_.createHouse(player, location, interiorId);

        const houseSettings = new HouseSettings(house);
        const houseInterior = new HouseInterior(house);  // TODO: Is this the right thing to do?

        location.setHouse(houseSettings, houseInterior);
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

    // Returns the house location the |player| is currently standing in. May return NULL.
    getCurrentLocationForPlayer(player) {
        return this.entranceController_.getCurrentLocationForPlayer(player);
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

    // Removes the |parkingLot| from the |location|. If the location is currently occupied and a
    // vehicle exists in the slot, it will be removed without warning to the owner.
    async removeLocationParkingLot(location, parkingLot) {
        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        if (!location.hasParkingLot(parkingLot))
            throw new Error('The given |parkingLot| does not belong to the |location|.');

        await this.database_.removeLocationParkingLot(parkingLot);

        // TODO: Remove the vehicle stored on this parking lot if the house is occupied.

        location.removeParkingLot(parkingLot);
    }

    // Removes the house from |location|. Any players currently in the house will be forcefully
    // respawned into the main world.
    async removeHouse(location) {
        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        if (location.isAvailable())
            throw new Error('The given |location| is not currently occupied.');

        await this.database_.removeHouse(location);

        location.removeHouse();
    }

    dispose() {
        this.entranceController_.dispose();

        for (const location of this.locations_)
            location.dispose();

        this.locations_.clear();
    }
}

exports = HouseManager;
