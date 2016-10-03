// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Class responsible for determining whether a player is allowed to enter a particular vehicle.
class VehicleAccessManager {
    constructor(streamer) {
        this.streamer_ = streamer;

        // Map of DatabaseVehicle instances that have locks applied to them.
        this.lockedVehicles_ = new Map();
    }

    // Gets the bound access check function that can be used to check against this manager.
    get accessFn() { return VehicleAccessManager.prototype.canAccessVehicle.bind(this); }

    // Returns whether the |player| can access the |storedVehicle|.
    canAccessVehicle(player, storedVehicle) {
        const lock = this.lockedVehicles_.get(storedVehicle);
        if (!lock)
            return true;  // no known locks for the |storedVehicle|

        switch (lock.type) {
            // Requires the |player| to have a minimum level for accessing the vehicle.
            case VehicleAccessManager.LOCK_PLAYER_LEVEL:
                if (player.level < lock.minimumLevel)
                    return false;

                break;

            // Requires the |player| to have VIP rights on the server for accessing the vehicle.
            case VehicleAccessManager.LOCK_VIP:
                if (!player.isVip())
                    return false;

                break;

            default:
                throw new Error('Unrecognized lock type: ' + lock.type);
        }

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a level-based lock on the |storedVehicle|.
    restrictToPlayerLevel(storedVehicle, minimumLevel) {
        this.lockedVehicles_.set(storedVehicle, {
            type: VehicleAccessManager.LOCK_PLAYER_LEVEL,
            minimumLevel: minimumLevel
        });

        this.synchronizeVehicle(storedVehicle);
    }

    // Creates a VIP-based lock on the |storedVehicle|.
    restrictToVip(storedVehicle) {
        this.lockedVehicles_.set(storedVehicle, {
            type: VehicleAccessManager.LOCK_VIP
        });

        this.synchronizeVehicle(storedVehicle);
    }

    // Returns whether the given |storedVehicle| has been locked.
    isLocked(storedVehicle) {
        return this.lockedVehicles_.has(storedVehicle);
    }

    // Removes all locks from the |storedVehicle|.
    unlock(storedVehicle) {
        this.lockedVehicles_.delete(storedVehicle);
        this.synchronizeVehicle(storedVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Synchronizes access to the |storedVehicle| for all in-game players.
    synchronizeVehicle(storedVehicle) {
        this.streamer_().getVehicleStreamer().synchronizeAccess(storedVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // To be called when the |storedVehicle| is being removed from the game. Removes any existing
    // locks for the vehicle without synchronizing its state in the streamer.
    delete(storedVehicle) {
        this.lockedVehicles_.delete(storedVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.lockedVehicles_.clear();
        this.lockedVehicles_ = null;
    }
}

// The different kinds of locks that exists.
VehicleAccessManager.LOCK_PLAYER_LEVEL = Symbol('Player level-based lock');
VehicleAccessManager.LOCK_VIP = Symbol('VIP-based lock');

exports = VehicleAccessManager;
