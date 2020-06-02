// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Pickup } from 'entities/pickup.js';

// Global Pickup counter used for testing.
let globalPickupId = 0;

// Mocked version of the Pickup class that avoids hitting the actual server. Used for testing.
// Provides some utility functions to mimick behaviour that might be seen in the wild.
export class MockPickup extends Pickup {
    createInternal(options) { return ++globalPickupId; }
    destroyInternal() {}

    // ---------------------------------------------------------------------------------------------

    // Utility function, only available for testing, that fakes as if the |player| entered this
    // pickup. It should cause observers to receive the onPlayerEnterPickup event.
    pickUpByPlayer(player) {
        server.pickupManager.onPickupPickedUp({
            playerid: player.id,
            pickupid: this.id
        });
    }
}
