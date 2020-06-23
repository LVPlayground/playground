// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { LimitsDecision } from 'features/limits/limits_decision.js';
import { PlayerEventObserver } from 'components/events/player_event_observer.js';

import { format } from 'base/format.js';
import { timeDifferenceToString } from 'base/time.js';

import * as requirements from 'features/limits/requirements.js';

// Formats the difference in |seconds| to a string. On top of `timeDifferenceToString`, we'll also
// remove leading "1"s to say "once per minute" instead of "once per 1 minute".
export function formatTimeDifference(seconds) {
    const differenceString = timeDifferenceToString(seconds);
    if (differenceString.startsWith('1 '))
        return differenceString.substring(2);
    
    return differenceString;
}

// Makes decisions based on given requirements, throttles and player state. Observes the deferred
// event manager to be informed about player fighting activity.
export class LimitsDecider extends PlayerEventObserver {
    settings_ = null;

    deathmatchDamageIssuedTime_ = new WeakMap();
    deathmatchDamageTakenTime_ = new WeakMap();
    deathmatchWeaponShotTime_ = new WeakMap();

    throttles_ = new WeakMap();

    constructor(settings) {
        super();

        this.settings_ = settings;

        server.deferredEventManager.addObserver(this);
        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Makes a decision for the |player| given the |requirements| and |throttles|, both of which
    // must be arrays. Returns a LimitsDecision instance to detail the decision.
    decide(player, /* { requirements = [], throttles = [] }= */ options) {
        const currentTime = server.clock.monotonicallyIncreasingTime();

        // (1) Process the |requirements|.
        for (const requirement of options.requirements ?? []) {
            let decision = null;

            switch (requirement) {
                case requirements.kMainWorldRequirement:
                    decision = this.processMainWorldRequirement(player);
                    break;

                case requirements.kNoDeathmatchRequirement:
                    decision = this.processDeathmatchRequirement(player, currentTime);
                    break;
                
                case requirements.kNoMinigameRequirement:
                    decision = this.processMinigameRequirement(player);
                    break;
                
                case requirements.kOutsideRequirement:
                    decision = this.processOutsideRequirement(player);
                    break;

                default:
                    throw new Error(`Invalid requirement: ${requirement}`);
            }

            if (decision)
                return decision;
        }

        // (2) Process each of the |throttles|.
        for (const throttle of options.throttles ?? []) {
            const decision = this.processThrottle(player, throttle, currentTime);
            if (decision)
                return decision;
        }

        // (3) Otherwise all requirements and throttles have been met, so they'll be allowed.
        return LimitsDecision.createApproval();
    }

    // ---------------------------------------------------------------------------------------------

    // Processes the main world requirement, which verifies that the |player| is in one of the
    // virtual worlds that make up Las Venturas Playground's main world.
    processMainWorldRequirement(player) {
        if (player.virtualWorld !== 0)
            return LimitsDecision.createRejection(Message.LIMITS_NOT_IN_MAIN_WORLD);

        return null;
    }

    // Processes the deathmatch requirement for the |player|, and returns a decision iff the
    // requirement cannot be met for any reason, e.g. because they're fighting.
    processDeathmatchRequirement(player, currentTime) {
        if (this.deathmatchDamageIssuedTime_.has(player)) {
            const kDamageIssuedCooldown = this.getSettingValue('deathmatch_damage_issued_cooldown');

            const difference = currentTime - this.deathmatchDamageIssuedTime_.get(player);
            if (difference <= kDamageIssuedCooldown * 1000)
                return LimitsDecision.createRejection(Message.LIMITS_DEATHMATCH_DAMAGE_ISSUED);
        }

        if (this.deathmatchDamageTakenTime_.has(player)) {
            const kDamageTakenCooldown = this.getSettingValue('deathmatch_damage_taken_cooldown');

            const difference = currentTime - this.deathmatchDamageTakenTime_.get(player);
            if (difference < kDamageTakenCooldown * 1000)
                return LimitsDecision.createRejection(Message.LIMITS_DEATHMATCH_DAMAGE_TAKEN);
        }

        if (this.deathmatchWeaponShotTime_.has(player)) {
            const kWeaponFiredCooldown = this.getSettingValue('deathmatch_weapon_fired_cooldown');

            const difference = currentTime - this.deathmatchWeaponShotTime_.get(player);
            if (difference < kWeaponFiredCooldown * 1000)
                return LimitsDecision.createRejection(Message.LIMITS_DEATHMATCH_WEAPON_FIRED);
        }

        return null;
    }

    // Processes the minigame requirement for the |player|, and returns a decision iff the
    // requirement cannot be met, for example because the player is playing a minigame.
    processMinigameRequirement(player) {
        if (player.syncedData.minigameName.length) {
            return LimitsDecision.createRejection(format(
                Message.LIMITS_OCCUPIED_MINIGAME, player.syncedData.minigameName));
        }

        switch (player.activity) {
            case Player.PLAYER_ACTIVITY_JS_RACE:
                return LimitsDecision.createRejection(format(
                    Message.LIMITS_OCCUPIED_MINIGAME, 'a race'));

            case Player.PLAYER_ACTIVITY_JS_DM_ZONE:
                return LimitsDecision.createRejection(format(
                    Message.LIMITS_OCCUPIED_MINIGAME, 'in a deathmatch zone'));
        }

        return null;
    }

    // Processes the outside requirement, which verifies that the |player| is not currently in an
    // interior. Certain actions, such as spawning vehicles, often don't make sense there.
    processOutsideRequirement(player) {
        if (player.interiorId !== 0)
            return LimitsDecision.createRejection(Message.LIMITS_NOT_OUTSIDE);

        return null;
    }

    // ---------------------------------------------------------------------------------------------

    // Processes the given |throttle| for the |player|, and returns a decision iff the throttle
    // cannot be met, usually because the |player| has done it too recently.
    processThrottle(player, throttle, currentTime) {
        if (!this.throttles_.has(player))
            return null;  // the |player| hasn't used any throttle before

        const throttles = this.throttles_.get(player);
        if (!throttles.has(throttle))
            return null;  // the |player| hasn't used the |throttle| before

        // Administrators have different throttle values. They can be set to zero to disable any
        // form of throttling completely, but they will still be subject to other requirements.
        const extension = player.isAdministrator() ? '_admin' : '';

        // Get the cooldown period, in seconds, for the given |throttle|.
        const kCooldownPeriod = this.getSettingValue(`throttle_${throttle}${extension}_sec`);

        // If the difference is smaller than the |kCooldownPeriod|, they're using the feature too
        // quickly and we'll block their usage. The cooldown period will be included.
        if ((currentTime - throttles.get(throttle)) < kCooldownPeriod * 1000) {
            return LimitsDecision.createRejection(format(
                Message.LIMITS_THROTTLED, formatTimeDifference(kCooldownPeriod)));
        }

        return null;
    }

    // ---------------------------------------------------------------------------------------------

    // Reports that the |player| has used the given |throttle|.
    reportThrottle(player, throttle) {
        if (!this.throttles_.has(player))
            this.throttles_.set(player, new Map());
        
        this.throttles_.get(player).set(throttle, server.clock.monotonicallyIncreasingTime());
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerEventObserver listeners
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has taken damage inflicted by the given |issuer|.
    onPlayerTakeDamage(player, issuer) {
        const currentTime = server.clock.monotonicallyIncreasingTime();

        this.deathmatchDamageTakenTime_.set(player, currentTime);
        if (issuer)
            this.deathmatchDamageIssuedTime_.set(issuer, currentTime);
    }

    // Called when the |player| has taken a shot, irrespective of whether it hit anything.
    onPlayerWeaponShot(player) {
        this.deathmatchWeaponShotTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager listeners
    // ---------------------------------------------------------------------------------------------

    // Called when a player has respawned in the world. Various throttles will be reset.
    onPlayerSpawn(player) {
        this.deathmatchDamageIssuedTime_.delete(player);
        this.deathmatchDamageTakenTime_.delete(player);
        this.deathmatchWeaponShotTime_.delete(player);
        this.throttles_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the value for the given |setting| in the limits category.
    getSettingValue(setting) { return this.settings_().getValue(`limits/${setting}`); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);
        server.deferredEventManager.removeObserver(this);
    }
}
