// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Objective } from 'features/games_deathmatch/objectives/objective.js';

import { difference } from 'base/set_extensions.js';

// Objective where each participant has a certain number of lives before they drop out of the game.
// This encapsulates both "last man standing" and games where participants have multiple lives.
export class LivesObjective extends Objective {
    #lives_ = null;
    #participants_ = null;

    // Called when the game initializes, with the |settings| that have been given for the particular
    // game, which is either predefined or configured by a player. Captures the number of lives.
    async initialize(game, settings) {
        await super.initialize(game, settings);

        this.#lives_ = settings.lives ?? 1;
        this.#participants_ = new WeakMap();
    }

    // Called when the given |player| has been added to the game. Records them as having the default
    // number of lives remaining, so that they can enjoy the game to its fullest.
    async onPlayerAdded(player) {
        this.#participants_.set(player, this.#lives_);
    }

    // Called when the given |player| has died, potentially having been killed by the |killer|
    // (which may be NULL) through the given |reason|. Decrease their lives by one, and throw them
    // out of the game when they've reached zero remaining lives.
    async onPlayerDeath(player, killer, reason) {
        const remainingLives = this.#participants_.get(player) ?? /* fall-back value= */ 1;

        // If the |player| has no more lives left, drop them out of the game immediately upon dying.
        if (remainingLives <= 1)
            this.game.playerLost(player);
        else
            this.#participants_.set(player, remainingLives - 1);
    }

    // Called when the given |player| has left the game, so we clean up their state. If there are
    // only two players left in the game (the |player| and one other), we mark them as having won.
    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        // If there are only two players left in the game, with the |player| leaving, we'll declare
        // the remaining participant as the winner of the match.
        const remainingPlayers = difference(this.game.players, new Set([ player ]));
        if (remainingPlayers.size === 1)
            this.game.playerWon([ ...remainingPlayers ][0]);

        // Clear up the state for the given |player|.
        this.#participants_.delete(player);
    }
}
