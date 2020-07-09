// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';
import { TeamResolver } from 'features/games_deathmatch/teams/team_resolver.js';

import { random } from 'base/random.js';
import { shuffle } from 'base/shuffle.js';

// Resolves teams in a randomized way. This means that the teams will have roughly the same amount
// of participants in them, but deciding which team somebody ends up on is done by a dice roll.
export class RandomizedTeamsResolver extends TeamResolver {
    #teamAlpha_ = new Set();
    #teamBravo_ = new Set();

    // Called when the |player| has been removed from the game. Keep track of that
    onPlayerRemoved(player) {
        this.#teamAlpha_.delete(player);
        this.#teamBravo_.delete(player);
    }

    // Resolves the intended teams for the given |players|, a sequence. We achieve this by shuffling
    // the sequence of |players| and cutting it in half, rather than doing individual coin flips.
    resolve(players) {
        const shuffledPlayers = shuffle([ ...players ]);
        const middle = Math.floor(shuffledPlayers.length / 2);

        // (1) Actually divide the |shuffledPlayers| in two teams.
        const teamAlpha = shuffledPlayers.slice(0, middle);
        const teamBravo = shuffledPlayers.slice(middle);
        const teams = [];

        // (2) Add all the players of |teamAlpha| to that team.
        for (const player of teamAlpha) {
            teams.push({ player, team: DeathmatchGame.kTeamAlpha });
            this.#teamAlpha_.add(player);
        }

        // (3) Add all the players of |teamBravo| to that team.
        for (const player of teamBravo) {
            teams.push({ player, team: DeathmatchGame.kTeamBravo });
            this.#teamBravo_.add(player);
        }

        // (4) And we're done - the teams have been divided.
        return teams;
    }

    // Resolves the intended team for the given |player|, who may have joined late. They will join
    // the team with the fewest members, or join one based on a coin flip instead.
    resolveForPlayer(player) {
        // (1) Assign the |player| to either team alpha or bravo if they're currently unbalanced.
        if (this.#teamAlpha_.size < this.#teamBravo_.size) {
            this.#teamAlpha_.add(player);
            return DeathmatchGame.kTeamAlpha;
        }

        if (this.#teamBravo_.size < this.#teamAlpha_.size) {
            this.#teamBravo_.add(player);
            return DeathmatchGame.kTeamBravo;
        }

        // (2) Do a coin flip: [0, 99] (inclusive), 0-49 are Team Alpha, 50-99 are Team Bravo.
        if (random(100) < 50) {
            this.#teamAlpha_.add(player);
            return DeathmatchGame.kTeamAlpha;
        } else {
            this.#teamBravo_.add(player);
            return DeathmatchGame.kTeamBravo;
        }
    }
}
