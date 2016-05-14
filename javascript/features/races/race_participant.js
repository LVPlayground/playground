// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let DriftTracker = require('features/races/drift_tracker.js');

// Represents an individual participant in a race.
class RaceParticipant {
  constructor(player) {
    this.player_ = player;

    this.state_ = RaceParticipant.STATE_SIGNUP;

    this.vehicle_ = null;
    this.driftTracker_ = null;

    this.startTime_ = null;
    this.totalTime_ = null;
    this.rank_ = 0;

    this.checkpointIndex_ = null;
    this.checkpointTimes_ = [];
    this.bestCheckpointTimes_ = [];
    this.bestTime_ = null;

    this.finishing_ = false;

    this.scoreBoard_ = null;
  }

  // Gets the Id of the player this participant represents.
  get playerId() { return this.player_.id; }

  // Gets the name of the player this participant represents.
  get playerName() { return this.player_.name; }

  // Gets the player associated with this participant. The player may not be connected to the server
  // anymore- be sure to check that before using it.
  get player() { return this.player_; }

  // Gets the user Id of the account that belongs to this participant.
  get userId() { return this.player_.userId; }

  // Gets the state of this participant.
  get state() { return this.state_; }

  // Gets or sets the vehicle associated with this participant. The vehicle is not guaranteed to
  // exist when the state of the participant moves past STATE_RACING.
  get vehicle() { return this.vehicle_; }
  set vehicle(value) {
    if (value !== null && !(value instanceof Vehicle))
      throw new Error('Vehicles must be either NULL or a Vehicle instance.');

    this.driftTracker_ = new DriftTracker(value);
    this.vehicle_ = value;
  }

  // Returns the drift tracker associated with this participant.
  get driftTracker() { return this.driftTracker_; }

  // Returns the time at which the participant started racing.
  get startTime() { return this.startTime_; }

  // Returns the total time this participant took for finishing the race.
  get totalTime() { return this.totalTime_; }

  // Returns or updates the participant's rank on this race. Will only be set after they finish it.
  get rank() { return this.rank_; }
  set rank(value) { this.rank_ = value; }

  // Returns the participant's current checkpoint index. May be NULL if they haven't passed one yet.
  get checkpointIndex() { return this.checkpointIndex_; }

  // Returns the most recent time at which the player passed through a checkpoint, or NULL if they
  // haven't passed one yet. (checkpointIndex will be NULL too.)
  get lastCheckpointTime() {
    return this.checkpointTimes_.length ? this.checkpointTimes_[this.checkpointTimes_.length - 1]
                                        : null;
  }

  // Returns an array with the times at which the player passed each of the checkpoints.
  get checkpointTimes() { return this.checkpointTimes_; }

  // Marks the player as finishing. Returns true if the player wasn't marked as such yet, or false
  // when they were. This helps prevent race conditions (race as in threading races).
  markAsFinishing() {
    if (this.finishing_)
      return false;

    this.finishing_ = true;
    return true;
  }

  // Gets or sets the score board for this participant.
  get scoreBoard() { return this.scoreBoard_; }
  set scoreBoard(value) { this.scoreBoard_ = value; }

  // Imports the best results this participant ever scored on the race. Used to update the score
  // board of the player with the absolute and relative performance compared to their best.
  importBestResults(results) {
    this.scoreBoard_.setBestTime(results.totalTime);

    this.bestCheckpointTimes_ = results.checkpointTimes;
    this.bestTime_ = results.totalTime;
  }

  // Records |time| as the moment at which the player passed the checkpoint at |checkpointIndex|. If
  // the best time of the player at this checkpoint is known, update the scoreboard to display it.
  recordCheckpointTime(checkpointIndex, time) {
    let currentTime = time - this.startTime_;

    this.checkpointIndex_ = checkpointIndex;
    this.checkpointTimes_.push(currentTime);

    if (this.bestCheckpointTimes_ === null || this.bestCheckpointTimes_.length <= checkpointIndex)
      return;

    this.scoreBoard_.setPersonalRecordRelativeTime(
        currentTime - this.bestCheckpointTimes_[checkpointIndex]);
  }

  // Advances the player to |state|. If the current state is already past |state|, this call will
  // silently be ignored (don't demote players from having finished to having dropped out). The
  // |param| must be set when advancing to STATE_RACING or STATE_FINISHED.
  advance(state, param = null) {
    if (this.state_ >= state)
      return;

    this.state_ = state;
    switch (this.state_) {
      case RaceParticipant.STATE_RACING:
        this.startTime_ = param;
        break;

      case RaceParticipant.STATE_FINISHED:
        this.totalTime_ = param - this.startTime_;

        this.scoreBoard_.update(param);
        if (this.bestTime_ !== null)
          this.scoreBoard_.setPersonalRecordRelativeTime(this.totalTime_ - this.bestTime_);
    }
  }
};

// The states a player can be in whilst in a race.
RaceParticipant.STATE_SIGNUP = 0;
RaceParticipant.STATE_RACING = 1;
RaceParticipant.STATE_DROP_OUT = 2;
RaceParticipant.STATE_FINISHED = 3;

exports = RaceParticipant;
