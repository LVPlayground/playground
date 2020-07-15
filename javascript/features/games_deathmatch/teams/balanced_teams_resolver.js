// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';
import { TeamResolver } from 'features/games_deathmatch/teams/team_resolver.js';

// Comperator function for sorting an array in descending order.
function sortDescending(left, right) {
    if (left === right)
        return 0;
    
    return left > right ? -1 : 1;
}

// Resolves teams in a balanced manner, i.e. looks at player statistics, experience, ranks them and
// then tries to divide the players in two groups in a fair manner.
export class BalancedTeamsResolver extends TeamResolver {
    #teamAlpha_ = new Set();
    #teamAlphaScore_ = 0;

    #teamBravo_ = new Set();
    #teamBravoScore_ = 0;

    // Called when the |player| has been removed from the game. Keep track of that
    onPlayerRemoved(player) {
        if (this.#teamAlpha_.has(player)) {
            this.#teamAlphaScore_ -= this.#teamAlpha_.get(player);
            this.#teamAlpha_.delete(player);
        }
        
        if (this.#teamBravo_.has(player)) {
            this.#teamBravoScore_ -= this.#teamBravo_.get(player);
            this.#teamBravo_.delete(player);
        }
    }

    // Resolves the intended teams for the given |players|, a sequence. We achieve this by ranking
    // all |players| based on their skill, and then even-odd dividing them into teams.
    resolve(players) {
        const scoresArray = [ ...this.computePlayerScores(players) ];

        // (1) Sort the |scoresArray| in descending order based on the scores. That gives us the
        // rankings based on which we can divide the teams.
        scoresArray.sort((left, right) => {
            if (left[1] === right[1])
                return 0;
            
            return left[1] > right[1] ? -1 : 1;
        });

        // (2) Now even/odd divide each of the players. Begin by assigning the top player to team
        // Alpha, and then work our way down the list. A future improvement on this algorithm would
        // be to allow uneven participant counts from initial division.
        const teams = [];

        let currentTeam = DeathmatchGame.kTeamAlpha;
        while (scoresArray.length > 0) {
            const [ player, score ] = scoresArray.shift();

            // (3) If the |player| is the last player to assign, and the teams are balanced in
            // number of participants, prefer the weakest team for them instead.
            if (!scoresArray.length && this.#teamAlpha_.size === this.#teamBravo_.size) {
                if (this.#teamAlphaScore_ > this.#teamBravoScore_)
                    currentTeam = DeathmatchGame.kTeamBravo;
                else if (this.#teamBravoScore_ > this.#teamAlphaScore_)
                    currentTeam = DeathmatchGame.kTeamAlpha;
            }

            teams.push({ player, team: currentTeam });

            if (currentTeam === DeathmatchGame.kTeamAlpha) {
                this.#teamAlpha_.add(player);
                this.#teamAlphaScore_ += score;

                currentTeam = DeathmatchGame.kTeamBravo;

            } else {
                this.#teamBravo_.add(player);
                this.#teamBravoScore_ += score;

                currentTeam = DeathmatchGame.kTeamAlpha;
            }
        }

        // (4) Return the |teams| per the API contract, and we're done.
        return teams;
    }

    // Resolves the intended team for the given |player|, who may have joined late. We will do a
    // recalculation of the team scores, and then add the |player| to the team who needs them most.
    resolveForPlayer(player) {
        this.#teamAlphaScore_ = 0;
        this.#teamBravoScore_ = 0;

        // (1) Recalculate the total scores of both teams based on the adjusted rankings.
        const scores = this.computePlayerScores([ player ]);
        for (const [ participant, score ] of scores) {
            if (this.#teamAlpha_.has(participant))
                this.#teamAlphaScore_ += score;
            else if (this.#teamBravo_.has(participant))
                this.#teamBravoScore_ += score;
        }

        // (2) We allow a difference in number of participants per team that equates 10% of the
        // total number of participants. That means that for 10 participants we allow 4/6, and for
        // 20 participants we allow 8/12, if the skill level allows.
        const allowableDifference =
            Math.floor((this.#teamAlpha_.size + this.#teamBravo_.size + 1) / 10);
        
        if (this.#teamAlpha_.size < (this.#teamBravo_.size - allowableDifference)) {
            this.#teamAlpha_.add(player);
            this.#teamAlphaScore_ += scores.get(player);

            return DeathmatchGame.kTeamAlpha;

        } else if (this.#teamBravo_.size < (this.#teamAlpha_.size - allowableDifference)) {
            this.#teamBravo_.add(player);
            this.#teamBravoScore_ += scores.get(player);

            return DeathmatchGame.kTeamBravo;
        }

        // (3) Otherwise, we assign the |player| to the team who needs them most.
        if (this.#teamAlphaScore_ > this.#teamBravoScore_) {
            this.#teamBravo_.add(player);
            this.#teamBravoScore_ += scores.get(player);

            return DeathmatchGame.kTeamBravo;

        } else {
            this.#teamAlpha_.add(player);
            this.#teamAlphaScore_ += scores.get(player);

            return DeathmatchGame.kTeamAlpha;
        }
    }

    // Determines the score of the given |player|. We rank all participants, both current and new
    // ones in the given |players|, and assign each a score based. The score is based on their ranks
    // in number of kills (45%), damage ratio (20%), shot ratio (20%) and accuracy (15%).
    computePlayerScores(players) {
        const participants = [ ...this.#teamAlpha_.keys(), ...this.#teamBravo_.keys(), ...players ];
        const statistics = new Map();

        // (1) Store all dimensions for the |player| in the |statistics| map. A separate routine
        // will sort each of the individual metrics, and assign ranks to them.
        for (const player of participants) {
            const stats = player.stats.enduring;

            statistics.set(player, {
                kills: stats.killCount,
                damageRatio: stats.damageTaken > 0 ? stats.damageGiven / stats.damageTaken : 0,
                shotRatio: stats.shotsTaken > 0 ? stats.shotsHit / stats.shotsTaken : 0,
                accuracy:
                    stats.shotsHit > 0 ? stats.shotsHit / (stats.shotsHit + stats.shotsMissed) : 0,
            });
        }

        // (2) Determine the rankings of each player in each of those catagories.
        const rankings = this.determineRankings(statistics);
        const scores = new Map();

        // (3) Populate the score map based on the rankings and the documented calculation.
        for (const player of participants) {
            const playerRankings = rankings.get(player);

            // Get the values to calculate with. Negate parity, as better rankings should give the
            // player a higher score. It keeps the rest of this system more readable.
            const killsValue = participants.length - playerRankings.kills;
            const damageRatioValue = participants.length - playerRankings.damageRatio;
            const shotRatioValue = participants.length - playerRankings.shotRatio;
            const accuracyValue = participants.length - playerRankings.accuracy;

            // Calculate the score for the player.
            scores.set(
                player,
                killsValue * 45 + damageRatioValue * 20 + shotRatioValue * 20 + accuracyValue * 15);
        }

        return scores;
    }

    // Determines the rankings of each players in each of the categories stored in |statistics|.
    // Will return a map with the same keys & statistics, but with ranks rather than values. This
    // method looks complicated, but due to sorting it comes down to having a time complexity of
    // Θ(n log(n)), which is more than reasonable for what it does.
    determineRankings(statistics) {
        const individualMetrics = {
            kills: [],
            damageRatio: [],
            shotRatio: [],
            accuracy: [],
        };

        // (1) Tally the individual metrics from each of the players in an array.
        for (const metrics of statistics.values()) {
            for (const [ property, value ] of Object.entries(metrics))
                individualMetrics[property].push(value);
        }

        // (2) Sort each of the |individualMetrics| in either ascending or descending order, which
        // depends on the sort of data it contains. The best should come first.
        individualMetrics.kills.sort(sortDescending);
        individualMetrics.damageRatio.sort(sortDescending);
        individualMetrics.shotRatio.sort(sortDescending);
        individualMetrics.accuracy.sort(sortDescending);

        // (3) Create a map with the individual ranks for each of the metrics. They're keyed by
        // the value, and valued by the rank associated with the value.
        const individualRanks = {
            kills: new Map(),
            damageRatio: new Map(),
            shotRatio: new Map(),
            accuracy: new Map(),
        };

        for (const [ property, rankings ] of Object.entries(individualMetrics)) {
            for (let index = 0; index < rankings.length; ++index)
                individualRanks[property].set(rankings[index], /* rank= */ index + 1);
        }

        // (4) Create the rankings map based on the |individualRanks|, associated by player.
        const rankings = new Map();

        for (const [ player, metrics ] of statistics) {
            rankings.set(player, {
                kills: individualRanks.kills.get(metrics.kills),
                damageRatio: individualRanks.damageRatio.get(metrics.damageRatio),
                shotRatio: individualRanks.shotRatio.get(metrics.shotRatio),
                accuracy: individualRanks.accuracy.get(metrics.accuracy),
            });
        }

        // (5) Return the |rankings|, and our job is completed.
        return rankings;
    }
}
