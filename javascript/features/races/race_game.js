// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'features/games_vehicles/interface/countdown.js';
import { VehicleGame } from 'features/games_vehicles/vehicle_game.js';

// How many seconds should the race's countdown last for?
export const kCountdownSeconds = 3;

// Provides the implementation of actual races, building on top of the Games API infrastructure. An
// instance of this class is strictly scoped to the running race.
export class RaceGame extends VehicleGame {
    #description_ = null;

    async onInitialized(settings, registry) {
        await super.onInitialized(settings, registry);

        // (1) Make sure that we understand which race |this| instance is being created for.
        this.#description_ = registry.getDescription(settings.get('game/description_id'));
        if (!this.#description_)
            throw new Error(`Invalid race ID specified in ${this}.`);
    }

    async onPlayerSpawned(player, countdown) {
        await super.onPlayerSpawned(player, countdown);

        // Spawning is highly asynchronous, it's possible they've disconnected since. It's important
        // to note that the |player| might not be in their vehicle yet.
        if (!player.isConnected())
            return;

        // (1) Players only spawn once in a race, so we have to display our own countdown to them.
        // First disable their engines, then display the countdown, then enable their engines.
        const vehicle = this.getVehicleForPlayer(player);
        if (!vehicle)
            throw new Error(`${this}: expected a vehicle to have been created.`);

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
    }
}
