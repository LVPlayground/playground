// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Banner } from 'components/interface/banner.js';
import { RaceCheckpoint } from 'components/checkpoints/race_checkpoint.js';
import { RaceProgressionTracker } from 'features/races/race_progression_tracker.js';
import { StartCountdown } from 'features/games_vehicles/interface/start_countdown.js';
import { VehicleGame } from 'features/games_vehicles/vehicle_game.js';
import { VehicleModel } from 'entities/vehicle_model.js';
import { Vehicle } from 'entities/vehicle.js';

import { format } from 'base/format.js';

// Every how many milliseconds should infinite NOS be issued to vehicles? This roughly maps to the
// time a single nitro injection will last, without needing to wait for it to recover.
export const kNitrousInjectionIssueTimeMs = 20000;

// How many seconds should the race's countdown last for?
export const kStartCountdownSeconds = 3;

// Every how many milliseconds should vehicle damage be reset for infinite health games?
export const kVehicleDamageRepairTimeMs = 2000;

// Provides the implementation of actual races, building on top of the Games API infrastructure. An
// instance of this class is strictly scoped to the running race.
export class RaceGame extends VehicleGame {
    // The level of nitrous injection that should be available to participants.
    static kNitrousInjectionNone = 0;
    static kNitrousInjectionSingleShot = 1;
    static kNitrousInjectionFiveShot = 5;
    static kNitrousInjectionTenShot = 10;
    static kNitrousInjectionInfinite = 100;

    #airborne_ = null;
    #description_ = null;

    #infiniteHealth_ = null;
    #infiniteHealthTime_ = null;

    #nitrousInjection_ = RaceGame.kNitrousInjectionNone;
    #nitrousInjectionTime_ = null;

    #checkpoint_ = new WeakMap();
    #progression_ = new WeakMap();

