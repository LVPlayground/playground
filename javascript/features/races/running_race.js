// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let RaceSettings = require('features/races/race_settings.js'),
    ScopedCallbacks = require('base/scoped_callbacks.js');

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

      case RunningRace.STATE_COUNTDOWN:
        // TODO: Implement the countdown state.
        console.log('state: countdown');
        break;

      case RunningRace.STATE_RUNNING:
        // TODO: Implement the running state.
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
    let spawnPositions = this.race_.spawnPositions;
    for (let i = 0; i < this.players_.length; ++i) {
      let {position, rotation, vehicle} = spawnPositions[i];

      let vehicleId = pawnInvoke('CreateVehicle', 'iffffiiii', vehicle.model, position.x, position.y,
                                 position.z, rotation, vehicle.colors[0], vehicle.colors[1],
                                 -1 /* respawn_delay */, 0 /* add_siren */);

      // If we were not able to create the vehicle for whatever reason, abort the entire race.
      if (vehicleId == global.INVALID_VEHICLE_ID) {
        console.log('Unable to create a vehicle for race [' + this.race_.name + ']. Aborting.');

        this.advanceState(RunningRace.STATE_FINISHED);
        return false;
      }

      // Link the vehicle to the race's virtual world.
      pawnInvoke('SetVehicleVirtualWorld', 'ii', vehicleId, this.virtualWorld_);

      // Link the vehicle to an interior if it's not the general world (0).
      if (this.race_.interior != 0)
        pawnInvoke('LinkVehicleToInterior', 'ii', vehicleId, this.race_.interior);

      // If the vehicle should have nitrous oxide systems, make sure to create them.
      switch (vehicle.nos) {
        case 1:
          pawnInvoke('AddVehicleComponent', 'ii', vehicleId, 1009 /* nto_b_s */);
          break;
        case 5:
          pawnInvoke('AddVehicleComponent', 'ii', vehicleId, 1008 /* nto_b_l */);
          break;
        case 10:
          pawnInvoke('AddVehicleComponent', 'ii', vehicleId, 1010 /* nto_b_tw */);
          break;
      }

      this.vehicles_.push(vehicleId);
    }

    return true;
  }

  createObjects() {
    // TODO: Create the objects required for the race.
    return true;
  }

  preparePlayers() {
    for (let i = 0; i < this.players_.length; ++i) {
      let player = this.players_[i];
      let vehicleId = this.vehicles_[i];

      // Move the player to the right virtual world and interior for the race.
      pawnInvoke('SetPlayerVirtualWorld', 'ii', player.id, this.virtualWorld_);
      pawnInvoke('SetPlayerInterior', 'ii', player.id, this.race_.interior);

      // Place the player in the driver's seat of their vehicle.
      if (pawnInvoke('IsPlayerInAnyVehicle', 'i', player.id))
        pawnInvoke('RemovePlayerFromVehicle', 'i', player.id);

      pawnInvoke('PutPlayerInVehicle', 'iii', player.id, vehicleId, 0 /* seatid */);

      // Freeze the player so that they can't begin racing yet.
      pawnInvoke('TogglePlayerControllable', 'ii', player.id, 0 /* toggle */);
    }

    return true;
  }

  // -----------------------------------------------------------------------------------------------
  // State: RunningRace.STATE_FINISHED
  // -----------------------------------------------------------------------------------------------

  finish() {
    this.callbacks_.dispose();

    this.vehicles_.forEach(vehicleId => pawnInvoke('DestroyVehicle', 'i', vehicleId));
    this.vehicles_ = [];

    // TODO: Remove all objects and state created by the race.

    this.resolveFinishedPromise_();
  }
};

// The states a running race can be in. The names should be self-explanatory.
RunningRace.STATE_SIGNUP = 0;
RunningRace.STATE_LOADING = 1;
RunningRace.STATE_COUNTDOWN = 2;
RunningRace.STATE_RUNNING = 3;
RunningRace.STATE_FINISHED = 4;

exports = RunningRace;
