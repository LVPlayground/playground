// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FightGame } from 'features/fights/fight_game.js';

// Represents the location at which a fight will take place. Locations have a high amount of
// requirements, as we want to provide flexibility to players when they set up the rules for a
// particular fight. All of those are codified in this object.
export class FightLocation {
    #description_ = null;

    constructor(description) {
        this.#description_ = description;
    }

    // Gets the name for this location. Used by commands to refer to individual locations too.
    get name() { return this.#description_.name; }

    // Returns an array with the spawn positions for this game, in the given |mode|. When the mode
    // is team-based play, the |teamIndex| should be set.
    getSpawnPositions(mode, teamIndex = null) {
        switch (mode) {
            case FightGame.kModeIndividual:
                return this.#description_.spawnPositions.individual;

            case FightGame.kModeTeams:
                const spawnPositions = this.#description_.spawnPositions.teams;
                if (teamIndex < 0 || teamIndex >= spawnPositions.length)
                    throw new Error(`No spawn positions are defined for team #${teamIndex}.`);
                
                return spawnPositions[teamIndex];

            default:
                throw new Error(`Invalid game mode given: ${mode}.`);
        }
    }

    // Called when requesting a string representation of this location.
    toString() { return `[FightLocation: "${this.#description_.descriptionFilename}"]`; }
}
