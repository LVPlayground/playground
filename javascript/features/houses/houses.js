// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const HouseManager = require('features/houses/house_manager.js');

// Houses are points on the map that players may purchase and then call their house. While the
// house points have to be determined by administrators, players can select their own interior, get
// the ability to personalize their house and create a spawn vehicle.
class Houses extends Feature {
    constructor() {
        super();

        this.manager_ = new HouseManager();
        this.manager_.loadHousesFromDatabase();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the houses feature.
    // ---------------------------------------------------------------------------------------------

    // TODO(Russell): Define the houses API.

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.manager_.dispose();
    }
}

exports = Houses;
