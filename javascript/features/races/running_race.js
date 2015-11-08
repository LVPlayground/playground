// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Maximum duration of the sign-up state for races.
const MAXIMUM_SIGNUP_DURATION_MS = 20000;

// This class defines the behavior of a race that is currently active, whereas active is defined by
// being at least in the sign-up phase.
class RunningRace {
  constructor(race, player, skipSignup) {
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
  }

  // Returns a promise that will be resolved when the race has finished.
  get finished() { return this.finishedPromise_; }

  // Returns the Race instance which this running race will host.
  get race() { return this.race_; }

  // Returns the state of the running race. Must be one of the constants defined later in this file.
  get state() { return this.state_; }

  // Finishes the race, cleans up all state created by the race and resolves the finished promise.
  finish() {
    // TODO: Remove all created callbacks for the current race.
    // TODO: Remove all objects and state created by the race.

    this.resolveFinishedPromise_();
  }

  // Adds |player| to the group of players who wish to partake in this race. If the race is full
  // following their sign-up, the race will progress to the loading phase immediately.
  addPlayer(player) {
    // TODO: Add |player| to the list of partaking players.
  }

  // Advances the running race to |state|. The state of the race can only advance, it can never be
  // returned to a previous state.
  advanceState(state) {
    // TODO: Verify that the state actually advances. Ignore state == this.state_.
    // TODO: Advance the state, actually start loading the race's data.
    // TODO: Start the countdown phase.
    // TODO: Start the actual race.
  }
};

// The states a running race can be in. The names should be self-explanatory.
RunningRace.STATE_SIGNUP = 0;
RunningRace.STATE_LOADING = 1;
RunningRace.STATE_COUNTDOWN = 2;
RunningRace.STATE_RUNNING = 3;
RunningRace.STATE_TEARDOWN = 4;

exports = RunningRace;
