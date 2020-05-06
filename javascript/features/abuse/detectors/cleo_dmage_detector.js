// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetector } from 'features/abuse/abuse_detector.js';

// Set of weapon Ids that will be ignored for this detector, because they're either insignificant or
// too unreliable to allow for accurate detection.
const kIgnoredWeaponIds = new Set([
    16,  // Grenade
    17,  // Teargas
    18,  // Molotov
    35,  // Rocket Launcher
    36,  // Heat Seaking Rocket Launcher
    38,  // Minigun
    51,  // Explosion
    52,  // Fire Extinguisher
    54,  // Splat
]);

// The amount of damage whipping someone with the handle of a pistol takes. This is valid for most
// of the pistol-like weapons, but would be reported as weapon-specific damage.
const kPistolWhipAmount = 2.64;

// Weapon IDs that are able to inflict the |kPistolWhipWeaponIds|.
export const kPistolWhipWeaponIds = new Set([
     22,  // Colt 45
     23,  // Silenced Pistol
     24,  // Desert Eagle
     25,  // Shotgun
     26,  // Sawn-off shotgun
     27,  // Spaz shotgun
     28,  // Uzi
     29,  // MP5
     30,  // AK-47
     31,  // M4
     32,  // Tec-9
     33,  // Rifle
     34,  // Sniper
     38,  // Minigun
     41,  // Spraycan
     52,  // Fire Extinguisher
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
    [ 41,  0.33 ],  // Spraycan
]);

// Some weapons fire multiple bullets, one or multiple of which can hit. This gives them a damage
// range rather than a fixed amount. We handle those separately.
export const kMultiBulletDamageAmounts = new Map([
    [ 25, { bullets: 15, damage: 3.30 } ],  // Shotgun
    [ 26, { bullets: 15, damage: 3.30 } ],  // Sawn-off shutgun
    [ 27, { bullets: 8,  damage: 4.95 } ],  // Spaz shutgun
]);

// Sigma when comparing floating point values in the |kFixedDamageAmounts| table.
const kDamageComparisonSigma = 0.01;

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

    sampleRate_ = null;

    constructor(...params) {
        super(...params, 'CLEO Dmage');

        this.individualMeasurements_ = new WeakMap();
        this.globalMeasurements_ = new Map();

        this.sampleRate_ = this.getSettingValue('abuse/detector_cleo_dmage_sample_rate');
    }

    onPlayerTakeDamage(player, issuer, weaponId, amount, bodyPart) {
        if (!issuer)
            return;  // the damage was self inflicted
        
        if (kIgnoredWeaponIds.has(weaponId))
            return;  // the weapon has been ignored
        
        // If the |amount| is exactly |kPistolWhipAmount|, and the |weaponId| is one of the pistol
        // types, it's safe to ignore this, since it's not a *shot* with the given |weaponId|.
        if (Math.abs(kPistolWhipAmount - amount) <= kDamageComparisonSigma &&
                kPistolWhipWeaponIds.has(weaponId)) {
            return;
        }

        // Deal with weapons that are meant to do a fixed amount of damage. If the taken damage is
        // different from the expected damage, we've got a problem. Otherwise bail out.
        const fixedDamageAmount = kFixedDamageAmounts.get(weaponId);
        if (fixedDamageAmount) {
            if (Math.abs(fixedDamageAmount - amount) > kDamageComparisonSigma) {
                this.report(player, AbuseDetector.kSuspected, {
                    weaponId,
                    expectedDamageAmount: fixedDamageAmount,
                    actualDamageAmount: amount,
                });
            }

            return;
        }

        // Deal with weapons that have multiple bullets. This gives them a range of damage values.
        // There are two potential problems here: an odd amount of bullets have hit, which will
        // always be a local customization, or an invalid number of bullets have hit.
        const multiBulletDamage = kMultiBulletDamageAmounts.get(weaponId);
        if (multiBulletDamage) {
            const hitBulletCount = Math.round((amount / multiBulletDamage.damage) * 100) / 100;
            if (!Number.isInteger(hitBulletCount) || hitBulletCount > multiBulletDamage.bullets) {
                this.report(player, AbuseDetector.kSuspected, { weaponId, amount });
                return;
            }
        }

        // Record the shot in both server and personal measurements. We want to be able to get
        // running metrics on these, and periodically check against them.
        const globalWeaponMeasurements = this.recordGlobalMeasurement(weaponId, amount);
        const playerWeaponMeasurements = this.recordIndividualMeasurement(player, weaponId, amount);

        // Sample a player's activity at a given sample rate, based on their own individual
        // measurements. This frequency is configurable through `/lvp settings`.
        if ((playerWeaponMeasurements % this.sampleRate_) !== 0)
            return;

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

        console.log(`DmageV5 [${player.name}][${weaponId}][${global},${local}][${diff}]`);
    }

    // Records the hit by |weaponId| as having done |amount| damage in server-wide metrics.
    recordGlobalMeasurement(weaponId, amount) {
        let globalWeaponMeasurements = this.globalMeasurements_.get(weaponId);
        if (!globalWeaponMeasurements) {
            globalWeaponMeasurements = new DamageMeasurements();
            this.globalMeasurements_.set(weaponId, globalWeaponMeasurements);
        }

        globalWeaponMeasurements.record(amount);
        return globalWeaponMeasurements;
    }

    // Record the hit by |weaponId| as having done |amount| damage for the |player| specifically.
    // These metrics are keyed by the |player| instance, thus per playing session.
    recordIndividualMeasurement(player, weaponId, amount) {
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
        return playerWeaponMeasurements;
    }
}
