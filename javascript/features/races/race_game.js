// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'features/games_vehicles/interface/countdown.js';
import { VehicleGame } from 'features/games_vehicles/vehicle_game.js';
import { Vehicle } from 'entities/vehicle.js';

// How many seconds should the race's countdown last for?
export const kCountdownSeconds = 3;

// Every how many milliseconds should infinite NOS be issued to vehicles? This roughly maps to the
// time a single nitro injection will last, without needing to wait for it to recover.
export const kNitrousInjectionIssueTimeMs = 20000;

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

    #description_ = null;

    #infiniteHealth_ = null;
    #infiniteHealthTime_ = null;

    #nitrousInjection_ = RaceGame.kNitrousInjectionNone;
    #nitrousInjectionTime_ = null;

    #playerStartTime_ = new WeakMap();

    async onInitialized(settings, registry) {
        await super.onInitialized(settings, registry);

        // (1) Make sure that we understand which race |this| instance is being created for.
        this.#description_ = registry.getDescription(settings.get('game/description_id'));
        if (!this.#description_)
            throw new Error(`Invalid race ID specified in ${this}.`);

        // (2) Determine the level of nitrous injection that should be available to participants.
        if (this.#description_.settings.unlimitedNos)
            this.#nitrousInjection_ = RaceGame.kNitrousInjectionInfinite;
        else if ([ 1, 5, 10 ].includes(this.#description_.settings.nos))
            this.#nitrousInjection_ = this.#description_.settings.nos;

        // (3) Determine if infinite health should be available to participants.
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

        await Countdown.displayForPlayer(player, kCountdownSeconds, () => this.players.has(player));

        // Again, verify that they're still part of this game before re-enabling their engine, and
        // throw them out if they're no longer in their vehicle. This is a bit tedious.
        if (!player.isConnected() || !this.players.has(player))
            return;

        if (player.vehicle !== vehicle)
            return this.playerLost(player);

        player.vehicle.toggleEngine(/* engineRunning= */ true);

        // Store the time at which the |player| actually started to drive in the race.
        this.#playerStartTime_.set(player, server.clock.monotonicallyIncreasingTime());
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
}
