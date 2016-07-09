// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');

// The house entrance controller is responsible for the entrances associated with each of the house
// locations, regardless of whether the location has been occupied.
class HouseEntranceController {
    constructor(entities) {
        this.entities_ = new ScopedEntities();

        // Maps providing mappings from location to pickup, and from pickup to location.
        this.locations_ = new Map();
        this.pickups_ = new Map();

        server.pickupManager.addObserver(this);
    }

    // Adds |location| to the set of locations to be tracked by the entrance controller. It will
    // create both the exterior entrances for the |location|, and when occupied, the interior exits.
    addLocation(location) {
        const pickup = this.entities_.createPickup({
            position: location.position,
            modelId: location.isAvailable() ? 19524 /* yellow house */
                                            : 19902 /* yellow marker */
        });

        this.locations_.set(location, pickup);
        this.pickups_.set(pickup, location);
    }

    // Removes |location| from the set of tracked locations. All entrances will be removed.
    removeLocation(location) {
        const pickup = this.locations_.get(location);
        if (!pickup)
            throw new Error('An invalid |location| is being removed from the entrance controller.');

        this.locations_.delete(location);
        this.pickups_.delete(pickup);

        pickup.dispose();
    }

    // Called when the |player| enters the |pickup|, which could be one of the houses created on the
    // server. In that case we either teleport them, or show them the information dialog.
    onPlayerEnterPickup(player, pickup) {
        const location = this.pickups_.get(pickup);
        if (!location)
            return;

        // TODO: Respond to the player entering the location's entrance.
        console.log('Entered location #' + location.id);
    }

    dispose() {
        server.pickupManager.removeObserver(this);

        this.entities_.dispose();
    }
}

exports = HouseEntranceController;
