// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Game } from 'features/games/game.js';
import { Vector } from 'base/vector.js';

import { random } from 'base/random.js';

// How many hay stacks will there by side by side?
const kEdge = 4;

// How many levels of hay stacks will the participants have to climb?
const kLevels = 30;

// Implementation of the Game class specifically for the Haystack minigame. An instance of this
// class will be created by the Games infrastructure when it's started.
export class HaystackGame extends Game {
    // Map of |player| to the time, in milliseconds, at which they started the attempt.
    startTime_ = new WeakMap();

    async onInitialized() {

    }

    async onPlayerAdded(player) {
        // TODO: Support a countdown with description, and camera pointing at the stack.
    }

    // Called when the |player| is ready to spawn. We position them near the hay so that they can
    // start running immediately. The countdown has already passed at this point.
    async onPlayerSpawned(player, countdown) {
        const jitter = {
            x: (Math.random() * 8) - 4,
            y: (Math.random() * 8) - 4,
        };

        player.position = new Vector(35.0 + jitter.x, 6.50 + jitter.y, 3.3);
        player.rotation = 135;

        player.updateStreamerObjects();

        player.health = 100;
        player.armour = 0;

        // If this is their first spawn, then |countdown| will be included to help them out.
        if (countdown)
            await countdown();

        // Only set their start time on first spawn. They can die and begin climbing the stack
        // again, but as far as this game is concerned that's still part of their original attempt.
        if (!this.startTime_.has(player))
            this.startTime_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    async onPlayerRemoved(player) {
        this.startTime_.delete(player);
    }

    async onTick() {

    }
}
