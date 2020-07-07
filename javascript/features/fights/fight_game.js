// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';

// Setting which contains the intended location for the fight.
export const kLocationSetting = 'fights/location';

// Implementation of the Fight game, the actual runtime that will be used to power each of the fight
// games. Builds on the DeathmatchGame infrastructure, which builds on the Game infrastructure. An
// instance will be created (and destroyed) based on player activity.
export class FightGame extends DeathmatchGame {
    #location_ = null;
    #spawns_ = null;

    async onInitialized(settings, registry) {
        await super.onInitialized(settings, registry);

        // Get the FightLocation instance from the |registry|, based on the given |settings|.
        this.#location_ = registry.getLocation(settings.get(kLocationSetting));
        if (!this.#location_)
            throw new Error(`Invalid fight location given: ${settings.get(kLocationSetting)}`);
        
        // Determine the spawn positions for the game. These differ between individual games and
        // team-based games, as players will want to be spread out in a different manner.
        const teams = this.hasTeams() ? [ DeathmatchGame.kTeamAlpha, DeathmatchGame.kTeamBravo ]
                                      : [ DeathmatchGame.kTeamIndividual ];

        // Initialize the spawn positions as a map from team to an object containing the actual
        // spawn positions, as well as the most recently used index.
        this.#spawns_ = new Map(teams.map(team => {
            return [
                team,
                {
                    positions: this.#location_.getSpawnPositions(this.hasTeams(), team),
                    index: 0,
                }
            ];
        }));

        // Create all the objects that are part of this location.
        for (const objectInfo of this.#location_.getObjects())
            this.scopedEntities.createObject(objectInfo);
        
        // Create the health & armour pickups for the location, when enabled.
        if (settings.get('fights/pickups')) {
            for (const pickupInfo of this.#location_.getPickups())
                this.scopedEntities.createPickup(pickupInfo);
        }
    }

    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        // Tell the streamer to preload any objects and items at the location for the player, as
        // they are about to be teleported to it. This will not teleport the player.
        const objects = this.#location_.getObjects();
        if (objects.length) {
            player.updateStreamer(
                objects[0].position, this.scopedEntities.virtualWorld,
                this.scopedEntities.interiorId, /* type= */ -1);
        }
    }

    async onPlayerSpawned(player, countdown) {
        await super.onPlayerSpawned(player, countdown);

        // Determine the spawn position for the |player|. Players will iterative spawn in each of
        // the positions available for their team, or the set of individual spawns.
        const spawns = this.#spawns_.get(this.getTeamForPlayer(player));
        const spawnPosition = spawns.positions[(spawns.index++) % spawns.positions.length];

        player.position = spawnPosition.position;
        player.rotation = spawnPosition.facingAngle;

        // If the location has world boundaries, activate those for the |player| as well.
        const boundaries = this.#location_.getWorldBoundaries();
        if (boundaries) {
            player.setWorldBoundaries(
                boundaries.maxX, boundaries.minX, boundaries.maxY, boundaries.minY);
        }
    }

    async onPlayerRemoved(player) {
        // If world boundaries had been applied for the |player|, we need to remove them again.
        if (this.#location_.getWorldBoundaries() !== null)
            player.resetWorldBoundaries();
        
        await super.onPlayerRemoved(player);
    }
}
