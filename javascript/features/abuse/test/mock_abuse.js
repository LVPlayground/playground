// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');

// Mocked implementation of the Abuse feature that can be influenced by tests.
class MockAbuse extends Feature {
    constructor() {
        super();

        this.disableTeleport_ = new WeakSet();
        this.disableSpawnVehicle_ = new WeakSet();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Abuse feature.

    // Returns whether the |player| is allowed to teleport right now.
    canTeleport(player) {
        return !this.disableTeleport_.has(player);
    }

    // Returns whether the |player| is allowed to spawn a vehicle right now.
    canSpawnVehicle(player) {
        return !this.disableSpawnVehicle_.has(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Toggles whether |player| can teleport. Only available for tests.
    toggleTeleportForTests(player, enabled) {
        if (enabled)
            this.disableTeleport_.delete(player);
        else
            this.disableTeleport_.add(player);
    }

    // Toggles whether |player| can spawn a vehicle. Only avaiable for tests.
    toggleSpawnVehicleForTests(player, enabled) {
        if (enabled)
            this.disableSpawnVehicle_.delete(player);
        else
            this.disableSpawnVehicle_.add(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = MockAbuse;
