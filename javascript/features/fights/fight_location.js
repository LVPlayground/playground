// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { shuffle } from 'base/shuffle.js';

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

    // Gets the short name for this location. Used for automatically generated match names.
    get shortName() { return this.#description_.shortName; }

    // Returns the objects that should be shown for this location. Objects are optional, although
    // many locations are using custom maps or modifications.
    getObjects() { return this.#description_.objects ?? []; }

    // Returns the pickups that could be spawned as part of this game. Generally they are health
    // and armour pickups, and occassionally a weapon.
    getPickups() { return this.#description_.pickups ?? []; }

    // Returns an array with the spawn positions for this game. When the |hasTeams| flag has been
    // set, the |teamIndex| must be given to indicate which team to select positions for.
    getSpawnPositions(hasTeams, teamIndex = null) {
        if (!hasTeams)
            return shuffle(this.#description_.spawnPositions.individual);

        const spawnPositions = this.#description_.spawnPositions.teams;
        if (teamIndex < 0 || teamIndex >= spawnPositions.length)
            throw new Error(`No spawn positions are defined for team #${teamIndex}.`);

        return shuffle(spawnPositions[teamIndex]);
    }

    // Returns the world boundaries that have been set for this location. This is optional: some
    // locations do not require boundaries. Defined as a Rect, or null when absent.
    getWorldBoundaries() { return this.#description_?.environment?.boundaries ?? null; }

    // Called when requesting a string representation of this location.
    toString() { return `[FightLocation: "${this.#description_.descriptionFilename}"]`; }
}
