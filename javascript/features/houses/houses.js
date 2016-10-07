// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const HouseCommands = require('features/houses/house_commands.js');
const HouseManager = require('features/houses/house_manager.js');
const HouseNatives = require('features/houses/house_natives.js');

const PropertySettings = require('features/houses/extensions/property_settings.js');
const VisitorLog = require('features/houses/extensions/visitor_log.js');

// Houses are points on the map that players may purchase and then call their house. While the
// house points have to be determined by administrators, players can select their own interior, get
// the ability to personalize their house and create a spawn vehicle.
class Houses extends Feature {
    constructor() {
        super();

        // Determines whether a player is allowed to teleport into a house right now.
        const abuse = this.defineDependency('abuse', true /* isFunctional */);

        // Various actions will result in announcements being made to administrators.
        const announce = this.defineDependency('announce', true /* isFunctional */);

        // House pricing is determined using a predefined set of algorithms.
        const economy = this.defineDependency('economy', true /* isFunctional */);

        // Friends and gangs can influence the access rules of particular houses.
        const friends = this.defineDependency('friends', true /* isFunctional */);
        const gangs = this.defineDependency('gangs', true /* isFunctional */);

        // Portals from the Location feature will be used for house entrances and exits.
        const location = this.defineDependency('location', true /* isFunctional */);

        // The `/house` command is currently restricted to Management.
        const playground = this.defineDependency('playground', true /* isFunctional */);

        // The streamer will be used for creation of house vehicles.
        const streamer = this.defineDependency('streamer', true /* isFunctional */);

        this.manager_ = new HouseManager(abuse, economy, friends, gangs, location, streamer);
        this.manager_.registerExtension(new PropertySettings(this.manager_));
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

exports = Houses;
