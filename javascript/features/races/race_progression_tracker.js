// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The progression tracker is aware of a participant's progress along the race, responds to them
// entering one of the checkpoints, and is able to give a completion ratio.
export class RaceProgressionTracker {
    #checkpoints_ = null;
    #laps_ = null;

    #checkpointTimes_ = null;
    #startTime_ = null;

    constructor(checkpoints, laps) {
        this.#checkpoints_ = checkpoints;
        this.#laps_ = laps;

        this.#checkpointTimes_ = [];
    }

    // Gets the progress of the participant along the race. This is purely based on the number of
    // checkpoints they've collected so far, creating unfair ties.
    get progress() {
        return this.#checkpointTimes_.length / (this.#checkpoints_.length * this.#laps_);
    }

    // Gets the time, in milliseconds, the participant has spent on the race so far. May be zero
    // in case they haven't started just yet, or a fixed number when they've finished already.
    get time() {
        if (!this.#startTime_)
            return 0;  // they haven't started yet

        if (this.progress < 0)
            return server.clock.monotonicallyIncreasingTime() - this.#startTime_;

        const [ latestSplit ] = this.#checkpointTimes_.slice(-1);
        return latestSplit - this.#startTime_;
    }

    // Returns the { final, position, size and target } information for the current race checkpoint
    // that is to be displayed for a particular participant. Will be NULL after the last checkpoint.
    getCurrentCheckpoint() {
        const currentCheckpoint = this.getCheckpoint(this.#checkpointTimes_.length);
        if (!currentCheckpoint)
            return null;  // finished

        const nextCheckpoint = this.getCheckpoint(this.#checkpointTimes_.length + 1);
        return {
            final: !nextCheckpoint,
            position: currentCheckpoint.position,
            target: nextCheckpoint?.position ?? null,
            size: currentCheckpoint.size,
        };
    }

    // Returns { size, position } of the checkpoint for the given |index|, which has to be between 0
    // and |len(checkpoints) * laps|. Will return NULL when the checkpoint cannot be found.
    getCheckpoint(index) {
        const checkpointLimit = this.#checkpoints_.length * this.#laps_;
        if (index < 0 || index >= checkpointLimit)
            return null;  // finished

        return this.#checkpoints_[index % this.#checkpoints_.length];
    }

    // Splits the progression tracker, which means that the participant has hit one of the check-
    // points and is ready for their next one. We record the time of this action.
    split() {
        if (this.progress >= 1)
            throw new Error(`Progression has completed, no further splits are expected.`);

        this.#checkpointTimes_.push(server.clock.monotonicallyIncreasingTime());
    }

    // Starts the tracker, i.e. records when the participant started racing.
    start() { this.#startTime_ = server.clock.monotonicallyIncreasingTime(); }
}
