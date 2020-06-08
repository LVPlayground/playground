// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PriorityQueue from 'base/priority_queue.js';

// Responsible for keeping track of used vehicles, and whether (and when) they should respawn. All
// vehicles known to this object will be kept alive beyond streaming availability.
export class VehicleRespawnManager {
    respawnQueue_ = null;
    vehicles_ = null;

    constructor() {
        // Creates the queue of vehicles which we might have to respawn. Automatically ordered in
        // ascending order based on last usage time, which means that earlier entries are closer to
        // being deleted by the server. Exercised by the `select()` method.
        this.respawnQueue_ = new PriorityQueue((lhs, rhs) => {
            return 0;
        });

        // Set of the vehicles that are part of this manager, to allow for fast lookup.
        this.vehicles_ = new Set();
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the |streamableVehicle| to the respawn manager, indicating that it's being used and
    // should be kept alive beyond the time that it spends within streaming range.
    add(streamableVehicle) {}

    // Returns whether the |streamableVehicle| is co-owned by the respawn manager.
    has(streamableVehicle) { return this.vehicles_.has(streamableVehicle); }

    // Deletes the |streamableVehicle| from the respawn manager. We'll stop keeping it alive.
    delete(streamableVehicle) {}

    // ---------------------------------------------------------------------------------------------

    // Returns a Set of StreamableVehicle instances that are due a respawn. They will no longer be
    // known to this class after having been returned by this method.
    getVehiclesToRespawn() { return new Set(); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.respawnQueue_.clear();
        this.respawnQueue_ = null;

        this.vehicles_.clear();
        this.vehicles_ = null;
    }
}
