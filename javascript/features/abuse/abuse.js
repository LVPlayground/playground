// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AbuseConstants = require('features/abuse/abuse_constants.js');
const AbuseNatives = require('features/abuse/abuse_natives.js');
const Feature = require('components/feature_manager/feature.js');
const FightTracker = require('features/abuse/fight_tracker.js');

// Time period, in milliseconds, a player needs to wait between time limited teleportations.
const TeleportCoolDownPeriodMs = 180000;  // 3 minutes

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
class Abuse extends Feature {
    constructor() {
        super();

        // The settings for the Abuse system are configurable at runtime.
        this.settings_ = this.defineDependency('settings');

        // -----------------------------------------------------------------------------------------

        // Stores the last time, in milliseconds, a teleportation was reported for a player.
        this.lastTeleportTime_ = new WeakMap();

        this.fightTracker_ = new FightTracker();

        this.natives_ = new AbuseNatives(this);
    }

    // Gets the value of the setting in the `abuse` category named |name|.
    getSetting(name) { return this.settings_().getValue('abuse/' + name); }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Abuse feature.

    // Returns whether the |player| is allowed to teleport right now. The |enforceTimeLimit| option
    // may be set to indicate that the player should adhere to the teleportation time limit.
    canTeleport(player, { enforceTimeLimit = false } = {}) {
        const currentTime = server.clock.monotonicallyIncreasingTime();

        // (1) Administrators might be able to override teleportation limitations.
        if (player.isAdministrator() && this.getSetting('tp_blocker_admin_override'))
            return { allowed: true };

        const blockerWeaponFired = this.getSetting('tp_blocker_weapon_fire_time') * 1000;  // ms
        const blockerDamageIssued = this.getSetting('tp_blocker_damage_issued_time') * 1000;  // ms
        const blockerDamageTaken = this.getSetting('tp_blocker_damage_taken_time') * 1000;  // ms

        // (2) Should having fired your weapon temporarily block teleportation?
        if (blockerWeaponFired > 0) {
            const weaponFireTime = this.fightTracker_.getLastShotTime(player);
            if (weaponFireTime && (currentTime - weaponFireTime) < blockerWeaponFired)
                return { allowed: false, reason: AbuseConstants.REASON_FIRED_WEAPON };
        }

        // (3) Should having issued damage to another player temporarily block teleportation?
        if (blockerDamageIssued > 0) {
            const issuedDamageTime = this.fightTracker_.getLastIssuedDamageTime(player);
            if (issuedDamageTime && (currentTime - issuedDamageTime) < blockerDamageIssued)
                return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_ISSUED };
        }

        // (4) Should having taken damage from another player temporarily block teleportation?
        if (blockerDamageTaken > 0) {
            const takenDamageTime = this.fightTracker_.getLastTakenDamageTime(player);
            if (takenDamageTime && (currentTime - takenDamageTime) < blockerDamageTaken)
                return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_TAKEN };
        }

        // -----------------------------------------------------------------------------------------
        // TODO: Generalize this code.

        if (enforceTimeLimit) {
            const lastTeleportTime = this.lastTeleportTime_.get(player);
            if (lastTeleportTime && (currentTime - lastTeleportTime) < TeleportCoolDownPeriodMs) {
                return { allowed: false, reason: AbuseConstants.REASON_TIME_LIMIT };
            }
        }

        // -----------------------------------------------------------------------------------------

        // (5) Otherwise the |player| is allowed to do whatever they wanted to do.
        return { allowed: true };
    }

    // Reports that the |player| has been teleported through an activity that's time limited.
    reportTimeLimitedTeleport(player) {
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
