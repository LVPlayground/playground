// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import HouseCommands from 'features/houses/house_commands.js';
import HouseManager from 'features/houses/house_manager.js';
import HouseNatives from 'features/houses/house_natives.js';
import { HouseVehicleCommands } from 'features/houses/house_vehicle_commands.js';

import Pickups from 'features/houses/extensions/pickups.js';
import PropertySettings from 'features/houses/extensions/property_settings.js';
import VisitorLog from 'features/houses/extensions/visitor_log.js';

// Houses are points on the map that players may purchase and then call their house. While the
// house points have to be determined by administrators, players can select their own interior, get
// the ability to personalize their house and create a spawn vehicle.
class Houses extends Feature {
    vehicles_ = null;

    commands_ = null;
    manager_ = null;
    natives_ = null;

    vehicleCommands_ = null;

    constructor() {
        super();

        // Various actions will result in announcements being made to administrators.
        const announce = this.defineDependency('announce');

        // House pricing is determined using a predefined set of algorithms.
        const economy = this.defineDependency('economy');

        // Used to interact with the bank accounts owned by individual players.
        const finance = this.defineDependency('finance');

        // Friends and gangs can influence the access rules of particular houses.
        const friends = this.defineDependency('friends');
        const gangs = this.defineDependency('gangs');

        // Determines whether a player is allowed to teleport to their house.
        const limits = this.defineDependency('limits');

        // Portals from the Location feature will be used for house entrances and exits.
        const location = this.defineDependency('location');

        // Certain things about houses can be configured with "/lvp settings".
        const settings = this.defineDependency('settings');

        // The streamer will be used for creation of house vehicles.
        const streamer = this.defineDependency('streamer');

        // The vehicle feature is used for a delegate enabling vehicle modification.
        this.vehicles_ = this.defineDependency('vehicles');
        this.vehicles_.addReloadObserver(this, () => this.createVehicleCommandDelegate());

        this.manager_ = new HouseManager(
            announce, economy, friends, gangs, location, settings, streamer);

        this.manager_.registerExtension(new PropertySettings(this.manager_));
        this.manager_.registerExtension(new Pickups(this.manager_, economy, finance));
        this.manager_.registerExtension(new VisitorLog(this.manager_));

        this.manager_.loadHousesFromDatabase();

        this.commands_ = new HouseCommands(
            this.manager_, announce, economy, finance, limits, location);

        this.natives_ = new HouseNatives(this.manager_);

        // Create the vehicle command delegate, intercepting "/v save" commands.
        this.createVehicleCommandDelegate();
    }

    // Creates the VehicleCommandDelegate instance for the house feature, which allows us to partake
    // in decisions about saving vehicles on player accounts.
    createVehicleCommandDelegate() {
        // (1) Create the HouseVehicleCommands instance. It needs the HouseManager.
        this.vehicleCommands_ = new HouseVehicleCommands(this.manager_);

        // (2) Register it as a command delegate with the Vehicles feature.
        this.vehicles_().addCommandDelegate(this.vehicleCommands_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API for the Houses feature.
    // ---------------------------------------------------------------------------------------------

    // Returns the HouseLocation objects that exist on the server. Will wait for the Manager and all
    // associated information to be available before returning.
    async getLocations() {
        await this.manager_.ready;
        return this.manager_.locations;
    }

    // Adds the given |observer| to the list of listeners for house-related events. The following
    // events will propagate to each of the observers:
    //
    //     onHouseCreated(location)
    //     onHouseRemoved(location)
    //
    async addObserver(observer) {
        this.manager_.addObserver(observer);
    }

    // Removes the given |observer| from the list of observers.
    async removeObserver(observer) {
        this.manager_.removeObserver(observer);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.vehicles_().removeCommandDelegate(this.vehicleCommands_);

        this.vehicles_.removeReloadObserver(this);
        this.vehicles_ = null;

        this.natives_.dispose();
        this.commands_.dispose();
        this.manager_.dispose();
    }
}

export default Houses;
