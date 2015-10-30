// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The race class encapsulates the data associated with a race. The Race class is not responsible
// for actually importing, loading or running a race, it only holds the associated data.
class Race {
  constructor() {
    this.name_ = 'Unnamed race';
    this.spawnPositions_ = [];
  }

  // Gets or changes the name of this race. It must be an non-zero-length string.
  get name() { return this.name_; }
  set name(value) {
    this.name_ = value;
  }

  // Returns the spawn positions available for this race.
  get spawnPositions() { return this.spawnPositions_; }

  // Registers a new spawn position for this race. There is no limit to the amount of spawn
  // positions that may be associated with a single race.
  addSpawnPosition(position, rotation, vehicle) {
    this.spawnPositions_.push({ position, rotation, vehicle });
  }

};
