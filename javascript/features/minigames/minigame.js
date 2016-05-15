// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Dictionary of the required settings together with the expected JavaScript variable type.
const REQUIRED_SETTINGS = {
    // The player-visible name describing the minigame
    name: 'string',

    // The maximum number of players that can participate in the minigame
    maximumParticipants: 'number'
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
        this.driver_ = null;

        this.minimumParticipants_ = settings.minimumParticipants || 1;
        this.maximumParticipants_ = settings.maximumParticipants;
    }

    // Gets the name of this minigame.
    get name() { this.name_; }

    // Gets the state this minigame is in. Only available after creating the minigame with the
    // minigame manager, which creates the driver for us.
    get state() { return this.driver_.state; }

    // Gets the minimum number of participants in this minigame.
    get minimumParticipants() { return this.minimumParticipants_; }

    // Gets the maximum number of participants in this minigame.
    get maximumParticipants() { return this.maximumParticipants_; }

    // Sets the driver that's running this minigame.
    set driver(value) { this.driver_ = value; }

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

// States that a minigame can be in.
Minigame.STATE_SIGN_UP = 0;
Minigame.STATE_LOADING = 1;
Minigame.STATE_RUNNING = 2;
Minigame.STATE_FINISHED = 3;

// Reasons that a minigame can be finished.
Minigame.REASON_NOT_ENOUGH_PLAYERS = 0;
Minigame.REASON_FORCED_STOP = 1;

// Reasons that can cause a player to be removed from the minigame.
Minigame.REASON_DISCONNECT = 0;
Minigame.REASON_FINISHED = 1;

exports = Minigame;
