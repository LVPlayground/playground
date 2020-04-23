// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Abuse Mitigator makes decisions on whether certain actions may take place, based on the
// knowledge available to it. It uses a variety of sub-systems for this.
class AbuseMitigator {
    constructor() {
        this.throttlers_ = new Map();

        this.weaponFireTime_ = new WeakMap();
        this.damageIssuedTime_ = new WeakMap();
        this.damageTakenTime_ = new WeakMap();
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
        const weaponFireTime = this.weaponFireTime_.get(player);
        return !weaponFireTime || (currentTime - weaponFireTime) >= minimumElapsedTime;
    }

    // Reports that |player| has fired their weapon.
    reportWeaponFire(player) {
        this.weaponFireTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // Resets the fact that |player| has fired their weapon.
    resetWeaponFire(player) {
        this.weaponFireTime_.delete(player);
    }

    // Returns whether the |player| hasn't issued damage in the past |minimumElapsedTime| ms.
    satisfiesDamageIssuedConstraint(player, currentTime, minimumElapsedTime) {
        const damageIssuedTime = this.damageIssuedTime_.get(player);
        return !damageIssuedTime || (currentTime - damageIssuedTime) >= minimumElapsedTime;
    }

    // Reports that |player| has issued damage to another player.
    reportDamageIssued(player) {
        this.damageIssuedTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // Resets the fact that |player| has issued damage to another player.
    resetDamageIssued(player) {
        this.damageIssuedTime_.delete(player);
    }

    // Returns whether the |player| hasn't taken damage in the past |minimumElapsedTime| ms.
    satisfiesDamageTakenConstraint(player, currentTime, minimumElapsedTime) {
        const damageTakenTime = this.damageTakenTime_.get(player);
        return !damageTakenTime || (currentTime - damageTakenTime) >= minimumElapsedTime;
    }

    // Reports that |player| has taken damage from another player.
    reportDamageTaken(player) {
        this.damageTakenTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // Resets the fact that |player| has taken damage from another player.
    resetDamageTaken(player) {
        this.damageTakenTime_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.throttlers_.clear();
    }
}

export default AbuseMitigator;
