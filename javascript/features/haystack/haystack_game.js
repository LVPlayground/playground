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

    // Set of positions ({x, y, z}) in which haystacks are located. Moving objects are removed until
    // their move operation has fully completed.
    haystacks_ = new Set();

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

            this.haystacks_.add({ x, y, z });
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
        const haystackArray = [ ...this.haystacks_ ];

        if (!haystackArray.length)
            throw new Error(`There are no haystacks left in the game's set.`);

        const position = haystackArray[random(0, haystackArray.length)];
        const cell = this.matrix_[position.x][position.y][position.z];

        if (cell.type != HaystackGame.kPositionHaystack)
            throw new Error(`The identified haystack isn't known to be a haystack.`);

        let target = Object.assign({}, position);

        // Changes either [x, y, z] by [-1, 1], which maps to all valid haystack movement.
        const direction = ['x', 'y', 'z'][random(0, 3)];
        const mutation = [-1, 1][random(0, 2)];

        target[direction] += mutation;

        // The `target` position must be within bounds of the haystack matrix.
        if (target.x < 0 || target.x >= kEdge || target.y < 0 || target.y >= kEdge)
            return;
        
        if (target.z < 0 || target.z >= kLevels)
            return;

        // The `target` position must not yet be occupied by something else.
        if (this.matrix_[target.x][target.y][target.z].type != HaystackGame.kPositionEmpty)
            return;
        
        // Copy the |cell| over to the target destination, to mark it as occupied.
        this.matrix_[target.x][target.y][target.z] = cell;

        // Remove the |position| from the set of haystack objects that are able to move.
        this.haystacks_.delete(position);

        // The speed depends on the altitude, objects higher up will be moving faster.
        const speed = this.determineMovementSpeed(target.z, direction);

        // Move the object located in the |cell| to the new destination. When completed, mark the
        // existing |cell| as empty, so that other haystacks are able to move in to it.
        cell.object.moveTo(this.vectorForPosition(target.x, target.y, target.z), speed).then(() => {
            this.matrix_[position.x][position.y][position.z] = {
                type: HaystackGame.kPositionEmpty
            };

            this.haystacks_.add(target);
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Utility functions
    // ---------------------------------------------------------------------------------------------

    // Determines the movement speed given the |level|, for a movement in the given |direction|.
    // Movements at higher altitudes will be faster, to make the game more challenging.
    determineMovementSpeed(level, direction) {
        const kHorizontalRange = [ 0.75, 1.5 ];
        const kVerticalRange = [ 1, 2 ];

        const progress = level / kLevels;

        switch (direction) {
            case 'x':
            case 'y':
                return kHorizontalRange[0] + (kHorizontalRange[1] - kHorizontalRange[0]) * progress;

            case 'z':
                return kVerticalRange[0] + (kVerticalRange[1] - kVerticalRange[0]) * progress;
        }
    }

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
