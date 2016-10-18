// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FightTracker = require('features/abuse/fight_tracker.js');

// The Abuse Mitigator makes decisions on whether certain actions may take place, based on the
// knowledge available to it. It uses a variety of sub-systems for this.
class AbuseMitigator {
    constructor() {
        this.fightTracker_ = new FightTracker();
        this.throttlers_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| hasn't used the |throttler| for |minimumElapsedTime| ms.
    satisfiesTimeThrottle(player, currentTime, minimumElapsedTime, throttler) {
        const players = this.throttlers_.get(throttler);
        if (!players)
            return true;  // nobody has used the |throttler| yet

        const usageTime = players.get(player);
        if (!usageTime)
            return true;  // the |player| has not yet reported usage of the |throttler|

        return (currentTime - usageTime) >= minimumElapsedTime;
    }

    // Reports that the |player| has used the |throttler|.
    reportTimeThrottleUsage(player, throttler) {
        if (!this.throttlers_.has(throttler))
            this.throttlers_.set(throttler, new WeakMap());

        this.throttlers_.get(throttler).set(player, server.clock.monotonicallyIncreasingTime());        
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| hasn't fired a weapon in the past |minimumElapsedTime| ms.
    satisfiesWeaponFireConstraint(player, currentTime, minimumElapsedTime) {
        const weaponFireTime = this.fightTracker_.getLastWeaponFiredTime(player);
        return !weaponFireTime || (currentTime - weaponFireTime) >= minimumElapsedTime;
    }

    // Returns whether the |player| hasn't issued damage in the past |minimumElapsedTime| ms.
    satisfiesDamageIssuedConstraint(player, currentTime, minimumElapsedTime) {
        const damageIssuedTime = this.fightTracker_.getLastDamageIssuedTime(player);
        return !damageIssuedTime || (currentTime - damageIssuedTime) >= minimumElapsedTime;
    }

    // Returns whether the |player| hasn't taken damage in the past |minimumElapsedTime| ms.
    satisfiesDamageTakenConstraint(player, currentTime, minimumElapsedTime) {
        const damageTakenTime = this.fightTracker_.getLastDamageTakenTime(player);
        return !damageTakenTime || (currentTime - damageTakenTime) >= minimumElapsedTime;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.throttlers_.clear();

        this.fightTracker_.dispose();
        this.fightTracker_ = null;
    }
}

exports = AbuseMitigator;
