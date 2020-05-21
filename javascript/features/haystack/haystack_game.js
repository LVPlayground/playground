// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Game } from 'features/games/game.js';
import { Vector } from 'base/vector.js';

import { random } from 'base/random.js';

// How many hay stacks will there by side by side?
export const kEdge = 4;

// How many levels of hay stacks will the participants have to climb?
export const kLevels = 30;

// How dense should the game be? A lower value means increased difficulty.
export const kHayDensity = .3;
export const kRockDensity = .01;

// Implementation of the Game class specifically for the Haystack minigame. An instance of this
// class will be created by the Games infrastructure when it's started.
export class HaystackGame extends Game {
    // Type of object that can be stored in either of the matrices.
    static kPositionEmpty = 0;
    static kPositionHaystack = 1;
    static kPositionRock = 2;

    // Matrix of the haystacks and rocks that have been created. Three-dimensional, [x][y][z].
    matrix_ = [];

    // Map of |player| to the time, in milliseconds, at which they started the attempt.
    startTime_ = new WeakMap();

    // Called when the game has been initialized. Here we create the haystacks and the rocks that
    // that the player is able to climb on.
    async onInitialized() {
        if ((kHayDensity + kRockDensity) >= 1)
            throw new Error(`The total density of the hay stack must not >=1`);

        for (let x = 0; x < kEdge; ++x) {
            this.matrix_[x] = [];

            // Fill the [x][y] with an empty position object for each level.
            for (let y = 0; y < kEdge; ++y)
                this.matrix_[x][y] = Array(kLevels).fill({ type: HaystackGame.kPositionEmpty });
        }

        // Now populate the haystack objects in the matrix at the configured density.
        const haystackObjects = Math.floor((kEdge * kEdge * kLevels) * kHayDensity);
        const rockObjects = Math.floor((kEdge * kEdge * kLevels) * kRockDensity);

        for (let haystack = 0; haystack < haystackObjects; ++haystack) {
            const [x, y, z] = this.findAvailablePosition();

            this.matrix_[x][y][z] = {
                type: HaystackGame.kPositionHaystack,
                object: this.scopedEntities.createObject({
                    modelId: 3374,  // haystack
                    position: this.vectorForPosition(x, y, z),
                    rotation: new Vector(0, 0, random(0, 2) * 180),
                })
            };
        }

        for (let rock = 0; rock < rockObjects; ++rock) {
            const [x, y, z] = this.findAvailablePosition();

            this.matrix_[x][y][z] = {
                type: HaystackGame.kPositionRock,
                object: this.scopedEntities.createObject({
                    modelId: 1305,  // rock
                    position: this.vectorForPosition(x, y, z),
                    rotation: new Vector(random(0, 359), random(0, 359), random(0, 359)),
                })
            };
        }

        // Finally, we need a haystack way at the top. Climbing on this one signals that a player
        // has reached the top, and has thus won the game.
        this.scopedEntities.createObject({
            modelId: 3374,  // haystack
            position: new Vector((kEdge + 1) * -2, (kEdge + 1) * -2, (kLevels * 3) + 3),
            rotation: new Vector(0, 0, 0),
        });
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

    // Called every tick, i.e. every ~100ms for this game.
    async onTick() {

    }

    // ---------------------------------------------------------------------------------------------
    // Utility functions
    // ---------------------------------------------------------------------------------------------

    // Finds an available position in the matrix through randomness. That means that the algorithm
    // is not very optimised, but as long as the matrix' density is <1 it should be fine.
    findAvailablePosition() {
        let x, y, z;

        do {
            x = random(0, kEdge);
            y = random(0, kEdge);
            z = random(0, kLevels);

        } while (this.matrix_[x][y][z].type != HaystackGame.kPositionEmpty);

        return [x, y, z];
    }

    // Returns a Vector instance for position [x, y, z] in the haystack matrix.
    vectorForPosition(x, y, z) {
        return new Vector(x * -4, y * -4, (z + 1) * 3);
    }
}
