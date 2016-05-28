// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The pickup manager maintains the list of pickups created for Las Venturas Playground, and is in
// charge of delegating events related to those pickups.
class PickupManager {
    constructor(pickupConstructor = Pickup) {
        this.pickupConstructor_ = pickupConstructor;
        this.pickups_ = new Set();
    }

    // Gets the number of pickups currently created on the server.
    get count() { return this.pickups_.size; }

    // Creates a new pickup with the given options. The |modelId| and |position| are required, all
    // other arguments may optionally be supplied. Pickups are immutable after creation.
    createPickup({ modelId, position, type = Pickup.TYPE_PERSISTENT, virtualWorld = 0 } = {}) {
        const pickup = new this.pickupConstructor_(this, modelId, type, position, virtualWorld);
        this.pickups_.add(pickup);

        return pickup;
    }

    // Removes the |pickup| from the maintained set of pickups. Should only be used by the Pickup
    // implementation to inform the manager about their disposal.
    didDisposePickup(pickup) {
        if (!this.pickups_.has(pickup))
            throw new Error('Attempting to dispose an invalid pickup: ' + pickup);

        this.pickups_.delete(pickup);
    }

    // Removes all existing pickups from the server.
    dispose() {
        this.pickups_.forEach(pickup => pickup.dispose());

        if (this.pickups_.size != 0)
            throw new Error('There are remaining pickups after disposing all of them.');
    }
}

exports = PickupManager;
