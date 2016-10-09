// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Abuse = require('features/abuse/abuse.js');

// Mocked implementation of the Abuse feature that can be influenced by tests.
class MockAbuse extends Abuse {
    constructor() {
        super();

        this.disableTeleport_ = new WeakMap();
        this.disableSpawnVehicle_ = new WeakMap();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Abuse feature.

    // Returns whether the |player| is allowed to teleport right now.
    canTeleport(player) {
        if (this.disableTeleport_.has(player))
            return this.disableTeleport_.get(player);

        return super.canTeleport(player);
    }

    // Returns whether the |player| is allowed to spawn a vehicle right now.
    canSpawnVehicle(player) {
        if (this.disableSpawnVehicle_.has(player))
            return this.disableSpawnVehicle_.get(player);

        return super.canSpawnVehicle(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Toggles whether |player| can teleport. Only available for tests.
    toggleTeleportForTests(player, enabled) {
        this.disableTeleport_.set(player, enabled);
    }

    // Toggles whether |player| can spawn a vehicle. Only avaiable for tests.
    toggleSpawnVehicleForTests(player, enabled) {
        this.disableSpawnVehicle_.set(player, enabled);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = MockAbuse;
