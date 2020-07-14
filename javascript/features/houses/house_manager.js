// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import HouseDatabase from 'features/houses/house_database.js';
import HouseEntranceController from 'features/houses/house_entrance_controller.js';
import HouseExtension from 'features/houses/house_extension.js';
import HouseInterior from 'features/houses/house_interior.js';
import HouseLocation from 'features/houses/house_location.js';
import HouseParkingLot from 'features/houses/house_parking_lot.js';
import HouseSettings from 'features/houses/house_settings.js';
import { HouseVehicle } from 'features/houses/house_vehicle.js';
import HouseVehicleController from 'features/houses/house_vehicle_controller.js';
import MockHouseDatabase from 'features/houses/test/mock_house_database.js';
import { ObjectGroup } from 'entities/object_group.js';

// The house manager orchestrates all details associated with housing, manages data and responds to
// player connection and disconnection events.
class HouseManager {
    constructor(announce, economy, friends, gangs, location, settings, streamer) {
        this.database_ = server.isTest() ? new MockHouseDatabase()
                                         : new HouseDatabase();

        this.dataLoadedPromise_ = new Promise(resolver =>
            this.dataLoadedResolver_ = resolver);

        this.observers_ = new Set();
        this.extensions_ = new Set();
        this.locations_ = new Set();
        this.userIds_ = new WeakMap();

        this.announce_ = announce;

        this.objects_ = ObjectGroup.create('data/objects/houses.json');

        // Responsible for all entrances and exits associated with the locations.
        this.entranceController_ =
            new HouseEntranceController(this, economy, friends, gangs, location);

        // Responsible for all vehicles associated with the houses.
        this.vehicleController_ = new HouseVehicleController(settings, streamer);

        // Start listening to player events when the House data has been loaded from the database.
        this.dataLoadedPromise_.then(() => {
            server.playerManager.addObserver(this, true /* replayHistory */);

            // Inform the house extensions of the fact that all data has been loaded.
            this.invokeExtensions('onLoaded');
        });
    }

    // Gets the instance of the database model class for the houses feature.
    get database() { return this.database_; }

    // Gets an iterator that can be used to iterate over the house locations.
    get locations() { return this.locations_.values(); }

    // Gets the number of house locations that have been made available.
    get locationCount() { return this.locations_.size; }

    // Gets a promise that is to be resolved when the feature is ready.
    get ready() { return this.dataLoadedPromise_; }

    // Gets the vehicle controller that manages house-associated vehicles.
    get vehicleController() { return this.vehicleController_; }

    // ---------------------------------------------------------------------------------------------

    // Registers |extension| as an extension feature of the housing system. It's safe to add the
    // |extension| multiple times, because the events will only be invoked once anyway.
    registerExtension(extension) {
        if (!(extension instanceof HouseExtension))
            throw new Error('Only objects derived from HouseExtension can be registered.');

        this.extensions_.add(extension);
    }

    // Removes the |extension| from the set of objects that will be informed about events. The
    // caller is expected to dispose the |extension| when the instance is no longer required.
    removeExtension(extension) {
        if (!(extension instanceof HouseExtension))
            throw new Error('Only objects derived from HouseExtension can be removed.');

        this.extensions_.delete(extension);
    }

    // Calls the |methodName| on all registered house extensions, in insertion order. Observers will
    // be called for the |methodName| as well, but all callback methods are optional.
    invokeExtensions(methodName, ...args) {
        for (const extension of this.extensions_)
            extension.__proto__[methodName].call(extension, ...args);
        
        for (const observer of this.observers_) {
            if (!(methodName in observer))
                continue;
            
            observer[methodName].call(observer, ...args);
        }
    }

    // ---------------------------------------------------------------------------------------------

    addObserver(observer) {
        this.observers_.add(observer);
    }

