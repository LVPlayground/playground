// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import HouseCommands from 'features/houses/house_commands.js';
import HouseManager from 'features/houses/house_manager.js';
import HouseNatives from 'features/houses/house_natives.js';

import Pickups from 'features/houses/extensions/pickups.js';
import PropertySettings from 'features/houses/extensions/property_settings.js';
import VisitorLog from 'features/houses/extensions/visitor_log.js';

// Houses are points on the map that players may purchase and then call their house. While the
// house points have to be determined by administrators, players can select their own interior, get
// the ability to personalize their house and create a spawn vehicle.
class Houses extends Feature {
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

        // The `/house` command is currently restricted to Management.
        const playground = this.defineDependency('playground');

        // Certain things about houses can be configured with "/lvp settings".
        const settings = this.defineDependency('settings');

        // The streamer will be used for creation of house vehicles.
        const streamer = this.defineDependency('streamer');

        this.manager_ = new HouseManager(
            announce, economy, friends, gangs, limits, location, settings, streamer);

        this.manager_.registerExtension(new PropertySettings(this.manager_));
        this.manager_.registerExtension(new Pickups(this.manager_, economy, finance));
        this.manager_.registerExtension(new VisitorLog(this.manager_));

        this.manager_.loadHousesFromDatabase();

        this.commands_ = new HouseCommands(
            this.manager_, announce, economy, finance, limits, location, playground);

        this.natives_ = new HouseNatives(this.manager_);
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
        this.natives_.dispose();
        this.commands_.dispose();

        this.manager_.dispose();
    }
}

export default Houses;
