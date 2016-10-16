// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AbuseConstants = require('features/abuse/abuse_constants.js');
const AbuseNatives = require('features/abuse/abuse_natives.js');
const AreaPolicy = require('features/abuse/area_policy.js');
const Feature = require('components/feature_manager/feature.js');
const FightTracker = require('features/abuse/fight_tracker.js');

// Time period, in milliseconds, a player has to cool down after being involved in a fight.
const FightingCoolDownPeriodMs = 10000;

// Time period, in milliseconds, a player needs to wait between time limited teleportations.
const TeleportCoolDownPeriodMs = 180000;  // 3 minutes

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
class Abuse extends Feature {
    constructor() {
        super();

        // Stores the last time, in milliseconds, a teleportation was reported for a player.
        this.lastTeleportTime_ = new WeakMap();

        this.fightTracker_ = new FightTracker();

        this.natives_ = new AbuseNatives(this);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Abuse feature.

    // Returns whether the |player| is allowed to teleport right now. The |enforceTimeLimit| option
    // may be set to indicate that the player should adhere to the teleportation time limit.
    canTeleport(player, { enforceTimeLimit = false } = {}) {
        const currentTime = server.clock.monotonicallyIncreasingTime();
        const policy = AreaPolicy.getForPosition(player.position);

        // Administrators can override teleportation limitations.
        if (player.isAdministrator())
            return { allowed: true };

        // Should having fired your weapon temporarily block teleportation?
        if (policy.firingWeaponBlocksTeleporation) {
            const lastShotTime = this.fightTracker_.getLastShotTime(player);
            if (lastShotTime && (currentTime - lastShotTime) < FightingCoolDownPeriodMs)
                return { allowed: false, reason: AbuseConstants.REASON_FIRED_WEAPON };
        }

        // Should having issued damage to another player temporarily block teleportation?
        if (policy.issuingDamageBlocksTeleport) {
            const issuedDamageTime = this.fightTracker_.getLastIssuedDamageTime(player);
            if (issuedDamageTime && (currentTime - issuedDamageTime) < FightingCoolDownPeriodMs)
                return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_ISSUED };
        }

        // Should having taken damage from another player temporarily block teleportation?
        if (policy.takingDamageBlocksTeleport) {
            const takenDamageTime = this.fightTracker_.getLastTakenDamageTime(player);
            if (takenDamageTime && (currentTime - takenDamageTime) < FightingCoolDownPeriodMs)
                return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_TAKEN };
        }

        // Should the teleport be time limited?
        if (policy.enforceTeleportationTimeLimit || enforceTimeLimit) {
            const lastTeleportTime = this.lastTeleportTime_.get(player);
            if (lastTeleportTime && (currentTime - lastTeleportTime) < TeleportCoolDownPeriodMs) {
                return { allowed: false, reason: AbuseConstants.REASON_TIME_LIMIT };
            }
        }

        return { allowed: true };
    }

    // Reports that the |player| has been teleported through an activity that's time limited.
    reportTeleport(player, { timeLimited = false } = {}) {
        if (timeLimited)
            this.lastTeleportTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // Returns whether the |player| is allowed to spawn a vehicle right now. The implementation of
    // this method defers to whether the |player| is allowed to teleport.
    canSpawnVehicle(player) {
        // TODO: Spawning vehicles should be time limited as well, but it should maintain a
        // different counter from the teleportation time limit.
        return this.canTeleport(player, { enforceTimeLimit: false });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.fightTracker_.dispose();
        this.fightTracker_ = null;

        this.natives_.dispose();
        this.natives_ = null;
    }
}

exports = Abuse;
