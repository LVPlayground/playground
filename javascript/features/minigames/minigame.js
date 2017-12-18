// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MinigameSettings from 'features/minigames/minigame_settings.js';

// Base class that all minigames have to extend. Contains default implementations of the event
// handlers that are available, and makes sure that certain bits of information are available.
class Minigame {
    constructor(settings) {
        this.settings_ = new MinigameSettings(settings);

        // The driver that will be in control of managing this minigame. Created when attaching
        // the minigame to the Minigame Manager.
        this.driver_ = null;
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the settings associated with this minigame. Immutable.
    get settings() { return this.settings_; }

    // ---------------------------------------------------------------------------------------------

    // Gets an iterator for the active players in this minigame. Only available after creating the
    // minigame with the minigame manager, which creates the driver for us.
    get activePlayers() { return this.driver_.activePlayers; }

    // Gets the set of entities available for this minigame. Only available after creating the
    // minigame with the minigame manager, which creates the driver for us.
    get entities() { return this.driver_.entities; }

    // Gets the state this minigame is in. Only available after creating the minigame with the
    // minigame manager, which creates the driver for us.
    get state() { return this.driver_.state; }

    // Gets the virtual world Id in which this minigame should take place. Only available after
    // creating the minigame with the minigame manager, which creates the driver for us.
    get virtualWorld() { return this.driver_.virtualWorld; }

    // ---------------------------------------------------------------------------------------------

    // Removes the |player| from the minigame because of |reason|. Only available after creating the
    // minigame with the minigame manager, which creates the driver for us.
    removePlayer(player, reason) {
        this.driver_.removePlayer(player, reason);
    }

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

    // Attaches the |driver| to the minigame. Must only be called by the minigame system.
    attachDriver(driver) {
        if (this.driver_ !== null)
            throw new Error('The minigame has already been attached to the minigame manager.');

        this.driver_ = driver;
    }

    // Called when the minigame is being disposed of.
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
Minigame.REASON_DROPPED_OUT = 1;
Minigame.REASON_DISCONNECT = 2;
Minigame.REASON_FINISHED = 3;

export default Minigame;