    async onInitialized(settings, registry) {
        await super.onInitialized(settings, registry);

        // (1) Make sure that we understand which race |this| instance is being created for.
        this.#description_ = registry.getDescription(settings.get('game/description_id'));
        if (!this.#description_)
            throw new Error(`Invalid race ID specified in ${this}.`);

        // (2) Determine whether this is a ground race or an air race.
        if (!this.#description_.spawnPositions || !this.#description_.spawnPositions.length)
            throw new Error(`Expected at least one spawn position to be defined for the race.`);

        const vehicleModelId = this.#description_.spawnPositions[0].vehicleModelId;
        const vehicleModel = VehicleModel.getById(vehicleModelId);
        if (!vehicleModel)
            throw new Error(`Invalid vehicle model supplied for a race: ${vehicleModelId}.`);

        this.#airborne_ = vehicleModel.isAirborne();

        // (3) Determine the level of nitrous injection that should be available to participants.
        if (this.#description_.settings.unlimitedNos)
            this.#nitrousInjection_ = RaceGame.kNitrousInjectionInfinite;
        else if ([ 1, 5, 10 ].includes(this.#description_.settings.nos))
            this.#nitrousInjection_ = this.#description_.settings.nos;

        // (4) Determine if infinite health should be available to participants.
        this.#infiniteHealth_ = this.#description_.settings.disableVehicleDamage;
        this.#infiniteHealthTime_ = server.clock.monotonicallyIncreasingTime();
    }

    async onPlayerSpawned(player, countdown) {
        await super.onPlayerSpawned(player, countdown);

        // Spawning is highly asynchronous, it's possible they've disconnected since. It's important
        // to note that the |player| might not be in their vehicle yet.
        if (!player.isConnected())
            return;

        // Players only spawn once in a race, so we have to display our own countdown to them. First
        // disable their engines, then display the countdown, then enable their engines.
        const vehicle = this.getVehicleForPlayer(player);
        if (!vehicle)
            throw new Error(`${this}: expected a vehicle to have been created.`);

        // Apply the non-infinite nitrous injection components to their vehicle.
        switch (this.#nitrousInjection_) {
            case RaceGame.kNitrousInjectionInfinite:
                this.#nitrousInjectionTime_ = server.clock.monotonicallyIncreasingTime();
                /* deliberate fall-through */

            case RaceGame.kNitrousInjectionSingleShot:
                vehicle.addComponent(Vehicle.kComponentNitroSingleShot);
                break;

            case RaceGame.kNitrousInjectionFiveShot:
                vehicle.addComponent(Vehicle.kComponentNitroFiveShots);
                break;

            case RaceGame.kNitrousInjectionTenShot:
                vehicle.addComponent(Vehicle.kComponentNitroTenShots);
                break;
        }

        // Disable their engine, so that they can't drive off while the countdown is active.
        vehicle.toggleEngine(/* engineRunning= */ false);

        // Create the |player|'s progression tracker, and display the first checkpoint for them.
        const tracker = new RaceProgressionTracker(
            this.#description_.checkpoints, this.#description_.settings.laps);

        this.updateCheckpoint(player, tracker);
        this.#progression_.set(player, tracker);

        // Display the start countdown for the |player|. They'll be getting ready...
        await StartCountdown.displayForPlayer(
            player, kStartCountdownSeconds, () => this.players.has(player));

        // Again, verify that they're still part of this game before re-enabling their engine, and
        // throw them out if they're no longer in their vehicle. This is a bit tedious.
        if (!player.isConnected() || !this.players.has(player))
            return;

        if (player.vehicle !== vehicle)
            return this.playerLost(player);

        player.vehicle.toggleEngine(/* engineRunning= */ true);

        // Start the |player|'s progression tracker.
        tracker.start();
    }

    // Updates and creates the checkpoint for the |player|. This tells them where to go, and also
    // gives us the necessary metrics for determining where they are.
    updateCheckpoint(player, tracker) {
        const checkpointInfo = tracker.getCurrentCheckpoint();
        if (!checkpointInfo)
            return;  // the |player| has finished the race

        let checkpointType = null;

        // Determine the type of checkpoint that should be shown. This depends on whether it's an
        // airborne race, as well on whether the |checkpointInfo| is the final one.
        if (this.#airborne_) {
            checkpointType = checkpointInfo.final ? RaceCheckpoint.kTypeAirborneFinish
                                                  : RaceCheckpoint.kTypeAirborneNormal;
        } else {
            checkpointType = checkpointInfo.final ? RaceCheckpoint.kTypeGroundedFinish
                                                  : RaceCheckpoint.kTypeGroundedNormal;
        }

        // Create the checkpoint instance, and show it to the |player|. The checkpoint manager will
        // already have deleted the previously showing checkpoint.
        const checkpoint = new RaceCheckpoint(
            checkpointType, checkpointInfo.position,
            checkpointInfo.target ?? checkpointInfo.position, checkpointInfo.size);

        checkpoint.displayForPlayer(player).then(entered => {
            if (entered)
                this.onPlayerEnterCheckpoint(player);
        });

        this.#checkpoint_.set(player, checkpoint);
    }

    // Called when the |player| has entered a checkpoint that was created by this race. We split
    // their progress, and determine whether there's a next checkpoint to show.
    onPlayerEnterCheckpoint(player) {
        const tracker = this.#progression_.get(player);
        if (!tracker)
            return;  // the may've just dropped out of the race

        tracker.split();

        // If the player hasn't finished, proceed to the next checkpoint and bail out.
        if (tracker.progress < 1)
            return this.updateCheckpoint(player, tracker);

        Banner.displayForPlayer(player, {
            title: 'congratulations!',
            message: format('you have finished the %s race', this.#description_.name),
        });

        this.playerWon(player, tracker.time / 1000);
    }

    async onTick() {
        await super.onTick();

        const currentTime = server.clock.monotonicallyIncreasingTime();

        // (1) If infinite nitrous has been configured, re-issue it to all participant's vehicles
        // every |kNitrousInjectionIssueTimeMs| to remove the regular cooldown time.
        if ((currentTime - this.#nitrousInjectionTime_) >= kNitrousInjectionIssueTimeMs) {
            for (const player of this.players) {
                if (player.vehicle)
                    player.vehicle.addComponent(Vehicle.kComponentNitroSingleShot);
            }

            this.#nitrousInjectionTime_ = currentTime;
        }

        // (2) If infinite health has been enabled, repair all participant's vehicles every bunch of
        // milliseconds to not just make them drive great, but also to make them look great.
        if (this.#infiniteHealth_ &&
                (currentTime - this.#infiniteHealthTime_) >= kVehicleDamageRepairTimeMs) {
            for (const player of this.players) {
                if (player.vehicle)
                    player.vehicle.repair();
            }

            this.#infiniteHealthTime_ = currentTime;
        }
    }

    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        if (this.#checkpoint_.has(player)) {
            this.#checkpoint_.get(player).hideForPlayer(player);
            this.#checkpoint_.delete(player);
        }
    }
}
