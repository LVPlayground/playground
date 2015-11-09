// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The race checkpoint class encapsulates information about a checkpoint of the race type. Only a
// single checkpoint can be displayed to a player at any given time.
class RaceCheckpoint {
  constructor(type, position, nextPosition, size) {
    this.type_ = type;
    this.position_ = position;
    this.nextPosition_ = nextPosition;
    this.size_ = size;
  }

  // Returns the type of the checkpoint.
  get type() { return this.type_; }

  // Returns the position of the checkpoint.
  get position() { return this.position_; }

  // Returns the position of the checkpoint that follows this one. May be NULL.
  get nextPosition() { return this.nextPosition_; }

  // Returns the size of the checkpoint, i.e. the diameter in game units.
  get size() { return this.size_; }

};

// The different kinds of race checkpoints. Both ground and airborne checkpoints have normal and
// finish versions, whereas the "NO_MARKER" type will not create a marker on the map.
RaceCheckpoint.GROUND_NORMAL = 0;
RaceCheckpoint.GROUND_FINISH = 1;
RaceCheckpoint.AIRBORNE_NORMAL = 3;
RaceCheckpoint.AIRBORNE_FINISH = 4;
RaceCheckpoint.NO_MARKER = 2;

exports = RaceCheckpoint;
