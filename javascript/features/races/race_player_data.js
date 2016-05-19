// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScoreBoard = require('features/races/ui/score_board.js');

// Stores the per-player information for an active race minigame. Contains very little logic, as
// the logic for races should be focused in the RaceMinigame class.
class RacePlayerData {
    constructor(player) {
        this.player_ = player;

        this.vehicle = null;
        this.checkpoint = null;
        this.finished = false;

        this.checkpointIndex_ = 0;
        this.checkpointTimes_ = new Map();

        this.bestCheckpointTimes_ = [];

        this.scoreBoard_ = new ScoreBoard(player);
    }

    // Gets the index of the checkpoint the player most recently passed.
    get checkpointIndex() { return this.checkpointIndex_; }

    // Gets the time at which the player passed their latest checkpoint.
    get checkpointTime() { return this.checkpointTimes_.get(this.checkpointIndex_); }

    // Gets an array with the checkpoint times of the player's result.
    get checkpointTimes() { return Array.from(this.checkpointTimes_.values()); }

    // Gets the scoreboard that will be displayed for this player.
    get scoreBoard() { return this.scoreBoard_; }

    // Imports the |results| for this player, which represents their best run in this race.
    importResults(results) {
        this.scoreBoard_.setBestTime(results.totalTime);
        this.bestCheckpointTimes_ = results.checkpointTimes;
    }

    // Records the time at which the player passed through the checkpoint with the given index.
    recordTime(checkpointIndex, time) {
        this.checkpointIndex_ = checkpointIndex;
        this.checkpointTimes_.set(checkpointIndex, time);

        if (this.bestCheckpointTimes_.length > checkpointIndex) {
            this.scoreBoard_.setPersonalRecordRelativeTime(
                time - this.bestCheckpointTimes_[checkpointIndex]);
        }
    }

    dispose() {
        this.scoreBoard_.dispose();
        this.scoreBoard_ = null;

        if (this.checkpoint)
            this.checkpoint.hideForPlayer(this.player_);

        if (this.vehicle)
            this.vehicle.dispose();

        this.checkpoint = null;
        this.vehicle = null;
    }
}

exports = RacePlayerData;
