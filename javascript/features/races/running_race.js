// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let RaceSettings = require('features/races/race_settings.js'),
    ScopedCallbacks = require('base/scoped_callbacks.js'),
    ScopedEntities = require('entities/scoped_entities.js');

// This class defines the behavior of a race that is currently active, whereas active is defined by
// being at least in the sign-up state.
class RunningRace {
  constructor(race, player, skipSignup) {
    this.players_ = [];
    this.race_ = race;
    this.state_ = RunningRace.STATE_SIGNUP;

    // TODO: Have some sort of unique virtual world dispatcher.
    this.virtualWorld_ = 1007;

    // The vehicles associated with the race for players to drive in.
    this.vehicles_ = [];

    // Scope all entities created by this race to the lifetime of the race.
    this.entities_ = new ScopedEntities();

    // Create a promise that is to be resolved when the race has finished.
    this.finishedPromise_ = new Promise(resolve =>
        this.resolveFinishedPromise_ = resolve);

    // Sign the first player up for the race.
    this.addPlayer(player);

    // Advance the state to loading if the sign-up state for the race should be skipped. Mind that
    // the race may already be in loading state if it has a maximum of one player. If the sign-up
    // state should not be skipped, advance the state after a certain number of seconds.
    if (skipSignup)
      this.advanceState(RunningRace.STATE_LOADING);
    else
      wait(RaceSettings.RACE_SIGNUP_WAIT_DURATION).then(() => this.advanceState(RunningRace.STATE_LOADING));

    // Listen to the required callbacks. Use a scoped callbacks object because this object is
    // ephemeral, and the listeners won't be necessary after the race has finished.
    this.callbacks_ = new ScopedCallbacks();
    this.callbacks_.addEventListener('playerdisconnect', this.__proto__.onPlayerDisconnect.bind(this));
  }

  // Returns a promise that will be resolved when the race has finished.
  get finished() { return this.finishedPromise_; }

  // Returns the Race instance which this running race will host.
  get race() { return this.race_; }

  // Returns the state of the running race. Must be one of the constants defined later in this file.
  get state() { return this.state_; }

  // Removes |player| from the group of players participating in this race. If there are no players
  // left anymore, the race will advance to the FINISHED state.
  removePlayer(player) {
    this.players_ = this.players_.filter(otherPlayer => otherPlayer != player);

    // TODO: Restore the |player|'s state if |this.stage_| >= RunningRace.STATE_COUNTDOWN.

    if (!this.players_.length)
      this.advanceState(RunningRace.STATE_FINISHED);
  }

  // Called when a player has disconnected from the server. If the player was engaged in this race
  // then we need to mark them as having dropped out, and possibly stop the race altogether.
  onPlayerDisconnect(event) {
    let player = Player.get(event.playerid);
    if (player === null || !this.players_.includes(player))
      return;

    this.removePlayer(player);
  }

  // -----------------------------------------------------------------------------------------------

