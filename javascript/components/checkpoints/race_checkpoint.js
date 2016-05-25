// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CheckpointManager = require('components/checkpoints/checkpoint_manager.js');
const Vector = require('base/vector.js');

// Create an instance of the manager for race checkpoints.
let manager = new CheckpointManager(CheckpointManager.RACE_CHECKPOINTS);

// The race checkpoint class encapsulates information about a checkpoint of the race type. Only a
// single checkpoint can be displayed to a player at any given time.
class RaceCheckpoint {
  constructor(type, position, nextPosition, size) {
    this.type_ = type;
    this.position_ = position;
    this.nextPosition_ = nextPosition || new Vector(0, 0, 0);
    this.size_ = size;
  }

  // Returns the type of the checkpoint.
  get type() { return this.type_; }

  // Returns the position of the checkpoint.
  get position() { return this.position_; }

  // Returns the position of the checkpoint that follows this one.
  get nextPosition() { return this.nextPosition_; }

  // Returns the size of the checkpoint, i.e. the diameter in game units.
  get size() { return this.size_; }

  // Displays the checkpoint for |player|. Returns a promise that will be resolved when the player
  // enters the checkpoint, or rejected when the player disconnects from the server.
  displayForPlayer(player) {
    return manager.displayForPlayer(player, this);
  }

  // Hides the checkpoint for |player|. The promise resolved by the displayForPlayer() method will
  // be rejected, as the player has not entered the checkpoint.
  hideForPlayer(player) {
    manager.hideForPlayer(player, this);
  }
};

// The different kinds of race checkpoints. Both ground and airborne checkpoints have normal and
// finish versions, whereas the "NO_MARKER" type will not create a marker on the map.
RaceCheckpoint.GROUND_NORMAL = 0;
RaceCheckpoint.GROUND_FINISH = 1;
RaceCheckpoint.AIRBORNE_NORMAL = 3;
RaceCheckpoint.AIRBORNE_FINISH = 4;
RaceCheckpoint.NO_MARKER = 2;

exports = RaceCheckpoint;
