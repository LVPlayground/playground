// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import HouseCommands from 'features/houses/house_commands.js';
import HouseManager from 'features/houses/house_manager.js';
import HouseNatives from 'features/houses/house_natives.js';

import GangZones from 'features/houses/extensions/gang_zones.js';
import Pickups from 'features/houses/extensions/pickups.js';
import PropertySettings from 'features/houses/extensions/property_settings.js';
import VisitorLog from 'features/houses/extensions/visitor_log.js';

// Houses are points on the map that players may purchase and then call their house. While the
// house points have to be determined by administrators, players can select their own interior, get
// the ability to personalize their house and create a spawn vehicle.
class Houses extends Feature {
    constructor() {
        super();

        // Determines whether a player is allowed to teleport into a house right now.
        const abuse = this.defineDependency('abuse');

        // Various actions will result in announcements being made to administrators.
        const announce = this.defineDependency('announce');

        // House pricing is determined using a predefined set of algorithms.
        const economy = this.defineDependency('economy');

        // Friends and gangs can influence the access rules of particular houses.
        const friends = this.defineDependency('friends');
        const gangs = this.defineDependency('gangs');

        // Portals from the Location feature will be used for house entrances and exits.
        const location = this.defineDependency('location');

        // The `/house` command is currently restricted to Management.
        const playground = this.defineDependency('playground');

        // The streamer will be used for creation of house vehicles.
        const streamer = this.defineDependency('streamer');

        this.manager_ = new HouseManager(abuse, announce, economy, friends, gangs, location, streamer);

        this.manager_.registerExtension(new GangZones(this.manager_, economy, gangs));
        this.manager_.registerExtension(new PropertySettings(this.manager_));
        this.manager_.registerExtension(new Pickups(this.manager_, economy, streamer));
        this.manager_.registerExtension(new VisitorLog(this.manager_));

        this.manager_.loadHousesFromDatabase();

        this.commands_ = new HouseCommands(
            this.manager_, abuse, announce, economy, location, playground);

        this.natives_ = new HouseNatives(this.manager_);
    }

    // ---------------------------------------------------------------------------------------------
    // The Houses feature has no public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.natives_.dispose();
        this.commands_.dispose();

        this.manager_.dispose();
    }
}

export default Houses;