  // Advances the running race to |state|. The state of the race can only advance, it can never be
  // returned to a previous state.
  advanceState(state) {
    if (this.state_ >= state)
      return;  // ignore 'updates' to the current or previous states.

    this.state_ = state;
    switch (this.state_) {
      // Load the race's state - create the required vehicles and objects, move players to the
      // virtual world, and apply environmental settings of the race.
      case RunningRace.STATE_LOADING:
        if (!this.createVehicles() ||
            !this.createObjects() ||
            !this.preparePlayers())
          break;

        // Automatically advance the race's state to countdown after a short period of time.
        wait(RaceSettings.RACE_LOADING_WAIT_DURATION).then(() => this.advanceState(RunningRace.STATE_COUNTDOWN));
        break;

      // Waits for a certain number of seconds before allowing the players to start racing. The
      // countdown will be visible on the screens of all participants of the race.
      case RunningRace.STATE_COUNTDOWN:
        this.createCountdown(RaceSettings.RACE_COUNTDOWN_SECONDS).then(() =>
            this.advanceState(RunningRace.STATE_RUNNING));
        break;

      // State in which the players are actually racing against each other. Provide timely score
      // board updates and keep track of the player's positions.
      case RunningRace.STATE_RUNNING:
        this.startRace();

        // If the race has a time limit set, advance to the out-of-time state after it passes.
        if (this.race_.timeLimit != 0)
          wait(this.race_.timeLimit * 1000).then(() => this.advanceState(RunningRace.STATE_OUT_OF_TIME));

        // TODO: Implement the rest of the running state.
        break;

      // State that occurs when one or more players are still racing, but the maximum time of the
      // race has expired. They'll be shown a message, after which they'll forcefully drop out.
      case RunningRace.STATE_OUT_OF_TIME:
        this.displayOutOfTimeMessage();

        // Automatically finish the race after letting the news sink in for some time.
        wait(RaceSettings.RACE_OUT_OF_TIME_WAIT_DURATION).then(() => this.advanceState(RunningRace.STATE_FINISHED));
        break;

      // The race is finished. Finalize, then remove the race's state and announce accordingly.
      case RunningRace.STATE_FINISHED:
        this.finish();
        break;
    }
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_SIGNUP
  // -----------------------------------------------------------------------------------------------

  addPlayer(player) {
    if (this.state_ != RunningRace.STATE_SIGNUP || this.players_.includes(player))
      return;  // this should never happen.

    this.players_.push(player);

    // Advance to the loading state if the race is full.
    if (this.race_.maxPlayers == this.players_.length)
      this.advanceState(RunningRace.STATE_LOADING);
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_LOADING
  // -----------------------------------------------------------------------------------------------

  createVehicles() {
    let spawnPositions = this.race_.spawnPositions,
        playerSpawnPositionIndex = 0;

    this.players_.forEach(player => {
      let spawn = spawnPositions[playerSpawnPositionIndex++];
      let vehicle = this.entities_.createVehicle({
        modelId: spawn.vehicle.model,
        position: spawn.position,
        rotation: spawn.rotation,
        colors: spawn.vehicle.colors
      });

      // Link the vehicle to the race's virtual world and interior (unless it's in the main world).
      vehicle.virtualWorld = this.virtualWorld_;
      if (this.race_.interior != 0)
        vehicle.interior = this.race_.interior;

      // If the vehicle should have nitrous oxide systems, make sure to create them.
      switch (spawn.vehicle.nos) {
        case 1:
          vehicle.addComponent(Vehicle.COMPONENT_NOS_SINGLE_SHOT);
          break;
        case 5:
          vehicle.addComponent(Vehicle.COMPONENT_NOS_FIVE_SHOTS);
          break;
        case 10:
          vehicle.addComponent(Vehicle.COMPONENT_NOS_TEN_SHOTS);
          break;
      }

      this.vehicles_.push(vehicle);
    });

    return true;
  }

  createObjects() {
    // TODO: Create the objects required for the race.
    return true;
  }

  preparePlayers() {
    let playerVehicleIndex = 0;
    this.players_.forEach(player => {
      // TODO: Store the player's state so that it can be restored later.

      // Move the player to the right virtual world and interior for the race.
      player.virtualWorld = this.virtualWorld_;
      player.interior = this.race_.interior;

      // Put the player in their designated 
      player.putInVehicle(this.vehicles_[playerVehicleIndex++]);

      // Freeze the player so that they can't begin racing yet.
      player.controllable = false;

      // Apply the environmental settings for the race, i.e. the time and weather.
      player.weather = this.race_.weather;
      player.time = this.race_.time;
    });

    // TODO: Create the first checkpoint for the race.

    return true;
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_COUNTDOWN
  // -----------------------------------------------------------------------------------------------

  createCountdown(seconds) {
    return new Promise(resolve => {
      // TODO: Display the countdown using text draws instead (yay aesthetics).
      // TODO: Display "Go" rather than zero.

      let display = seconds => {
        this.players_.forEach(player => player.sendMessage(seconds + '...'));
        if (seconds > 0)
          wait(1000).then(display.bind(null, seconds - 1));
        else
          resolve();
      };

      display(seconds);
    });
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_RUNNING
  // -----------------------------------------------------------------------------------------------

  startRace() {
    this.players_.forEach(player => player.controllable = true);
    // TODO: Do other work here, start the counters, and so on.
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_OUT_OF_TIME
  // -----------------------------------------------------------------------------------------------

  displayOutOfTimeMessage() {
    // TODO: Display the message using a text draw rather than a message like this.
    // TODO: Block the players controls, make sure that checkpoint events are ignored.

    this.players_.forEach(player => player.sendMessage('You ran out of time!'));
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_FINISHED
  // -----------------------------------------------------------------------------------------------

  finish() {
    this.callbacks_.dispose();
    this.entities_.dispose();

    this.resolveFinishedPromise_();
  }
};

// The states a running race can be in. The names should be self-explanatory.
RunningRace.STATE_SIGNUP = 0;
RunningRace.STATE_LOADING = 1;
RunningRace.STATE_COUNTDOWN = 2;
RunningRace.STATE_RUNNING = 3;
RunningRace.STATE_OUT_OF_TIME = 4;
RunningRace.STATE_FINISHED = 5;

exports = RunningRace;
