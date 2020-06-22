// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';
import { LimitsDecision } from 'features/limits/limits_decision.js';

import * as requirements from 'features/limits/requirements.js';

// Makes decisions based on given requirements, throttles and player state. Observes the deferred
// event manager to be informed about player fighting activity.
export class LimitsDecider extends PlayerEventObserver {
    constructor() {
        super();

        server.deferredEventManager.addObserver(this);
        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Makes a decision for the |player| given the |requirements| and |throttles|, both of which
    // must be arrays. Returns a LimitsDecision instance to detail the decision.
    decide(player, /* { requirements = [], throttles = [] }= */ options) {
        // (1) Process the |requirements|.
        for (const requirement of options.requirements ?? []) {
            let decision = null;

            switch (requirement) {
                case requirements.kNoDeathmatchRequirement:
                    decision = this.processDeathmatchRequirement(player);
                    break;
                
                case requirements.kNoMinigameRequirement:
                    decision = this.processMinigameRequirement(player);
                    break;
                
                default:
                    throw new Error(`Invalid requirement: ${requirement}`);
            }

            if (decision)
                return decision;
        }

        // (2) Process each of the |throttles|.
        for (const throttle of options.throttles ?? []) {
            const decision = this.processThrottle(player);
            if (decision)
                return decision;
        }

        // (3) Otherwise all requirements and throttles have been met, so they'll be allowed.
        return LimitsDecision.createApproval();
    }

    // ---------------------------------------------------------------------------------------------

    // Processes the deathmatch requirement for the |player|, and returns a decision iff the
    // requirement cannot be met for any reason, e.g. because they're fighting.
    processDeathmatchRequirement(player) {}

    // Processes the minigame requirement for the |player|, and returns a decision iff the
    // requirement cannot be met, for example because the player is playing a minigame.
    processMinigameRequirement(player) {}

    // ---------------------------------------------------------------------------------------------

    // Processes the given |throttle| for the |player|, and returns a decision iff the throttle
    // cannot be met, usually because the |player| has done it too recently.
    processThrottle(player, throttle) {}

    // ---------------------------------------------------------------------------------------------

    // Reports that the |player| has used the given |throttle|.
    reportThrottle(player, throttle) {}

    // ---------------------------------------------------------------------------------------------
    // PlayerEventObserver listeners
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has died, optionally at the hand of the given |killer|.
    onPlayerDeath(player, killer) {}

    // Called when the |player| has taken damage inflicted by the given |issuer|.
    onPlayerTakeDamage(player, issuer) {}

    // Called when the |player| has taken a shot, irrespective of whether it hit anything.
    onPlayerWeaponShot(player) {}

    // ---------------------------------------------------------------------------------------------
    // PlayerManager listeners
    // ---------------------------------------------------------------------------------------------

    // Called when a player has respawned in the world. Various throttles will be reset.
    onPlayerSpawn(player) {}

    // Called when a player has disconnected from the server. We clear out their statistics.
    onPlayerDisconnect(player) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);
        server.deferredEventManager.removeObserver(this);
    }
}
