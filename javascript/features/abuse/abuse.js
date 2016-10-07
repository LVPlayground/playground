// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');

// Implementation of the feature that keep track of whether a player is abusing.
class Abuse extends Feature {
    constructor() {
        super();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Abuse feature.

    // Returns whether the |player| is allowed to teleport right now.
    canTeleport(player) {
        return true;
    }

    // Returns whether the |player| is allowed to spawn a vehicle right now.
    canSpawnVehicle(player) {
        return true;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = Abuse;
