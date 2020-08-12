// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'components/interface/countdown.js';
import { Objective } from 'features/games_deathmatch/objectives/objective.js';

import { difference } from 'base/set_extensions.js';

// Timed objective, where the game is limited to a certain period of time. A countdown will be
// displayed on each participant's screen telling them about how much time is remaining.
export class TimedObjective extends Objective {
    #countdown_ = null;

    // Called when the game initializes, with the |settings| that have been given for the particular
    // game, which is either predefined or configured by a player.
    async initialize(game, settings) {
        await super.initialize(game, settings);

        this.#countdown_ = new Countdown({ seconds: settings.seconds });
        this.#countdown_.finished.then(() => this.onCountdownFinished());
    }

    // Called when the given |player| has been added to the game. We use this time to make sure that
    // the countdown will have been appropriately created for the |player|.
    async onPlayerAdded(player) {
        this.#countdown_.displayForPlayer(player);
    }

    // Called when the countdown has finished. Will rank all players and drop them out in order,
    // making sure that a winner will be decided based on their kills & death ratios.
    onCountdownFinished() {
        // The game has ended. Create a tally of all remaining participants, order them by number of
        // kills in ascending order, and then drop them out in sequence.
        const participants = [];

        // (1) Get all the necessary information from the participants.
        for (const player of this.game.players) {
            const statistics = this.game.getStatisticsForPlayer(player);
            participants.push({
                player,
                kills: statistics.killCount,  // primary sort
                damage: statistics.damageGiven,  // secondary sort
            });
        }

        // (2) Sort them in ascending order. Kill count primary, damage given secondary.
        participants.sort((left, right) => {
            if (left.kills === right.kills)
                return left.damage > right.damage ? 1 : -1;

            return left.kills > right.kills ? 1 : -1;
        });

        // (3) Pop the winner from the |participants|. They will automatically be ejected when all
        // other participants have been removed from the game as losers.
        participants.pop();  // <-- the winner!

        // (4) Mark all the remaining |participants| as losers in the game.
        for (const { player, kills } of participants)
            this.game.playerLost(player, kills);
    }

    // Called when the given |player| has left the game. We never remove the winner, when the time
    // ends, which also allows for the case where all participants but one leave the game.
    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        // Remove the countdown for the given |player|, they won't care anymore.
        this.#countdown_.hideForPlayer(player);

        // If there are only two players left in the game, with the |player| leaving, we'll declare
        // the remaining participant as the winner of the match.
        const remainingPlayers = difference(this.game.players, new Set([ player ]));
        if (remainingPlayers.size === 1)
            this.game.playerWon([ ...remainingPlayers ][0]);
    }

    // Called when the game has finished, and everything is shutting down.
    async finalize() {
        await super.finalize();

        this.#countdown_.dispose();
        this.#countdown_ = null;
    }
}