    removeObserver(observer) {
        this.observers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------

    // Loads all defined houses from the database to the house manager, creating the House instances
    // and associated objects where required.
    async loadHousesFromDatabase() {
        const locationMap = new Map();

        const locations = await this.database_.loadLocations();
        locations.forEach(([id, locationInfo]) => {
            const location = new HouseLocation(id, locationInfo);
            this.locations_.add(location);

            this.invokeExtensions('onLocationCreated', location);

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

            const houseSettings = new HouseSettings(house, location.parkingLotsMap);
            const houseInterior = new HouseInterior(house);  // TODO: Is this the right thing to do?

            // Associate the house's settings and interior with the |location|.
            location.setHouse(houseSettings, houseInterior);

            // Create the vehicles associated with the |location| in the vehicle controller.
            for (const vehicle of houseSettings.vehicles.values())
                this.vehicleController_.createVehicle(location, vehicle);

            this.invokeExtensions('onHouseCreated', location);
        });

        // Create entrances and exits for each of the known |locations_|.
        this.locations_.forEach(location =>
            this.entranceController_.addLocation(location));

        this.dataLoadedResolver_();
    }

    // Creates a new house location at |locationInfo| as issued by |player|. The |locationInfo| must
    // be an object having a {position, facingAngle, interiorId}.
    async createLocation(player, locationInfo) {
        if (!player.account.isRegistered())
            throw new Error('The |player| must be registered in order to create a location.');

        const id = await this.database_.createLocation(player, locationInfo);
        const location = new HouseLocation(id, locationInfo);

        this.locations_.add(location);
        this.entranceController_.addLocation(location);

        this.invokeExtensions('onLocationCreated', location);
        return location;
    }

    // Creates a new parking lot for |location| at |parkingLot|. The |player| will be written to
    // the database to attribute creation of the parking lot.
    async createLocationParkingLot(player, location, parkingLot) {
        if (!player.account.isRegistered())
            throw new Error('The |player| must be registered in order to create a parking lot.');

        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        const houseParkingLot = new HouseParkingLot({
            id: await this.database_.createLocationParkingLot(player, location, parkingLot),
            position: parkingLot.position,
            rotation: parkingLot.rotation,
            interiorId: parkingLot.interiorId
        });

        location.addParkingLot(houseParkingLot);
    }

    // Creates a new house in |location| owned by the |player|. The house interior of the house is
    // identified by |interiorId|, which must be included in the InteriorList.
    async createHouse(player, location, interiorId) {
        if (!player.account.isRegistered())
            throw new Error('The |player| must be registered in order to own a house.');

        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        if (!location.isAvailable())
            throw new Error('The given |location| already is occupied by another player.');

        const house = await this.database_.createHouse(player, location, interiorId);

        const houseSettings = new HouseSettings(house);
        const houseInterior = new HouseInterior(house);  // TODO: Is this the right thing to do?

        location.setHouse(houseSettings, houseInterior);

        this.entranceController_.updateLocation(location);

        this.invokeExtensions('onHouseCreated', location);
    }

    // ---------------------------------------------------------------------------------------------

    // Serializes the given |vehicle| for the |parkingLot| owned by |location|. If there is an
    // existing vehicle, it will be removed prior to saving the new one. Occupancy will be migrated.
    // The |vehicle| may ne NULL, which means that it should be removed altogether.
    async storeVehicle(location, parkingLot, vehicle) {
        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        if (!location.hasParkingLot(parkingLot))
            throw new Error('The given |parkingLot| does not belong to the |location|.');
        
        const houseVehicle = location.settings.vehicles.get(parkingLot);
        
        // Three options: (1) The |houseVehicle| has to be removed, (2) the |houseVehicle| has to
        // be updated, or (3) a new HouseVehicle has to be created.
        if (houseVehicle && !vehicle)
            await this.deleteVehicle(location, parkingLot, houseVehicle);
        else if (houseVehicle && vehicle)
            await this.updateVehicle(location, parkingLot, houseVehicle, vehicle);
        else if (!houseVehicle && vehicle)
            await this.createVehicle(location, parkingLot, vehicle);
    }

    // Called when the |vehicle| should be created in the |parkingLot| belonging to the given
    // |location|. It will be fully serialized before being stored.
    async createVehicle(location, parkingLot, vehicle) {
        const vehicleInfo = this.serializeVehicle(vehicle);
        const vehicleId = await this.database_.createVehicle(location, parkingLot, vehicleInfo);

        // Store the |vehicleId| on the |vehicleInfo|, so that it can be stored in the instance.
        vehicleInfo.id = vehicleId;

        const houseVehicle = new HouseVehicle(vehicleInfo, parkingLot);

        // Associate the |vehicle| with the vehicles created by the |location|'s house.
        location.settings.vehicles.set(parkingLot, houseVehicle);

        // Create the vehicle with the VehicleController.
        this.vehicleController_.createVehicle(location, houseVehicle);
    }

    // Called when the |houseVehicle| should be updated based on given |vehicle|.
    async updateVehicle(location, parkingLot, houseVehicle, vehicle) {
        const streamableVehicle = this.vehicleController_.getStreamableVehicle(houseVehicle);

        let occupants = new Map();
        let position = null;

        // (1) If the |streamableVehicle| exists and is live, it has to be removed. Store all the
        // occupants in the |occupants| map in case we want to put them back in the vehicle.
        if (streamableVehicle && streamableVehicle.live) {
            position = streamableVehicle.live.position;

            for (const player of streamableVehicle.live.getOccupants()) {
                occupants.set(player, player.vehicleSeat);

                // Teleport the player out of the vehicle. This will prevent them from showing up as
                // hidden later on: https://wiki.sa-mp.com/wiki/PutPlayerInVehicle.
                player.position = vehicle.position.translate({ z: 2 });
            }

            // Clear the list of occupants if the stored vehicle's model Id will change.
            if (streamableVehicle.modelId !== vehicle.modelId)
                occupants.clear();

            // Remove the |houseVehicle| from the vehicle controller altogether.
            this.vehicleController_.removeVehicle(location, houseVehicle);
        }

        const vehicleInfo = this.serializeVehicle(vehicle);

        // (2) Update the vehicle's information in the database. This will make sure that the
        // changes applied to the vehicle will persist between playing sessions.
        await this.database_.updateVehicle(houseVehicle, vehicleInfo);

        // (3) Apply the updated vehicle information to the |houseVehicle|.
        houseVehicle.applyVehicleInfo(vehicleInfo);

        // (4) Re-create the vehicle with the VehicleController, which will make it appear in the
        // world again. If there were |occupants|, we make sure they're put back in too.
        const updatedStreamableVehicle = this.vehicleController_.createVehicle(
            location, houseVehicle, /* immediate= */ true);

        if (!occupants.size || !updatedStreamableVehicle.live)
            return;  // no occupants, bail out

        wait(100).then(() => {
            if (!updatedStreamableVehicle.live)
                return;  // the vehicle has been removed since

            updatedStreamableVehicle.live.position = position;

            for (const [ player, seat ] of occupants) {
                if (player.isConnected())
                    player.enterVehicle(updatedStreamableVehicle.live, seat);
            }
        });
    }

    // Called when the |houseVehicle| should be removed from the given |location|.
    async deleteVehicle(location, parkingLot, houseVehicle) {
        await this.database_.removeVehicle(houseVehicle);

        // Remove the vehicle from the vehicle controller.
        this.vehicleController_.removeVehicle(location, houseVehicle);

        // Remove the vehicle from the house's svehicle settings.
        location.settings.vehicles.delete(parkingLot);
    }

    // Serializes the given |vehicle| in an object that's usable for the house vehicle system. If
    // you change the syntax here, you must change it in the HouseDatabase as well.
    serializeVehicle(vehicle) {
        return {
            modelId: vehicle.modelId,

            primaryColor: vehicle.primaryColor,
            secondaryColor: vehicle.secondaryColor,
            paintjob: vehicle.paintjob,

            components: vehicle.getComponents(),
        };
    }

    // ---------------------------------------------------------------------------------------------

    // Updates the |setting| of the |location| to |value|. The actual application of the setting
    // update is unique to the setting that is being changed. The following settings are available:
    //
    //     'access'  - Updates the access settings for the house.
    //     'marker'  - Updates the house's marker colour.
    //     'name'    - Updates the name of the house.
    //     'spawn'   - Updates whether to spawn at the |location|.
    //     'stream'  - Updates the audio stream URL for the |location|.
    //     'welcome' - Updates the welcome message of the house.
    //
    // Updating an invalid setting will yield an exception.
    async updateHouseSetting(player, location, setting, value) {
        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        if (location.isAvailable())
            throw new Error('The given |location| does not have an house associated with it.');

        switch (setting) {
            case 'access':
                if (typeof value !== 'number' || value < HouseSettings.ACCESS_EVERYBODY ||
                        value > HouseSettings.ACCESS_PERSONAL) {
                    throw new Error('A house access level must be one of HouseSettings.ACCESS_*.');
                }

                await this.database_.updateHouseAccess(location, value);

                const readableAccess = HouseSettings.getReadableAccess(value);
                this.announce_().announceToAdministrators(Message.HOUSE_ANNOUNCE_ACCESS_CHANGED, 
                    player.name, player.id, location.settings.name, location.settings.id, readableAccess);
                
                location.settings.access = value;
                break;

            case 'marker':
                if (typeof value !== 'string' || !['yellow', 'red', 'green', 'blue'].includes(value))
                    throw new Error('A given marker color is not valid.');

                await this.database_.updateHouseMarkerColor(location, value);
                await this.entranceController_.updateLocationSetting(location, 'color', value);

                this.announce_().announceToAdministrators(Message.HOUSE_ANNOUNCE_MARKER_CHANGED, 
                    player.name, player.id, location.settings.name, location.settings.id, value);

                location.settings.markerColor = value;
                break;

            case 'name':
                if (typeof value !== 'string' || value.length < 3 || value.length > 32)
                    throw new Error('A house name must be between 3 and 32 characters in length.');

                await this.database_.updateHouseName(location, value);
                await this.entranceController_.updateLocationSetting(location, 'label', value);
                
                this.announce_().announceToAdministrators(Message.HOUSE_ANNOUNCE_RENAMED, 
                    player.name, player.id, location.settings.name, location.settings.id, value);

                location.settings.name = value;
                break;

            case 'spawn':
                if (typeof value !== 'boolean')
                    throw new Error('The value of updating the spawn setting must be a boolean.');

                await this.database_.updateHouseSpawn(location, value);

                // Remove the spawn setting from all existing houses owned by the player.
                this.getHousesForUser(location.settings.ownerId).forEach(ownedLocation =>
                    ownedLocation.settings.setSpawn(false));
                
                if(value){
                    this.announce_().announceToAdministrators(Message.HOUSE_ANNOUNCE_SPAWN_CHANGED, 
                        player.name, player.id, location.settings.name, location.settings.id);    
                } else {
                    this.announce_().announceToAdministrators(Message.HOUSE_ANNOUNCE_SPAWN_REMOVED, 
                        player.name, player.id, location.settings.name, location.settings.id);                    
                }

                location.settings.setSpawn(value);
                break;

            case 'stream':
                if (typeof value !== 'string' || value.length > 255)
                    throw new Error('An audio stream URL must be at most 255 characters in length.');

                await this.database_.updateHouseStreamUrl(location, value);
                
                this.announce_().announceToAdministrators(Message.HOUSE_ANNOUNCE_AUDIO_STREAM_CHANGED, 
                    player.name, player.id, location.settings.name, location.settings.id, value);

                location.settings.streamUrl = value;
                break;

            case 'welcome':
                if (typeof value !== 'string' || value.length > 100)
                    throw new Error('A welcome message must be at most 100 characters in length.');

                await this.database_.updateHouseWelcomeMessage(location, value);

                this.announce_().announceToAdministrators(Message.HOUSE_ANNOUNCE_SET_WELCOME_MESSAGE, 
                    player.name, player.id, location.settings.name, location.settings.id, value);
                
                location.settings.welcomeMessage = value;
                break;

            default:
                throw new Error('Invalid setting: ' + setting);
        }
    }

    // Returns the location closest to the position of |player|. The |maximumDistance| argument can
    // be provided when it must be within a certain range of the player. Players inside of a house
    // are deliberately not considered to be close to it.
    async findClosestLocation(player, { maximumDistance = null, ignoreAvailable = false } = {}) {
        await this.dataLoadedPromise_;

        const position = player.position;

        let closestLocation = null;
        let closestDistance = Number.MAX_SAFE_INTEGER;

        this.locations_.forEach(location => {
            if (ignoreAvailable && location.isAvailable())
                return;

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

    // Attempts to force-enter the |player| into |location|. They do not have to presently be there.
    forceEnterHouse(player, location) {
        this.entranceController_.enterHouse(player, location);
    }

    // Forces the |player| to exit the |location|. They do not have to presently be in there.
    forceExitHouse(player, location) {
        this.entranceController_.exitHouse(player, location);
    }

    // Returns the house location the |player| is currently standing in. May return NULL.
    getCurrentLocationForPlayer(player) {
        return this.entranceController_.getCurrentLocationForPlayer(player);
    }

    // Returns the house that the |player| is currently standing in. May return NULL.
    getCurrentHouseForPlayer(player) {
        return this.entranceController_.getCurrentHouseForPlayer(player);
    }

    // Returns the houses owned by |player|. Assumes that the data has been loaded already.
    getHousesForPlayer(player, userId = null) {
        return this.getHousesForUser(userId ?? player.account.userId);
    }

    // Returns the houses owned by |userId|. Assumes that the data has been loaded already.
    getHousesForUser(userId) {
        const houses = [];

        this.locations_.forEach(location => {
            if (location.isAvailable() || location.settings.ownerId !== userId)
                return;

            houses.push(location);
        });

        return houses;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the maximum number of houses the |player| is allowed to own.
    getMaximumHouseCountForPlayer(player) {
        if (player.isManagement())
            return 100;

        if (player.isVip())
            return 3;

        return 1;
    }

    // Returns the minimum distance, in units, between the houses owned by the |player|.
    getMinimumHouseDistance(player) {
        if (player.isManagement())
            return 5;

        return 500;
    }

    // ---------------------------------------------------------------------------------------------


    // Removes the given house |location|, including the house tied to it, if any. This action can
    // only be reversed by someone with database access.
    async removeLocation(location) {
        if (!this.locations_.has(location))
            throw new Error('The |location| must be known to the HouseManager.');

        if (!location.isAvailable())
            await this.removeHouse(location);

        this.invokeExtensions('onLocationRemoved', location);

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

        // Remove the associated vehicle if both the location and the parking lot are occupied.
        if (!location.isAvailable()) {
            for (const [associatedParkingLot, vehicle] of location.settings.vehicles) {
                if (associatedParkingLot != parkingLot)
                    continue;

                // Remove the vehicle from the database.
                await this.database_.removeVehicle(vehicle);

                // Remove the vehicle from the vehicle controller.
                this.vehicleController_.removeVehicle(location, vehicle);

                // Remove the vehicle from the house's svehicle settings.
                location.settings.vehicles.delete(associatedParkingLot);
                break;
            }
        }

        location.removeParkingLot(parkingLot);
    }

    // Removes the house from |location|. Any players currently in the house will be forcefully
    // respawned into the main world.
    async removeHouse(location) {
        if (!this.locations_.has(location))
            throw new Error('The given |location| does not exist in this HouseManager.');

        if (location.isAvailable())
            throw new Error('The given |location| is not currently occupied.');

        this.invokeExtensions('onHouseRemoved', location);

        // Forcefully remove all players that are currently in the locations to go outside.
        server.playerManager.forEach(player => {
            if (this.entranceController_.getCurrentHouseForPlayer(player) === location)
                this.entranceController_.exitHouse(player);
        });

        await this.database_.removeHouse(location);

        location.removeHouse();

        this.entranceController_.updateLocation(location);
        this.vehicleController_.removeVehiclesForLocation(location);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has logged in to their account. Will check whether house names have
    // to be updated (in case the player changed their nickname).
    async onPlayerLogin(player) {
        this.userIds_.set(player, player.account.userId);

        if (player.isUndercover())
            return;  // skip this update when the |player| is undercover

        for (const location of this.getHousesForPlayer(player)) {
            location.settings.owner = player;

            if (location.settings.ownerName == player.name)
                continue;

            location.settings.ownerName = player.name;

            // Make sure that the updated name is reflected on their entrance.
            await this.entranceController_.updateLocationSetting(
                location, 'label', location.settings.name);
        }
    }

    // Called when the |player| has disconnected from the server. If they own houses, the owner
    // properties of their houses will be set to NULL again.
    onPlayerDisconnect(player) {
        for (const location of this.getHousesForPlayer(player, this.userIds_.get(player)))
            location.settings.owner = null;
        
        this.userIds_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.entranceController_.dispose();
        this.vehicleController_.dispose();

        for (const location of this.locations_)
            location.dispose();

        this.locations_.clear();

        for (const extension of this.extensions_)
            extension.dispose();

        this.objects_.dispose();
        this.objects_ = null;

        this.extensions_.clear();
    }
}

export default HouseManager;
