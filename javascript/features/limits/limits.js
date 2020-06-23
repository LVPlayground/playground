// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { LimitsDecider } from 'features/limits/limits_decider.js';
import { LimitsNatives } from 'features/limits/limits_natives.js';

import * as requirements from 'features/limits/requirements.js';
import * as throttles from 'features/limits/throttles.js';

// The Limits feature is a foundational feature that controls whether or not players are able to
// do certain things, including admin exceptions. All of this has been centralized to make these
// decisions more consistently throughout our server.
export default class Limits extends Feature {
    decider_ = null;
    natives_ = null;

    constructor() {
        super();

        // The Limits feature is a foundational feature that only depends on Settings.
        this.markFoundational();

        // Depend on Settings as many of the limits are configurable.
        const settings = this.defineDependency('settings');

        // Responsible for making decisions on whether something is allowed based on player state,
        // requirements and throttlers. Also responsible for player state tracking.
        this.decider_ = new LimitsDecider(settings);

        // Provides native functionality to Pawn to participate in these decisions.
        this.natives_ = new LimitsNatives(this);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Limits feature
    // ---------------------------------------------------------------------------------------------

    // Decides whether the given |player| is allowed to spawn a car. By default they must be outside
    // in the main world, not be fighting, and can only do this once per minutes.
    canSpawnVehicle(player) {
        return this.decider_.decide(player, {
            requirements: [
                requirements.kMainWorldRequirement,
                requirements.kNoDeathmatchRequirement,
                requirements.kNoMinigameRequirement,
                requirements.kOutsideRequirement,
            ],
            throttles: [ throttles.kSpawnVehicleThrottle ],
        });
    }

    // Decides whether the given |player| is allowed to teleport. By default this is allowed once
    // per three minutes, as long as the player hasn't engaged in a fight. Reset on respawn.
    canTeleport(player) {
        return this.decider_.decide(player, {
            requirements: [
                requirements.kNoDeathmatchRequirement,
                requirements.kNoMinigameRequirement,
            ],
            throttles: [ throttles.kTeleportationThrottle ],
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Reports that the given |player| has spawned a vehicle.
    reportSpawnVehicle(player) {
        this.decider_.reportThrottle(player, throttles.kSpawnVehicleThrottle);
    }

    // Reports that the given |player| has used a teleportation capability.
    reportTeleportation(player) {
        this.decider_.reportThrottle(player, throttles.kTeleportationThrottle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.decider_.dispose();
        this.decider_ = null;

        this.natives_.dispose();
        this.natives_ = null;
    }
}
