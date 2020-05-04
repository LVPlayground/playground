// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetector } from 'features/abuse/abuse_detector.js';

// Set of weapon Ids that will be ignored for this detector, because they're either insignificant or
// too unreliable to allow for accurate detection.
const kIgnoredWeaponIds = new Set([
    9,   // Chainsaw
    16,  // Grenade
    17,  // Teargas
    18,  // Molotov
    35,  // Rocket Launcher
    36,  // Heat Seaking Rocket Launcher
    38,  // Minigun
    41,  // Spraycan
    51,  // Explosion
    52,  // Fire Extinguisher
    54,  // Splat
]);

// Some weapons have a fixed damage amount that does not fluctuate depending on the shot and/or
// bullet count. Deriviations from that are clear indications that something is up.
export const kFixedDamageAmounts = new Map([
    [ 14,  4.62 ],  // Flowers
    [ 22,  8.25 ],  // Colt 45
    [ 23, 13.20 ],  // Silenced Pistol
    [ 24, 46.20 ],  // Desert Eagle
    [ 28,  6.60 ],  // Uzi
    [ 29,  8.25 ],  // MP5
    [ 30,  9.90 ],  // AK-47
    [ 31,  9.90 ],  // M4
    [ 32,  6.60 ],  // Tec-9
    [ 33, 24.75 ],  // Rifle
    [ 34, 41.25 ],  // Sniper
]);

// Sigma when comparing floating point values in the |kFixedDamageAmounts| table.
const kDamageComparisonSigma = 0.01;

// Run the statistical deviation checks every |kDetectionInterval| hits from a particular weapon. 
const kDetectionInterval = 20;

// Object to maintain a collection of measurements with the ability to provide an average. Given the
// Desert Eagle being the most powerful weapon in SA-MP with a maximum damage of 140, and the number
// of bits in a JavaScript integer being 51, we can support upwards of 6.4e13 shots. Enough.
class DamageMeasurements {
    samples_ = 0;
    sum_ = 0;
    min_ = Number.MAX_SAFE_INTEGER;
    max_ = Number.MIN_SAFE_INTEGER;

    // Gets the average damage amount over all taken samples. Must not be called before any samples
    // have been recorded, because that would lead to a divide-by-zero exception.
    get average() { return this.sum_ / this.samples_; }

    // Gets the highest sample that has been recorded.
    get max() { return this.max_; }

    // Gets the lowest sample that has been recorded.
    get min() { return this.min_; }

    // Gets the number of samples that have been recorded so far.
    get samples() { return this.samples_; }

    // Records the |amount| as a sample in the weapon damage measurements.
    record(amount) {
        this.samples_++;
        this.sum_ += amount;
        this.min_ = Math.min(this.min_, amount);
        this.max_ = Math.max(this.max_, amount);
    }
}

// Detects the Dmage.cs CLEO hack.
//
// This hack works by replacing the bullet projectile damage values with ones that are lower,
// configurable through config.ini. The default values reduce damage by approximately 25%, but this
// could be fine tuned per individual cheater. As is common with all CLEO hacks, activation of the
// cheat is toggleable through a key press.  (Shift by default.)
//
// We detect this by measuring the average damage done for each weapon for each player, as well as
// across the server. If a player's average derives sufficiently from the server average, a
// report will be issued, with the certainty level being derived from the inconsistency.
export class CleoDmageDetector extends AbuseDetector {
    individualMeasurements_ = null;
    globalMeasurements_ = null;

    constructor(...params) {
        super(...params, 'CLEO Dmage');

        this.individualMeasurements_ = new WeakMap();
        this.globalMeasurements_ = new Map();
    }

    onPlayerTakeDamage(player, issuer, weaponId, amount, bodyPart) {
        if (!issuer)
            return;  // the damage was self inflicted
        
        if (kIgnoredWeaponIds.has(weaponId))
            return;  // the weapon has been ignored
        
        const fixedDamageAmount = kFixedDamageAmounts.get(weaponId);
        if (fixedDamageAmount) {
            if (Math.abs(fixedDamageAmount - amount) > kDamageComparisonSigma)
                this.report(player, AbuseDetector.kDetected);

            return;
        }

        // (1) Record the |amount| in the global damage measurements.
        let globalWeaponMeasurements = this.globalMeasurements_.get(weaponId);
        if (!globalWeaponMeasurements) {
            globalWeaponMeasurements = new DamageMeasurements();
            this.globalMeasurements_.set(weaponId, globalWeaponMeasurements);
        }

        globalWeaponMeasurements.record(amount);

        // (2) Record the |amount in the individual damage measurements.
        let playerMeasurements = this.individualMeasurements_.get(player);
        if (!playerMeasurements) {
            playerMeasurements = new Map();
            this.individualMeasurements_.set(player, playerMeasurements);
        }

        let playerWeaponMeasurements = playerMeasurements.get(weaponId);
        if (!playerWeaponMeasurements) {
            playerWeaponMeasurements = new DamageMeasurements();
            playerMeasurements.set(weaponId, playerWeaponMeasurements);
        }

        playerWeaponMeasurements.record(amount);

        // (3) Log player measurements every |kDetectionInterval| samples.
        if ((playerWeaponMeasurements.samples % kDetectionInterval) === 0) {
            const global = 
                `${globalWeaponMeasurements.average},${globalWeaponMeasurements.samples},` +
                `${globalWeaponMeasurements.min},${globalWeaponMeasurements.max}`;
            const local =
                `${playerWeaponMeasurements.average},${playerWeaponMeasurements.samples},` +
                `${playerWeaponMeasurements.min},${playerWeaponMeasurements.max}`;

            const diff = ((playerWeaponMeasurements.average - globalWeaponMeasurements.average)
                             / globalWeaponMeasurements.average) * 100;

            if (server.isTest())
                return;  // don't output the result during tests

            console.log(`Dmage [${player.name}][${weaponId}][${global},${local}][${diff}]`);
        }
    }
}
