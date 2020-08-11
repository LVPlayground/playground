// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'features/games_vehicles/interface/countdown.js';
import { VehicleGame } from 'features/games_vehicles/vehicle_game.js';

import { difference } from 'base/set_extensions.js';

// How many seconds should the derby's countdown last for?
export const kCountdownSeconds = 3;

// Provides the implementation of actual derbies, building on top of the Games API infrastructure.
// An instance of this class is strictly scoped to the running derby.
export class DerbyGame extends VehicleGame {
    #description_ = null;

    #playerStartTime_ = new WeakMap();

    async onInitialized(settings, registry) {
        await super.onInitialized(settings, registry);

        // (1) Make sure that we understand which derby |this| instance is being created for.
        this.#description_ = registry.getDescription(settings.get('game/description_id'));
        if (!this.#description_)
            throw new Error(`Invalid derby ID specified in ${this}.`);
    }

    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        // Apply invisibility to the |player| if this has been configured.
        if (this.#description_.settings.invisible)
            player.colors.visible = false;
    }

    async onPlayerSpawned(player, countdown) {
        await super.onPlayerSpawned(player, countdown);

        // Spawning is highly asynchronous, it's possible they've disconnected since. It's important
        // to note that the |player| might not be in their vehicle yet.
        if (!player.isConnected())
            return;

        // Players only spawn once in a derby, so we have to display our own countdown to them.
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

        // Store the time at which the |player| actually started to drive in the derby.
        this.#playerStartTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    async onTick() {
        await super.onTick();

        // Process the derby's lower altitude limit, as well as players who have left their vehicles
        // which is prohibited in derbies. We'll consider each of them a drop-out.
        const dropouts = [];

        for (const player of this.players) {
            if (!player.vehicle)
                dropouts.push([ player, /* vehicle health= */ 0 ]);
            else if (player.vehicle.position.z < this.#description_.settings.lowerAltitudeLimit)
                dropouts.push([ player, player.vehicle.health ]);
        }

        // Sort the |dropouts| based on the remaining health of their vehicle, in descending order.
        // This decides who will be dropping out of the game first, if a race condition occurs.
        dropouts.sort((lhs, rhs) => {
            if (lhs[1] === rhs[1])
                return 0;

            return lhs[1] > rhs[1] ? -1 : 1;
        });

        // Drop out each of the |dropouts| as losers. You can't win if you fall down :)
        for (const [ player ] of dropouts)
            this.playerLost(player);
    }

    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        // Make sure that the |player|'s visible is restored.
        if (!player.colors.visible)
            player.colors.visible = true;

        // If there's only a single player left in the derby, mark them as the winner. The |player|
        // who's currently being removed will still live in the players set, however.
        const remainingPlayers = difference(this.players, new Set([ player ]));
        if (remainingPlayers.size === 1)
            this.playerWon([ ...remainingPlayers ][0]);
    }
}
