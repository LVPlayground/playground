// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Base class for all features in the gamemode that consider themselves to be a game. Each game must
// be registered with the Games feature, which is able to create a new instance of these classes.
export class Game {
    // ---------------------------------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------------------------------

    // Gets the set of Players who are currently in the game.
    get players() { return this.#runtime_.player; }

    // Gets the scoped entities which can be used to create objects, pickups and so on.
    get scopedEntities() { return this.#scopedEntities_; }

    // ---------------------------------------------------------------------------------------------
    // Methods
    // ---------------------------------------------------------------------------------------------

    // Signals that the |player| has lost. They will be removed from the game.
    playerLost(player, score) { this.#runtime_.playerLost(player, score); }

    // Signals that the |player| has won. They will be removed from the game.
    playerWon(player, score) { this.#runtime_.playerWon(player, score); }

    // Immediately stops the game, and removes all players.
    stop() { this.#runtime_.stop(); }

    // ---------------------------------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------------------------------

    // Called when the Game has just been created. Enables data to be loaded from disk / the
    // database, as well as objects to be initialized. Use the `scopedEntities` please.
    async onInitialized() {}

    // Called at a periodic interval if the game requested a tick in its options.
    async onTick() {}

    // Called when the game has finished, and it's time to clean up additional state.
    async onFinished() {}

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has been added to the game.
    async onPlayerAdded(player) {}

    // Called when the |player| has spawned in the game. They are already in the appropriate virtual
    // world that has been assigned to the game, but not in any particular interior.
    // When a countdown has been configured for this game, a personalized experience will be
    // included for the player in the |countdown| argument, which would be an asynchronous function.
    async onPlayerSpawned(player, countdown) {}

    // Called when the |player| has either died, or been killed by the |killer| when that has been
    // set. The |reason| indicates the death reason as to why they died.
    async onPlayerDeath(player, killer, reason) {}

    // Called when the |player| has been removed from the game.
    async onPlayerRemoved(player) {}

    // ---------------------------------------------------------------------------------------------
    // Internal, the following method(s) and properties are considered private.
    // ---------------------------------------------------------------------------------------------

    #runtime_ = null;
    #scopedEntities_ = null;

    constructor(runtime, scopedEntities) {
        this.#runtime_ = runtime;
        this.#scopedEntities_ = scopedEntities;
    }
}
