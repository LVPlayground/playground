// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let RaceSettings = require('features/races/race_settings.js'),
    ScopedCallbacks = require('base/scoped_callbacks.js');

// Maximum sign-up duration of a race, in milliseconds.
const MAXIMUM_SIGNUP_DURATION_MS = RaceSettings.RACE_SIGNUP_MAXIMUM_DURATION * 1000;

// This class defines the behavior of a race that is currently active, whereas active is defined by
// being at least in the sign-up phase.
class RunningRace {
  constructor(race, player, skipSignup) {
    this.players_ = [];
    this.race_ = race;
    this.state_ = RunningRace.STATE_SIGNUP;

    // Create a promise that is to be resolved when the race has finished.
    this.finishedPromise_ = new Promise(resolve =>
        this.resolveFinishedPromise_ = resolve);

    // Sign the first player up for the race.
    this.addPlayer(player);

    // Advance the state to loading if the sign-up phase for the race should be skipped. Mind that
    // the race may already be in loading state if it has a maximum of one player. If the sign-up
    // phase should not be skipped, advance the state after a certain number of seconds.
    if (skipSignup)
      this.advanceState(RunningRace.STATE_LOADING);
    else
      wait(MAXIMUM_SIGNUP_DURATION_MS).then(() => this.advanceState(RunningRace.STATE_LOADING));

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

  // Adds |player| to the group of players who wish to partake in this race. If the race is full
  // following their sign-up, the race will progress to the loading phase immediately.
  addPlayer(player) {
    if (state != RunningRace.STATE_SIGNUP || this.players_.includes(player))
      return;  // this should never happen.

    this.players_.push(player);

    // Advance to the loading state if the race is full.
    if (this.race_.maxPlayers == this.players_.length)
      this.advanceState(RunningRace.STATE_LOADING);
  }

  // Removes |player| from the group of players participating in this race. If there are no players
  // left anymore, the race will advance to the FINISHED state.
  removePlayer(player) {
    this.players_ = this.players_.filter(otherPlayer => otherPlayer != player);

    // TODO: Restore the |player|'s state if |this.stage_| >= RunningRace.STATE_COUNTDOWN.

    if (!this.players_.length)
      this.advanceState(RunningRace.STATE_FINISHED);
  }

  // Finishes the race, cleans up all state created by the race and resolves the finished promise.
  finish() {
    this.callbacks_.dispose();

    // TODO: Remove all objects and state created by the race.

    this.resolveFinishedPromise_();
  }

  // Called when a player has disconnected from the server. If the player was engaged in this race
  // then we need to mark them as having dropped out, and possibly stop the race altogether.
  onPlayerDisconnect(event) {
    let player = Player.get(event.playerid);
    if (player === null || !this.players_.includes(player))
      return;

    this.removePlayer(player);
  }

  // Advances the running race to |state|. The state of the race can only advance, it can never be
  // returned to a previous state.
  advanceState(state) {
    if (this.state_ >= state)
      return;  // ignore "updates" to the current or previous states.

    // TODO: STATE_LOADING
    // TODO: STATE_COUNTDOWN
    // TODO: STATE_RUNNING

    if (state == RunningRace.STATE_FINISHED)
      this.finish();
  }
};

// The states a running race can be in. The names should be self-explanatory.
RunningRace.STATE_SIGNUP = 0;
RunningRace.STATE_LOADING = 1;
RunningRace.STATE_COUNTDOWN = 2;
RunningRace.STATE_RUNNING = 3;
RunningRace.STATE_FINISHED = 4;

exports = RunningRace;
