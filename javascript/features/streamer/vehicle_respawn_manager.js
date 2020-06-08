// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PriorityQueue from 'base/priority_queue.js';

// Responsible for keeping track of used vehicles, and whether (and when) they should respawn. All
// vehicles known to this object will be kept alive beyond streaming availability.
export class VehicleRespawnManager {
    respawnQueue_ = null;
    settings_ = null;
    vehicles_ = null;

    constructor(settings) {
        this.settings_ = settings;

        // Map of the vehicles that are part of this manager, to allow for fast lookup and to store
        // the most recent usage time of the vehicle.
        this.vehicles_ = new Map();

        // Creates the queue of vehicles which we might have to respawn. Automatically ordered in
        // ascending order based on last usage time, which means that earlier entries are closer to
        // being deleted by the server. Exercised by the `select()` method.
        this.respawnQueue_ = new PriorityQueue((lhs, rhs) => {
            const lhsTime = this.vehicles_.get(lhs);
            const rhsTime = this.vehicles_.get(rhs);

            if (lhsTime === rhsTime)
                return 0;

            return lhsTime > rhsTime ? 1 : -1;
        });
    }

    // Gets the respawn delay for ephemeral vehicles, in seconds. This is configurable through the
    // "/lvp settings" command, but changes only apply to newly created vehicles.
    get ephemeralVehicleRespawnDelay() {
        return this.settings_().getValue('vehicles/respawn_ephemeral_delay_sec');
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the |streamableVehicle| to the respawn manager, indicating that it's being used and
    // should be kept alive beyond the time that it spends within streaming range.
    add(streamableVehicle) {
        if (this.vehicles_.has(streamableVehicle))
            this.delete(streamableVehicle);
        
        let respawnTimeMs = server.clock.monotonicallyIncreasingTime();
        if (streamableVehicle.respawnDelay)
            respawnTimeMs += streamableVehicle.respawnDelay * 1000;
        else
            respawnTimeMs += this.ephemeralVehicleRespawnDelay * 1000;

        this.vehicles_.set(streamableVehicle, respawnTimeMs);
        this.respawnQueue_.push(streamableVehicle);
    }

    // Returns whether the |streamableVehicle| is co-owned by the respawn manager.
    has(streamableVehicle) { return this.vehicles_.has(streamableVehicle); }

    // Deletes the |streamableVehicle| from the respawn manager. We'll stop keeping it alive.
    delete(streamableVehicle) {
        if (!this.vehicles_.has(streamableVehicle))
            return;  // the |streamableVehicle| is not known to this manager
        
        this.respawnQueue_.delete(streamableVehicle);
        this.vehicles_.delete(streamableVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns a Set of StreamableVehicle instances that are due a respawn. They will no longer be
    // known to this class after having been returned by this method.
    getVehiclesToRespawn() {
        const currentTime = server.clock.monotonicallyIncreasingTime();
        const vehicles = new Set();

        while (!this.respawnQueue_.isEmpty()) {
            const streamableVehicle = this.respawnQueue_.peek();
            if (this.vehicles_.get(streamableVehicle) >= currentTime)
                break;  // the |streamableVehicle|, and following, are not ready to respawn
            
            vehicles.add(streamableVehicle);
            this.delete(streamableVehicle);
        }

        return vehicles;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.respawnQueue_.clear();
        this.respawnQueue_ = null;

        this.vehicles_.clear();
        this.vehicles_ = null;
    }
}
