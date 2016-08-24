// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const HouseCommands = require('features/houses/house_commands.js');
const HouseManager = require('features/houses/house_manager.js');

// Houses are points on the map that players may purchase and then call their house. While the
// house points have to be determined by administrators, players can select their own interior, get
// the ability to personalize their house and create a spawn vehicle.
class Houses extends Feature {
    constructor() {
        super();

        // Various actions will result in announcements being made to administrators.
        const announce = this.defineDependency('announce', true /* isFunctional */);

        // House pricing is determined using a predefined set of algorithms.
        const economy = this.defineDependency('economy', true /* isFunctional */);

        // Friends of the owner are always allowed to enter the house.
        const friends = this.defineDependency('friends', true /* isFunctional */);

        // Portals from the Location feature will be used for house entrances and exits.
        const location = this.defineDependency('location', true /* isFunctional */);

        this.manager_ = new HouseManager(economy, friends, location);
        this.manager_.loadHousesFromDatabase();

        this.commands_ = new HouseCommands(this.manager_, announce, economy);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the houses feature.
    // ---------------------------------------------------------------------------------------------

    // TODO(Russell): Define the houses API.

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
    }
}

exports = Houses;
