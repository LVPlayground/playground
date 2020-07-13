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
        const teamBased = this.isTeamBased();
        const teams = teamBased ? [ DeathmatchGame.kTeamAlpha, DeathmatchGame.kTeamBravo ]
                                : [ DeathmatchGame.kTeamIndividual ];

        // Initialize the spawn positions as a map from team to an object containing the actual
        // spawn positions, as well as the most recently used index.
        this.#spawns_ = new Map(teams.map(team => {
            return [
                team,
                {
                    positions: this.#location_.getSpawnPositions(this.isTeamBased(), team),
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

    // Called when the |player| has been added to the game. Most of the work is done by the Games
    // Deathmatch API, but as we're in charge of location we want it to fully load.
    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        // Freeze the player, so that we can teleport them with care.
        player.controllable = false;
    }

    async onPlayerSpawned(player, countdown) {
        await super.onPlayerSpawned(player, countdown);

        // Determine the spawn position for the |player|. Players will iterative spawn in each of
        // the positions available for their team, or the set of individual spawns.
        const spawns = this.#spawns_.get(this.getTeamForPlayer(player));
        const spawnPosition = spawns.positions[(spawns.index++) % spawns.positions.length];

        player.position = spawnPosition.position;
        player.rotation = spawnPosition.facingAngle;

        // Force-update the streamer for the player, based on where they will be spawning.
        player.updateStreamer(spawnPosition.position, this.scopedEntities.virtualWorld,
                              this.scopedEntities.interiorId, /* STREAMER_TYPE_OBJECT= */ 0);

        // If the location has world boundaries, activate those for the |player| as well.
        const boundaries = this.#location_.getWorldBoundaries();
        if (boundaries && false) {
            player.setWorldBoundaries(
                boundaries.maxX, boundaries.minX, boundaries.maxY, boundaries.minY);
        }

        // Wait a second, giving the objects a chance to load. This may not be necessary for games
        // taking place without custom mapping, but having a single code path keeps complexity down.
        await wait(1000);

        // Teleport the |player| to their intended spawning position again, and unfreeze them
        // immediately so that they can start playing.
        player.position = spawnPosition.position.translate({ z: 0.125 });
        player.controllable = true;
    }

    async onPlayerRemoved(player) {
        // If world boundaries had been applied for the |player|, we need to remove them again.
        if (this.#location_.getWorldBoundaries() !== null)
            player.resetWorldBoundaries();

        // Make sure that the player is controllable again, important in case they are removed from
        // the game before they can spawn, for example because they've used /leave.
        player.controllable = true;

        await super.onPlayerRemoved(player);
    }
}
