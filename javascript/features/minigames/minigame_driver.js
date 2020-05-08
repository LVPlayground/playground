// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Minigame from 'features/minigames/minigame.js';
import ScopedEntities from 'entities/scoped_entities.js';

// A minigame driver contains the information required to run an individual minigame. It will keep
// track of the engaged players, their states and will automatically unregister the minigame when
// no more players are engaged with it.
class MinigameDriver {
    constructor(manager, category, minigame) {
        this.manager_ = manager;
        this.category_ = category;
        this.minigame_ = minigame;
        this.settings_ = minigame.settings;

        minigame.attachDriver(this);

        // Set containing the players actively engaged in the minigame.
        this.activePlayers_ = new Set();

        // Set of scoped entities available for this minigame.
        this.entities_ = new ScopedEntities();

        // The current state of the minigame.
        this.state_ = Minigame.STATE_SIGN_UP;

        // Assign a unique virtual world Id to the minigame.
        this.virtualWorld_ = VirtualWorld.acquire('minigame: ' + minigame.name);
    }

    // Gets the set of players who are currently actively engaged in the minigame.
    get activePlayers() { return this.activePlayers_; }

    // Gets the minigame that has been wrapped by this driver.
    get minigame() { return this.minigame_; }

    // Gets the set of scoped entities that can be created and removed for this minigame.
    get entities() { return this.entities_; }

    // Gets or sets the current state of the minigame.
    get state() { return this.state_; }
    set state(value) {
        if (value < this.state_)
            throw new Error('The state of a minigame can only be advanced.');

        this.state_ = value;
    }

    // Gets the unique virtual world Id that has been assigned to this minigame.
    get virtualWorld() { return this.virtualWorld_; }

    // ---------------------------------------------------------------------------------------------

    // Adds |player| to the minigame. This method must only be called by the MinigameManager.
    addPlayer(player) {
        if (this.state_ != Minigame.STATE_SIGN_UP)
            throw new Error('Players can only be added to a minigame when it is accepting signups');

        this.activePlayers_.add(player);

        // Inform the minigame about |player| having joined the game.
        this.minigame_.onPlayerAdded(player);

        // Begin loading the minigame when the maximum number of players has been reached.
        if (this.activePlayers_.size >= this.settings_.maximumParticipants)
            this.load();
    }

