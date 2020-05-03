// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AbuseConstants from 'features/abuse/abuse_constants.js';
import { AbuseDetectors } from 'features/abuse/abuse_detectors.js';
import AbuseMitigator from 'features/abuse/abuse_mitigator.js';
import { AbuseMonitor } from 'features/abuse/abuse_monitor.js';
import AbuseNatives from 'features/abuse/abuse_natives.js';
import DamageManager from 'features/abuse/damage_manager.js';
import Feature from 'components/feature_manager/feature.js';

// Time period, in milliseconds, a player needs to wait between time limited teleportations.
const TeleportCoolDownPeriodMs = 180000;  // 3 minutes

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
class Abuse extends Feature {
    constructor() {
        super();

        // The announce feature enables abuse to be reported to administrators.
        this.announce_ = this.defineDependency('announce');

        // The settings for the Abuse system are configurable at runtime.
        this.settings_ = this.defineDependency('settings');

        this.mitigator_ = new AbuseMitigator();
        this.monitor_ = new AbuseMonitor(this.announce_, this.settings_);
        this.detectors_ = new AbuseDetectors(this.settings_, this.monitor_);

        this.damageManager_ = new DamageManager(this.mitigator_, this.detectors_, this.settings_);

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
        if (player.isAdministrator() && this.getSetting('teleportation_admin_override'))
            return { allowed: true };

        const blockerUsageThrottle =
            enforceTimeLimit ? this.getSetting('teleportation_throttle_time') * 1000  // ms
                             : 0 /* no throttle will be applied */;

        // (2) Might be subject to the per-player teleportation usage throttle.
        if (!this.mitigator_.satisfiesTimeThrottle(player, time, blockerUsageThrottle, 'tp'))
            return { allowed: false, reason: AbuseConstants.REASON_TIME_LIMIT(blockerUsageThrottle) };

        return this.internalProcessFightingConstraints(player, time);
    }

    // Reports that the |player| has been teleported through an activity that's time throttled.
    reportTimeThrottledTeleport(player) {
        this.mitigator_.reportTimeThrottleUsage(player, 'tp');
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| is allowed to spawn a vehicle right now. Constraints similar to
    // teleportation apply, but the actual variables can be configured separately.
    canSpawnVehicle(player) {
        const time = server.clock.monotonicallyIncreasingTime();

        // (1) Administrators might be able to override the vehicle spawning limitations.
        if (player.isAdministrator() && this.getSetting('spawn_vehicle_admin_override'))
            return { allowed: true };

        const blockerUsageThrottle = this.getSetting('spawn_vehicle_throttle_time') * 1000  // ms

        // (2) Might be subject to the per-player vehicle spawning throttle.
        if (!this.mitigator_.satisfiesTimeThrottle(player, time, blockerUsageThrottle, 'vehicle'))
            return { allowed: false, reason: AbuseConstants.REASON_TIME_LIMIT(blockerUsageThrottle) };

        return this.internalProcessFightingConstraints(player, time);
    }

    // Reports that the |player| has spawned a vehicle through one of the commands.
    reportSpawnedVehicle(player) {
        this.mitigator_.reportTimeThrottleUsage(player, 'vehicle');
    }

    // ---------------------------------------------------------------------------------------------

    // Processes the common fighting-related constraints for |player|. Not to be used externally.
    internalProcessFightingConstraints(player, time) {
        const blockerWeaponFired = this.getSetting('blocker_weapon_fire_time') * 1000;  // ms
        const blockerDamageIssued = this.getSetting('blocker_damage_issued_time') * 1000;  // ms
        const blockerDamageTaken = this.getSetting('blocker_damage_taken_time') * 1000;  // ms

        // (3) Should having fired your weapon temporarily block the action?
        if (!this.mitigator_.satisfiesWeaponFireConstraint(player, time, blockerWeaponFired))
            return { allowed: false, reason: AbuseConstants.REASON_FIRED_WEAPON };

        // (4) Should having issued damage to another player temporarily block the action?
        if (!this.mitigator_.satisfiesDamageIssuedConstraint(player, time, blockerDamageIssued))
            return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_ISSUED };

        // (5) Should having taken damage from another player temporarily block the action?
        if (!this.mitigator_.satisfiesDamageTakenConstraint(player, time, blockerDamageTaken))
            return { allowed: false, reason: AbuseConstants.REASON_DAMAGE_TAKEN };

        // (6) Otherwise the |player| is allowed to do whatever they wanted to do.
        return { allowed: true };
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.natives_.dispose();
        this.natives_ = null;

        this.damageManager_.dispose();
        this.damageManager_ = null;

        this.monitor_.dispose();
        this.monitor_ = null;

        this.mitigator_.dispose();
        this.mitigator_ = null;
    }
}

export default Abuse;
