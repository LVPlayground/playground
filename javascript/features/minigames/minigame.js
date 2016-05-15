// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Dictionary of the required settings together with the expected JavaScript variable type.
const REQUIRED_SETTINGS = {
    name: 'string'
};

// Base class that all minigames have to extend. Contains default implementations of the event
// handlers that are available, and makes sure that certain bits of information are available.
class Minigame {
    constructor(settings) {
        // Validate that the |settings| object is complete.
        Object.entries(REQUIRED_SETTINGS).forEach(([name, type]) => {
            if (!settings.hasOwnProperty(name))
                throw new Error('The minigame must have a "' + name + '" setting.');

            if (typeof settings[name] !== type)
                throw new Error('The minigame setting "' + name + '" must be a ' + type + '.');
        });

        this.name_ = settings.name;
    }

    // Gets the name of this minigame. 
    get name() { this.name_; }

    // ---------------------------------------------------------------------------------------------

    // Will be called when |player| has joined the minigame. Unless otherwise configured, this
    // method will only be invoked when the minigame is still in sign-up phase.
    onPlayerAdded(player) {}

    // Will be called when |player| has left the minigame because of |reason|. The player will
    // already have been removed from the set of active players.
    onPlayerRemoved(player, reason) {}

    // Will be called when the minigame has finished. All active players will be respawned after
    // this call has finished.
    onFinished(reason) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

// Reasons that a minigame can be finished.
Minigame.REASON_NO_MORE_PLAYERS = 0;

// Reasons that can cause a player to be removed from the minigame.
Minigame.REASON_DISCONNECT = 0;

exports = Minigame;
