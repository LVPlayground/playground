// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameBase } from 'features/games/game_base.js';

import { shuffle } from 'base/shuffle.js';

// Number of milliseconds to wait before positioning the player in a vehicle, split between their
// initial spawn and subsequent spawns, which are less intense for the client.
export const kInitialSpawnLoadDelayMs = 1500;
export const kSubsequentSpawnLoadDelayMs = 750;

// Base class for vehicle-based games where each participant spawns in a vehicle. Supports any
// number of spawn positions, environment settings, countdowns and advanced spawn configuration.
export class VehicleGame extends GameBase {
    #description_ = null;

    #availableSpawns_ = null;

    #playerSpawned_ = new Set();
    #playerSpawns_ = new Map();
    #playerVehicle_ = new Map();

    // Utility function to get the vehicle assigned to the |player|, if any.
    getVehicleForPlayer(player) { return this.#playerVehicle_.get(player); }

    async onInitialized(settings, userData) {
        await super.onInitialized(settings, userData);

        // (1) Make sure that we understand which game |this| instance is being created for.
        this.#description_ = userData.registry.getDescription(settings.get('game/description_id'));
        if (!this.#description_)
            throw new Error(`Invalid game ID specified in ${this}.`);

        // (2) Make sure that the scopedEntities is set to our interior ID. This isn't yet known in
        // the earlier stages of game initialization, where the actual location is unknown.
        this.scopedEntities.interiorId = this.#description_.environment.interiorId;

        // (3) Create the objects and pickups that are part of the game.
        if (this.#description_.hasOwnProperty('objects')) {
            for (const objectInfo of this.#description_.objects)
                this.scopedEntities.createObject(objectInfo);
        }

        if (this.#description_.hasOwnProperty('pickups')) {
            for (const pickupInfo of this.#description_.pickups)
                this.scopedEntities.createPickup(pickupInfo);
        }

        // (4) Compile a list of the spawn positions from the |description|. The spawn positions
        // will be shuffled to reduce predictability of the game.
        this.#availableSpawns_ = shuffle(this.#description_.spawnPositions);
    }

    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        // (1) Assign the |player| a spawn position for the game. They will keep the spawn for the
        // lifetime of the game, until they leave it at which point it will be unassigned.
        if (!this.#availableSpawns_.length)
            throw new Error(`${this}: no more spawn positions are available.`);

        this.#playerSpawns_.set(player, this.#availableSpawns_.pop());
    }

    async onPlayerSpawned(player, countdown) {
        await super.onPlayerSpawned(player, countdown);

        // (1) Move the |player| to their assigned spawn position, but don't create their vehicle
        // just yet: allow the environment to initialize for them first.
        const spawnPosition = this.#playerSpawns_.get(player);

        player.interiorId = this.#description_.environment.interiorId;

        player.position = spawnPosition.position;
        player.rotation = spawnPosition.facingAngle;

        // (a) Activate the game's world boundaries for the |player| as well.
        const boundaries = this.#description_.environment.boundaries;
        if (boundaries) {
            player.setWorldBoundaries(
                boundaries.maxX, boundaries.minX, boundaries.maxY, boundaries.minY);
        }

        // (b) Freeze the player, preventing them from falling off the map.
        player.controllable = false;

        // (c) Force-update the streamer for the player, based on where they will be spawning. This
        // is only necessary if the |player| hasn't previously spawned in this game yet.
        if (!this.#playerSpawned_.has(player)) {
            player.updateStreamer(
                spawnPosition.position, this.scopedEntities.virtualWorld,
                this.#description_.environment.interiorId, /* STREAMER_TYPE_OBJECT= */ 0);

            await wait(kInitialSpawnLoadDelayMs);
        } else {
            await wait(kSubsequentSpawnLoadDelayMs);
        }

        // (2) Create a vehicle for the |player|, and position them within it.
        const vehicle = this.scopedEntities.createVehicle({
            modelId: spawnPosition.vehicleModelId,
            position: spawnPosition.position,
            rotation: spawnPosition.facingAngle,
        });

        player.enterVehicle(vehicle);
        player.controllable = true;

        // (3) Store their |vehicle|, and mark them as having spawned if that hadn't been done yet.
        this.#playerSpawned_.add(player);
        this.#playerVehicle_.set(player, vehicle);
    }

    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        // (1) Move the |player|'s spawn position back to the available spawn pool.
        const spawnPosition = this.#playerSpawns_.get(player);

        this.#availableSpawns_.unshift(spawnPosition);
        this.#playerSpawned_.delete(player);
        this.#playerSpawns_.delete(player);

        // (2) Delete their vehicle if that hasn't been done yet.
        if (this.#playerVehicle_.has(player)) {
            const vehicle = this.#playerVehicle_.get(player);
            if (vehicle.isConnected());
                vehicle.dispose();

            this.#playerVehicle_.delete(player);
        }

        // (3) Reset their world boundaries if we changed them for the game.
        if (this.#description_.environment.boundaries)
            player.resetWorldBoundaries();
    }
}
