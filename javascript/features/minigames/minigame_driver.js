// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');

// A minigame driver contains the information required to run an individual minigame. It will keep
// track of the engaged players, their states and will automatically unregister the minigame when
// no more players are engaged with it.
class MinigameDriver {
    constructor(manager, category, minigame) {
        this.manager_ = manager;
        this.category_ = category;
        this.minigame_ = minigame;

        // Set containing the players actively engaged in the minigame.
        this.activePlayers_ = new Set();

        // Set containing *all* players that have been engaged with the minigame.
        this.players_ = new Set();
    }

    // Gets the set of players who are currently actively engaged in the minigame.
    get activePlayers() { return this.activePlayers_; }

    // Gets the minigame that has been wrapped by this driver.
    get minigame() { return this.minigame_; }

    // Finishes the minigame. The minigame will be informed, after which the remaining players will
    // be respawned and the minigame will be removed from the manager.
    finish(reason) {
        this.minigame_.onFinished(reason);

        for (let player of this.activePlayers_) {
            this.restorePlayerState(player);
            this.manager_.didRemovePlayerFromMinigame(player);
        }

        this.activePlayers_.clear();

        // Informs the manager that the minigame owned by this driver has finished.
        this.manager_.didFinishMinigame(this.category_, this);
    }

    // Restores the state of |player| by respawning them in the main world and deserializing their
    // state in the Pawn part of Las Venturas Playground.
    restorePlayerState(player) {
        // TODO(Russell): Restore the player's state.
    }

    // Adds |player| to the minigame.
    addPlayer(player) {
        // TODO(Russell): Make sure that the minigame is in sign-up phase unless it's configured
        // to allow players being added at any time. (In which case their state needs to be set up).

        this.activePlayers_.add(player);
        this.players_.add(player);

        // Inform the minigame about |player| having joined the game.
        this.minigame_.onPlayerAdded(player);
    }

    // Removes |player| from the minigame because of |reason|. Will trigger the onPlayerRemoved
    // method on the minigame object, and free the |player|'s state in the minigame manager.
    removePlayer(player, reason) {
        if (!this.activePlayers_.has(player))
            return;

        this.activePlayers_.delete(player);

        // Inform the minigame about |player| leaving the activity.
        this.minigame_.onPlayerRemoved(player, reason);

        // Restore their state after the minigame had a chance to do their things.
        this.restorePlayerState(player);

        // Clear the player's state from the minigame manager.
        this.manager_.didRemovePlayerFromMinigame(player);

        // TODO(Russell): Allow this to be configurable to another >=0 number.
        if (!this.activePlayers_.size)
            this.finish(Minigame.REASON_NO_MORE_PLAYERS);
    }
}

exports = MinigameDriver;