    // Removes |player| from the minigame because of |reason|. Will trigger the onPlayerRemoved
    // method on the minigame object, and free the |player|'s state in the minigame manager.
    removePlayer(player, reason, isTimeout = false) {
        if (!this.activePlayers_ || !this.activePlayers_.has(player))
            return;

        this.activePlayers_.delete(player);

        // Inform the minigame about |player| leaving the activity.
        this.minigame_.onPlayerRemoved(player, reason);

        // Restore their state after the minigame had a chance to do their things. This may be done
        // in response to an event, so restore it asynchonously to avoid reentrancy.
        if (this.state_ >= Minigame.STATE_LOADING) {
            Promise.resolve().then(() => player.restoreState());

            // Make sure that the death feed is re-enabled for the |player|.
            this.manager_.deathFeed.enableForPlayer(player);
        }

        // Clear the player's state from the minigame manager.
        this.manager_.didRemovePlayerFromMinigame(player);

        // Check whether the minigame has finished in its entirety. This is the case when there are
        // no more active players and the |player| is not being removed because of a timeout.
        if (this.activePlayers_.size < this.settings_.minimumParticipants && !isTimeout)
            this.finish(Minigame.REASON_NOT_ENOUGH_PLAYERS);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when |player| has died because of |reason|. This definitely has to be forwarded to the
    // minigame, but may also mean that they have to be removed from it.
    onPlayerDeath(player, reason) {
        if (!this.activePlayers_.has(player))
            throw new Error('Received death event for an invalid player: ' + player.name);

        if (this.state_ != Minigame.STATE_LOADING && this.state_ != Minigame.STATE_RUNNING)
            return;  // events are not relevant if the minigame is not active

        // Inform the minigame about the player having died.
        this.minigame_.onPlayerDeath(player, reason);

        // Remove the player from the minigame unless the `respawn` flag has been set.
        if (!this.settings_.enableRespawn)
            this.removePlayer(player, Minigame.REASON_DEATH);
    }

    // Called when |player| has spawned. Minigames that enable respawn will get this event forwarded
    // to them. Returns a boolean indicating whether the event should be prevented elsewhere.
    onPlayerSpawn(player) {
        if (!this.activePlayers_.has(player))
            throw new Error('Received spawn event for an invalid player: ' + player.name);

        if (this.state_ != Minigame.STATE_LOADING && this.state_ != Minigame.STATE_RUNNING)
            return;  // events are not relevant if the minigame is not active

        this.minigame_.onPlayerSpawn(player);
        return true;
    }

    // Called when the state of |player| changes from |oldState| to |newState|.
    onPlayerStateChange(player, newState, oldState) {
        if (!this.activePlayers_.has(player))
            throw new Error('Received state change event for an invalid player: ' + player.name);

        if (this.state_ != Minigame.STATE_RUNNING)
            return;  // events are not relevant if the minigame is not active

        if (newState == Player.STATE_DRIVER)
            this.minigame_.onPlayerEnterVehicle(player, player.vehicle);
        else if (oldState == Player.STATE_DRIVER)
            this.minigame_.onPlayerLeaveVehicle(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |vehicle| has respawned. Will be forwarded to the minigame if applicable.
    onVehicleSpawn(vehicle) {
        if (!this.entities_.hasVehicle(vehicle))
            return;  // the |vehicle| is not owned by this minigame

        this.minigame_.onVehicleSpawn(vehicle);
    }

    // Called when the |vehicle| has died. Will be forwarded to the minigame if applicable.
    onVehicleDeath(vehicle) {
        if (!this.entities_.hasVehicle(vehicle))
            return;  // the |vehicle| is not owned by this minigame

        this.minigame_.onVehicleDeath(vehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Advances the minigame to the loading state. The loading state will considered to be complete
    // when the minigame's own `onLoad` method promise has been completed.
    load() {
        if (this.state_ != Minigame.STATE_SIGN_UP)
            return;  // bail out because the minigame is not in the sign-up state

        // Mark the minigame as being in the loading state.
        this.state_ = Minigame.STATE_LOADING;

        // Asynchronously store the state for each player, then invoke the `onLoad` handler on
        // the minigame itself, after which the minigame can advance to the running state.
        Promise.resolve().then(() => {
            for (let player of this.activePlayers_) {
                // Serialize the player's current state so that it can be recovered later.
                player.serializeState();

                // Disable the death feed for them to stop it from obstructing the screen.
                this.manager_.deathFeed.disableForPlayer(player);
            }

            return this.minigame_.onLoad();

        }).then(() => this.start());
    }

    // Advances the minigame to the started state. It will immediately start a timer that will run
    // for the duration of the minigame's timeout, finishing the minigame if necessary.
    start() {
        if (this.state_ != Minigame.STATE_LOADING)
            return;  // bail out because the minigame is not in the loading state

        // Mark the minigame as being in the running state.
        this.state_ = Minigame.STATE_RUNNING;

        this.minigame_.onStart().then(() => {
            if (server.isTest())
                return;  // don't schedule the timers during tests

            if (!this.settings_.timeout)
                return;  // don't schedule the timers for minigames with no time limit

            wait(this.settings_.timeout * 1000).then(() =>
                this.finish(Minigame.REASON_TIMED_OUT));
        });
    }

    // Finishes the minigame. The minigame will be informed, after which the remaining players will
    // be respawned and the minigame will be removed from the manager.
    finish(reason) {
        if (this.state_ == Minigame.STATE_FINISHED)
            return;  // bail out because the minigame has already finished

        // Mark the minigame as having finished.
        this.state_ = Minigame.STATE_FINISHED;

        // Inform the minigame about it having finished.
        return this.minigame_.onFinish(reason).then(() => {
            // Remove the remaining players from the minigame.
            for (let player of this.activePlayers_)
                this.removePlayer(player, Minigame.REASON_FINISHED, true /* isTimeout */);

            // Give the minigame an opportunity to dispose of their state.
            this.minigame_.dispose();

            // Informs the manager that the minigame owned by this driver has finished.
            this.manager_.didFinishMinigame(this.category_, this);
        });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        VirtualWorld.release(this.virtualWorld_);
        this.virtualWorld_ = null;

        this.entities_.dispose();
        this.entities_ = null;

        this.activePlayers_ = null;

        this.manager_ = null;
        this.category_ = null;
        this.minigame_ = null;
        this.settings_ = null;
    }
}

export default MinigameDriver;
