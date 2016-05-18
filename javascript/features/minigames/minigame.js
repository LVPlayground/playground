// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Dictionary of the required settings together with the expected JavaScript variable type.
const REQUIRED_SETTINGS = {
    // The player-visible name describing the minigame.
    name: 'string',

    // The command that players can type to participate in the minigame.
    command: 'string',

    // The maximum number of time the minigame may last for, in seconds.
    timeout: 'number',

    // TODO(Russell): It should cost money to participate in minigames. They should also offer some
    // form of prize money after the minigame has been completed.

    // The maximum number of players that can participate in the minigame.
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
        this.command_ = settings.command;
        this.timeout_ = settings.timeout;

        this.driver_ = null;

        this.minimumParticipants_ = settings.minimumParticipants || 1;
        this.maximumParticipants_ = settings.maximumParticipants;

        // Whether the player can die and respawn within the minigame.
        this.enableRespawn_ = !!settings.enableRespawn;
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the name of this minigame.
    get name() { return this.name_; }

    // Gets the command through which players can join this minigame.
    get command() { return this.command_; }

    // Gets the maximum number of seconds the minigame is allowed to last for.
    get timeout() { return this.timeout_; }

    // Gets the set of entities available for this minigame. Only available after creating the
    // minigame with the minigame manager, which creates the driver for us.
    get entities() { return this.driver_.entities; }

    // Gets the state this minigame is in. Only available after creating the minigame with the
    // minigame manager, which creates the driver for us.
    get state() { return this.driver_.state; }

    // Gets the virtual world Id in which this minigame should take place. Only available after
    // creating the minigame with the minigame manager, which creates the driver for us.
    get virtualWorld() { return this.driver_.virtualWorld; }

    // Gets the minimum number of participants in this minigame.
    get minimumParticipants() { return this.minimumParticipants_; }

    // Gets the maximum number of participants in this minigame.
    get maximumParticipants() { return this.maximumParticipants_; }

    // Gets whether the player can die and respawn within the minigame.
    get enableRespawn() { return this.enableRespawn_; }

    // Sets the driver that's running this minigame.
    set driver(value) { this.driver_ = value; }

    // ---------------------------------------------------------------------------------------------

    // Will be called when |player| has joined the minigame. Unless otherwise configured, this
    // method will only be invoked when the minigame is still in sign-up phase.
    onPlayerAdded(player) {}

    // Will be called when the minigame advances to loading state. Must return a promise that has to
    // be resolved when the minigame-specific loading routines have finished.
    onLoad() { return Promise.resolve(); }

    // Will be called when the minigame advances to the running state. Must return a promise that
    // has to be resolved when the minigame-specific starting routines have finished.
    onStart() { return Promise.resolve(); }

    // Will be called when the |player| has died. Unless otherwise configured, they will be removed
    // from the minigame immediately after this call.
    onPlayerDeath(player, reason) {}

    // Will be called when the |player| has spawned.
    onPlayerSpawn(player) {}

    // Will be called when the |player| has entered the |vehicle| as a driver.
    onPlayerEnterVehicle(player, vehicle) {}

    // Will be called when the |player| has left their vehicle.
    onPlayerLeaveVehicle(player) {}

    // Will be called when the |vehicle|, which must be scoped to this minigame, has spawned.
    onVehicleSpawn(vehicle) {}

    // Will be called when the |vehicle|, which must be scoped to this minigame, has been destroyed.
    onVehicleDeath(vehicle) {}

    // Will be called when |player| has left the minigame because of |reason|. The player will
    // already have been removed from the set of active players.
    onPlayerRemoved(player, reason) {}

    // Will be called when the minigame has finished. Must return a promise that has to be resolved
    // when clean-up has finished. All active players will be respawned after this call finishes. 
    onFinish(reason) { return Promise.resolve(); }

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
Minigame.REASON_TIMED_OUT = 1;
Minigame.REASON_FORCED_STOP = 2;

// Reasons that can cause a player to be removed from the minigame.
Minigame.REASON_DEATH = 0;
Minigame.REASON_DISCONNECT = 1;
Minigame.REASON_FINISHED = 2;

exports = Minigame;
