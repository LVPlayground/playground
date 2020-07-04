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
    // Mode of the game, either free-for-all or team-based.
    static kModeIndividual = 0;
    static kModeTeams = 1;

    // Indicates which team a player can be part of. Individuals are always part of team 0, whereas
    // players can be part of either Team Alpha or Team Bravo in team-based games.
    static kTeamIndividual = 0;
    static kTeamAlpha = 0;
    static kTeamBravo = 1;

    #location_ = null;
    #mode_ = null;
    #spawns_ = null;

    async onInitialized(settings, registry) {
        await super.onInitialized(settings);

        // TODO: Derive the desired fight move from the given |settings|.
        this.#mode_ = FightGame.kModeIndividual;

        // Get the FightLocation instance from the |registry|, based on the given |settings|.
        this.#location_ = registry.getLocation(settings.get(kLocationSetting));
        if (!this.#location_)
            throw new Error(`Invalid fight location given: ${settings.get(kLocationSetting)}`);
        
        // Determine the spawn positions for the game. These differ between individual games and
        // team-based games, as players will want to be spread out in a different manner.
        {
            const teams = [];
            switch (this.#mode_) {
                case FightGame.kModeIndividual:
                    teams.push(FightGame.kTeamIndividual);
                    break;
                
                case FightGame.kModeTeams:
                    teams.push(FightGame.kTeamAlpha);
                    teams.push(FightGame.kTeamBravo);
                    break;
            }

            // Initialize the spawn positions as a map from team to an object containing the actual
            // spawn positions, as well as the most recently used index.
            this.#spawns_ = new Map(teams.map(team => {
                return [
                    team,
                    {
                        positions: this.#location_.getSpawnPositions(this.#mode_, team),
                        index: 0,
                    }
                ];
            }));
        }
    }

    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        // TODO: For team-based games, put the player in an appropriate team.
    }

    async onPlayerSpawned(player, countdown) {
        await super.onPlayerAdded(player, countdown);

        // Determine the spawn position for the |player|. Players will iterative spawn in each of
        // the positions available for their team, or the set of individual spawns.
        const spawns = this.#spawns_.get(this.getTeamForPlayer(player));
        const spawnPosition = spawns.positions[(spawns.index++) % spawns.positions.length];

        player.position = spawnPosition.position;
        player.rotation = spawnPosition.rotation;
    }

    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the team that the player is part of.
    getTeamForPlayer(player) { return FightGame.kTeamIndividual; }
}
