// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'features/games_deathmatch/interface/countdown.js';
import { Objective } from 'features/games_deathmatch/objectives/objective.js';

// Timed objective, where the game is limited to a certain period of time. A countdown will be
// displayed on each participant's screen telling them about how much time is remaining.
export class TimedObjective extends Objective {
    #countdown_ = null;
    #expireTime_ = null;

    // Called when the game initializes, with the |settings| that have been given for the particular
    // game, which is either predefined or configured by a player.
    async initialize(game, settings) {
        await super.initialize(game, settings);

        this.#countdown_ = new Countdown();
        this.#expireTime_ =
            server.clock.monotonicallyIncreasingTime() + settings.seconds * 1000;
    }

    // Called when the given |player| has been added to the game. We use this time to make sure that
    // the countdown will have been appropriately created for the |player|.
    async onPlayerAdded(player) {
        this.#countdown_.createForPlayer(player);
    }

    // Called every second or so as the game progresses. Makes sure that we decide the rankings and
    // throw players out of the game in order when the countdown reaches zero.
    async onTick() {
        const remaining = this.#expireTime_ - server.clock.monotonicallyIncreasingTime();
        if (remaining > 0) {
            this.#countdown_.update(Math.floor(remaining / 1000));
            return;
        }

        // The game has ended. Create a tally of all remaining participants, order them by number of
        // kills in ascending order, and then drop them out in sequence.
        const participants = [];

        // (1) Get all the necessary information from the participants.
/*        for (const [ player, state ] of this.#state_) {
            const statistics = player.stats.diff(state.statistics);
            participants.push({
                player,
                kills: statistics.killCount,  // primary sort
                damage: statistics.damageGiven,  // secondary sort
            })
        }*/

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
            await this.game.playerLost(player, kills);
    }

    // Called when the game has finished, and everything is shutting down.
    async finalize() {
        await super.finalize();

        this.#countdown_.dispose();
        this.#countdown_ = null;
    }
}
