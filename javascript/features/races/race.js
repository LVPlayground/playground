// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The race class encapsulates the data associated with a race. The Race class is not responsible
// for actually importing, loading or running a race, it only holds the associated data.
class Race {
  constructor() {
    this.name_ = 'Unnamed race';

    this.timeLimit_ = 0;
    this.laps_ = 1;

    this.challengeDesk_ = null;

    this.weather_ = 7;
    this.time_ = [12, 00];
    this.interior_ = 0;

    this.spawnPositions_ = [];
    this.checkpoints_ = [];

    // Settings.
    this.useAirplaneCheckpoints_ = false;
    this.disableCheckpointMarkers_ = false;
    this.disableVehicleDamage_ = false;
  }

  // Gets or changes the name of this race. It must be an non-zero-length string.
  get name() { return this.name_; }
  set name(value) {
    this.name_ = value;
  }

  // Gets or sets the time limit for this game. A limit of zero implies that there is no limit.
  get timeLimit() { return this.timeLimit_; }
  set timeLimit(value) {
    this.timeLimit_ = value;
  }

  // Gets or sets the number of laps for this race. It must be an integer larger than zero.
  get laps() { return this.laps_; }
  set laps(value) {
    this.laps_ = value;
  }

  // Gets or sets the challenge desk location, which gives players the ability to perform the race
  // by themselves, for a small fee, by talking to an actor at the given location. This is an object
  // having an actorModel, position vector and rotation.
  get challengeDesk() { return this.challengeDesk_; }
  set challengeDesk(value) {
    this.challengeDesk_ = value;
  }

  // Gets or sets the weather type for this race. It must be an interger.
  get weather() { return this.weather_; }
  set weather(value) {
    this.weather_ = value;
  }

  // Gets or sets the time at which this race will take place. Must be an array with two entries,
  // one for the hour (24-hour based) and one for the minute.
  get time() { return this.time_; }
  set time(value) {
    this.time_ = value;
  }

  // Returns the spawn positions available for this race.
  get spawnPositions() { return this.spawnPositions_; }

  // Registers a new spawn position for this race. There is no limit to the amount of spawn
  // positions that may be associated with a single race.
  addSpawnPosition(position, rotation, vehicle) {
    this.spawnPositions_.push({ position, rotation, vehicle });
  }

  // Returns the checkpoints available for this race.
  get checkpoints() { return this.checkpoints_; }

  // Registers a new checkpoint for the race. There is no limit to the amount of checkpoints added
  // to a given race. Each checkpoint must have a position and a defined size.
  addCheckpoint(position, size) {
    this.checkpoints_.push({ position, size });
  }

  // Gets or sets whether the race should use airplane checkpoints rather than normal one.
  get useAirplaneCheckpoints() { return this.useAirplaneCheckpoints_; }
  set useAirplaneCheckpoints(value) {
    this.useAirplaneCheckpoints_ = value;
  }

  // Gets or sets whether checkpoint markers on the map should be disabled.
  get disableCheckpointMarkers() { return this.disableCheckpointMarkers_; }
  set disableCheckpointMarkers(value) {
    this.disableCheckpointMarkers_ = value;
  }

  // Gets or sets whether vehicle damage should be disabled for this race.
  get disableVehicleDamage() { return this.disableVehicleDamage_; }
  set disableVehicleDamage(value) {
    this.disableVehicleDamage_ = value;
  }
};
