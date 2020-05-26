// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PickupManager, PickupPositionValidDistanceSq } from 'entities/pickup_manager.js';

// Class that extends the PickupManager with a utility method enabling pickup pick-ups to be
// automatically triggered when updating the position of a mocked entity.
export class MockPickupManager extends PickupManager {
    // Reports that the position of the |player| has changed. Pickup entries will be faked when
    // their new position happens to be within a pickup.
    onPlayerPositionChanged(player) {
        const position = player.position;
        const results = [];

        for (const pickup of this.pickups_.values()) {
            const squaredDistance = position.squaredDistanceTo(pickup.position);
            if (squaredDistance > PickupPositionValidDistanceSq)
                continue;

            results.push({ squaredDistance, pickup });
        }

        if (!results.length)
            return;  // no pickups are considered to be in-range for their new position

        // Sort the in-range pickups by distance, so that we can select the closest one.
        results.sort((lhs, rhs) => {
            if (lhs.squaredDistance === rhs.squaredDistance)
                return 0;

            return lhs.squaredDistance > rhs.squaredDistance ? 1 : -1;
        });

        // Remove the current position info, this is not relevant in tests.
        this.currentPickupForPlayer_.delete(player);

        // Fake an `OnPlayerPickUpPickup` event for the closest pickup to the player.
        super.onPickupPickedUp({
            playerid: player.id,
            pickupid: results[0].pickup.id
        });
    }
}
