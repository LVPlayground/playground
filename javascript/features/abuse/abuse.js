// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AbuseConstants = require('features/abuse/abuse_constants.js');
const AbuseMitigator = require('features/abuse/abuse_mitigator.js');
const AbuseNatives = require('features/abuse/abuse_natives.js');
const Feature = require('components/feature_manager/feature.js');

// Time period, in milliseconds, a player needs to wait between time limited teleportations.
const TeleportCoolDownPeriodMs = 180000;  // 3 minutes

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
class Abuse extends Feature {
    constructor() {
        super();

        // The settings for the Abuse system are configurable at runtime.
        this.settings_ = this.defineDependency('settings');

        this.mitigator_ = new AbuseMitigator();
        this.natives_ = new AbuseNatives(this);
    }

    // Gets the value of the setting in the `abuse` category named |name|.
    getSetting(name) { return this.settings_().getValue('abuse/' + name); }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Abuse feature.

    // Returns whether the |player| is allowed to teleport right now. The |enforceTimeLimit| option
    // may be set to indicate that the player should adhere to the teleportation time limit.
    canTeleport(player, { enforceTimeLimit = false } = {}) {
        const time = server.clock.monotonicallyIncreasingTime();

        // (1) Administrators might be able to override teleportation limitations.
        if (player.isAdministrator() && this.getSetting('tp_blocker_admin_override'))
            return { allowed: true };

        const blockerUsageThrottle =
            enforceTimeLimit ? this.getSetting('tp_blocker_usage_throttle_time') * 1000  // ms
                             : 0 /* no throttle will be applied */;

        // (2) Might be subject to the per-player teleportation usage throttle.
        if (!this.mitigator_.satisfiesTimeThrottle(player, time, blockerUsageThrottle, 'tp'))
            return { allowed: false, reason: AbuseConstants.REASON_TIME_LIMIT };

        const blockerWeaponFired = this.getSetting('tp_blocker_weapon_fire_time') * 1000;  // ms
        const blockerDamageIssued = this.getSetting('tp_blocker_damage_issued_time') * 1000;  // ms
        const blockerDamageTaken = this.getSetting('tp_blocker_damage_taken_time') * 1000;  // ms

        // (3) Should having fired your weapon temporarily block teleportation?
        if (!this.mitigator_.satisfiesWeaponFireConstraint(player, time, blockerWeaponFired))
            return { allowed: false, reason: AbuseConstants.REASON_FIRED_WEAPON };

        // (4) Should having issued damage to another player temporarily block teleportation?
        if (!this.mitigator_.satisfiesDamageIssuedConstraint(player, time, blockerDamageIssued))
            return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_ISSUED };

        // (5) Should having taken damage from another player temporarily block teleportation?
        if (!this.mitigator_.satisfiesDamageTakenConstraint(player, time, blockerDamageTaken))
            return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_TAKEN };

        // (6) Otherwise the |player| is allowed to teleport to wherever they wanted to go.
        return { allowed: true };
    }

    // Reports that the |player| has been teleported through an activity that's time limited.
    reportTimeLimitedTeleport(player) {
        this.mitigator_.reportTimeThrottleUsage(player, 'tp');
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
        this.natives_.dispose();
        this.natives_ = null;

        this.mitigator_.dispose();
        this.mitigator_ = null;
    }
}

exports = Abuse;
