// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameBase } from 'features/games/game_base.js';
import { Vector } from 'base/vector.js';

import { random } from 'base/random.js';

// How many hay stacks will there by side by side?
export const kEdge = 4;

// Every how many game ticks should player progress be checked in the game?
export const kPlayerProgressInterval = 8;

// Implementation of the Game class specifically for the Haystack minigame. An instance of this
// class will be created by the Games infrastructure when it's started.
export class HaystackGame extends GameBase {
    // Type of object that can be stored in either of the matrices.
    static kPositionEmpty = 0;
    static kPositionHaystack = 1;
    static kPositionRock = 2;

    // Counter to determine whether to check for winning players in a game tick.
    counter_ = 0;

    // Matrix of the haystacks and rocks that have been created. Three-dimensional, [x][y][z].
    matrix_ = [];

    // Set of positions ({x, y, z}) in which haystacks are located. Moving objects are removed until
    // their move operation has fully completed.
    haystacks_ = new Set();

    // The settings for this game, which will be initialized based on the |settings| passed to us.
    settings_ = null;

    // Map of |player| to the time, in milliseconds, at which they started the attempt.
    startTime_ = new WeakMap();

    // Counter used to skip unnecessary updates, based on the difficulty level.
    tickSkipCounter_ = 0;

    // Called when the game has been initialized. Here we create the haystacks and the rocks that
    // that the player is able to climb on.
    async onInitialized(settings, userData) {
        await super.onInitialized(settings, userData);

        this.settings_ = this.determineSettings(settings);

        if ((this.settings_.hayDensity + this.settings_.rockDensity) >= 1)
            throw new Error(`The total density of the hay stack must not >=1`);

        const kLevels = this.settings_.levels;

        for (let x = 0; x < kEdge; ++x) {
            this.matrix_[x] = [];

            // Fill the [x][y] with an empty position object for each level.
            for (let y = 0; y < kEdge; ++y)
                this.matrix_[x][y] = Array(kLevels).fill({ type: HaystackGame.kPositionEmpty });
        }

        // Now populate the haystack objects in the matrix at the configured density.
        const haystackObjects = Math.floor((kEdge * kEdge * kLevels) * this.settings_.hayDensity);
        const rockObjects = Math.floor((kEdge * kEdge * kLevels) * this.settings_.rockDensity);

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
        await super.onPlayerSpawned(player, countdown);

        const jitter = {
            x: (Math.random() * 8) - 4,
            y: (Math.random() * 8) - 4,
        };

        player.position = new Vector(35.0 + jitter.x, 6.50 + jitter.y, 3.3);
        player.rotation = 135;

        player.updateStreamerObjects();

        player.time = this.settings_.time;
        player.weather = this.settings_.weatherId;

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

    // Called every tick, i.e. every ~100ms for this game. Each tick will be considered to move one
    // of the haystacks in the game, and every five ticks (~500ms) we'll check whether any of the
    // players has reached the top of the haystack.
    async onTick() {
        await super.onTick();

        if ((this.counter_++) % kPlayerProgressInterval === 0)
            this.updatePlayerProgress();

        if ((this.tickSkipCounter_++) % this.settings_.tickSkip !== 0)
            return;  // skip this update

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
        
        if (target.z < 0 || target.z >= this.settings_.levels)
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

    // Checks the progress of each of the players in the game. This will be reflected in an on-
    // screen UI, but will also be used to determine whether they've won.
    updatePlayerProgress() {
        // TODO: Display some sort of UI with their progress. Something like races do would be ace.

        // Determine the area of the map in which a climbing player could be.
        const rangeX = [ kEdge * -4, 1 * -4 ];
        const rangeY = [ kEdge * -4, 1 * -4 ];

        for (const player of this.players) {
            const position = player.position;

            let score = 0;  // on the ground

            // Only consider their height if they're standing on one of the haystacks.
            if (position.x >= rangeX[0] && position.x <= rangeX[1] &&
                    position.y >= rangeY[0] && position.y <= rangeY[1]) {
                score = Math.max(0, Math.min(Math.round(position.z / 3) - 1,
                                             this.settings_.levels + 1));
            }

            // TODO: Update the UI with the player's current position.

            // If the player hasn't reached above the number of levels yet, they're still going.
            if (score <= this.settings_.levels)
                continue;

            // Otherwise they've won. Their score will be the total time it took them, in seconds,
            // rounded to two decimal points.
            const totalTimeMs =
                server.clock.monotonicallyIncreasingTime() - this.startTime_.get(player);

            this.playerWon(player, Math.round(totalTimeMs / 10) / 100);
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Utility functions
    // ---------------------------------------------------------------------------------------------

    // Determines the movement speed given the |level|, for a movement in the given |direction|.
    // Movements at higher altitudes will be faster, to make the game more challenging.
    determineMovementSpeed(level, direction) {
        const kHorizontalRange = [ 0.75, 1.5 ];
        const kVerticalRange = [ 1, 2 ];

        const progress = level / this.settings_.levels;

        let vel = 0;
        switch (direction) {
            case 'x':
            case 'y':
                vel = kHorizontalRange[0] + (kHorizontalRange[1] - kHorizontalRange[0]) * progress;
                break;

            case 'z':
                vel = kVerticalRange[0] + (kVerticalRange[1] - kVerticalRange[0]) * progress;
                break;
        }

        return vel + this.settings_.speedAdjustment;
    }

    // Determines the internal configuration based on the given |settings|. These can be customized
    // by players, to create custom experiences for the haystack game.
    determineSettings(settings) {
        let hayDensity = .3;  // density of haystack in the matrix
        let levels = 30;  // number of levels that players will have to conqueror
        let rockDensity = .01;  // density of rocks in the matrix
        let speedAdjustment = 0;  // adjustment in movement speed, in units/sec.
        let tickSkip = 5;  // number of ticks to skip when moving a haystack (lower = faster)
        let time = [ 12, 0 ];  // time to apply in the world during the game
        let weatherId = 2;  // the weather to apply during the game

        switch (settings.get('haystack/difficulty')) {
            case 'easy':
                hayDensity = .35;
                rockDensity = 0;
                speedAdjustment = -0.25;
                tickSkip = 10;
                break;
            case 'normal':
                hayDensity = .3;
                rockDensity = .01;
                speedAdjustment = 0;
                tickSkip = 5;
                break;
            case 'difficult':
                hayDensity = .25;
                rockDensity = .04;
                speedAdjustment = 0.25;
                tickSkip = 3;
                break;
            case 'extreme':
                hayDensity = .2;
                rockDensity = .08;
                speedAdjustment = 0.35;
                tickSkip = 1;
                weatherId = 9;
                break;
        }

        if (settings.has('haystack/levels'))
            levels = settings.get('haystack/levels');

        return { hayDensity, levels, rockDensity, speedAdjustment, tickSkip, time, weatherId };
    }

    // Finds an available position in the matrix through randomness. That means that the algorithm
    // is not very optimised, but as long as the matrix' density is <1 it should be fine.
    findAvailablePosition() {
        let x, y, z;

        do {
            x = random(0, kEdge);
            y = random(0, kEdge);
            z = random(0, this.settings_.levels);

        } while (this.matrix_[x][y][z].type != HaystackGame.kPositionEmpty);

        return [x, y, z];
    }

    // Returns a Vector instance for position [x, y, z] in the haystack matrix.
    vectorForPosition(x, y, z) {
        return new Vector(x * -4, y * -4, (z + 1) * 3);
    }
}
