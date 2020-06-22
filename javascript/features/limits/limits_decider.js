// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';
import { LimitsDecision } from 'features/limits/limits_decision.js';

import * as requirements from 'features/limits/requirements.js';

// Makes decisions based on given requirements, throttles and player state. Observes the deferred
// event manager to be informed about player fighting activity.
export class LimitsDecider extends PlayerEventObserver {
    settings_ = null;

    deathmatchDamageIssuedTime_ = new WeakMap();
    deathmatchDamageTakenTime_ = new WeakMap();
    deathmatchWeaponShotTime_ = new WeakMap();

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
                case requirements.kNoDeathmatchRequirement:
                    decision = this.processDeathmatchRequirement(player, currentTime);
                    break;
                
                case requirements.kNoMinigameRequirement:
                    decision = this.processMinigameRequirement(player, currentTime);
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
    processMinigameRequirement(player, currentTime) {}

    // ---------------------------------------------------------------------------------------------

    // Processes the given |throttle| for the |player|, and returns a decision iff the throttle
    // cannot be met, usually because the |player| has done it too recently.
    processThrottle(player, throttle, currentTime) {}

    // ---------------------------------------------------------------------------------------------

    // Reports that the |player| has used the given |throttle|.
    reportThrottle(player, throttle) {}

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
