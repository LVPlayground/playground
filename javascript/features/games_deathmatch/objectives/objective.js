// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Each deathmatch game has an objective, which has been implemented by one of the various Objective
// implementations. This is the interface upon which they can be built.
export class Objective {
    #game_ = null;

    // Gets the game instance that owns this particular objective.
    get game() { return this.#game_; }

    // Called when the game initializes, with the |settings| that have been given for the particular
    // game, which is either predefined or configured by a player.
    async initialize(game, settings) {
        this.#game_ = game;
    }

    // Called every second or so as the game progresses.
    async onTick() {}

    // Called when the given |player| has been added to the game.
    async onPlayerAdded(player) {}

    // Called when the given |player| has died, potentially having been killed by the |killer|
    // (which may be NULL) through the given |reason|.
    async onPlayerDeath(player, killer, reason) {}

    // Called when the given |player| has left the game, either by their own choice or because the
    // objective kicked them out.
    async onPlayerRemoved(player) {}

    // Called when the game has finished, and everything is shutting down.
    async finalize() {
        this.#game_ = null;
    }
}
