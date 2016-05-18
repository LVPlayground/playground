// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Stores the per-player information for an active race minigame. Contains very little logic, as
// the logic for races should be focused in the RaceMinigame class.
class RacePlayerData {
    constructor() {
        this.vehicle = null;
        this.checkpoint = null;

        this.checkpointIndex_ = 0;
        this.checkpointTimes_ = new Map();
    }

    // Gets the index of the checkpoint the player most recently passed.
    get checkpointIndex() { return this.checkpointIndex_; }

    // Gets the time at which the player passed their latest checkpoint.
    get checkpointTime() { return this.checkpointTimes_.get(this.checkpointIndex_); }

    // Records the time at which the player passed through the checkpoint with the given index.
    recordTime(checkpointIndex, time) {
        this.checkpointIndex_ = checkpointIndex;
        this.checkpointTimes_.set(checkpointIndex, time);
    }
}

exports = RacePlayerData;
