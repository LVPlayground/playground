// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PriorityQueue = require('base/priority_queue.js');

// Private variable to ensure that only a single MockClock exists at any given time. This is
// important because it will override the wait() method on the global.
let existingInstance = null;

// The previous value of the global wait() function. Will be mocked by the MockClock and be driven
// by advancing the time using `server.clock.advance()`.
let previousWait = null;

// Mocked version of the clock that will be used for tests. Beyond the normal functionality, the
// clock can be advanced by a given number of milliseconds.
class MockClock {
    constructor() {
        this.offset_ = 0;

        // Maintain a prioritized queue of the pending timers in ascending order.
        this.timers_ = new PriorityQueue((lhs, rhs) => {
            if (lhs === rhs)
                return 0;

            return lhs > rhs ? 1 : -1;
        });

        if (existingInstance !== null)
            throw new Error('Another clock instance has already been created.');

        existingInstance = this;
        previousWait = wait;

        // Override the global `wait` function with the version to be mocked by this class.
        wait = MockClock.prototype.wait.bind(this);
    }

    // Returns the current time as the number of milliseconds elapsed since January 1st 1970. May
    // jump forwards or backwards when the server time changes, use for presentational purposes.
    currentTime() {
        return Date.now() + this.offset_;
    }

    // Returns a monotonically increasing time in milliseconds since an arbitrary point in the past.
    // Guaranteed to always increase at a steady rate. Should be used when measuring duration.
    monotonicallyIncreasingTime() {
        return highResolutionTime() + this.offset_;
    }

    // Advances all clocks on Las Venturas Playground by |milliseconds|.
    advance(milliseconds) {
        if (typeof milliseconds !== 'number' || milliseconds < 0)
            throw new Error('The clock can only be advanced by the given number of milliseconds.');

        this.offset_ += milliseconds;

        return this.resolveTimerIfNecessary(this.monotonicallyIncreasingTime());
    }

    // Returns a promise that will be resolved when the timer at the top of the stack has been
    // invoked when this is appropriate on the current time advancement.
    resolveTimerIfNecessary(currentMonotonicallyIncreasingTime) {
        return new Promise(resolve => {
            if (this.timers_.isEmpty())
                return resolve();

            if (this.timers_.peek().time > currentMonotonicallyIncreasingTime)
                return resolve();

            const timer = this.timers_.pop();
            timer.resolver();

            resolve(this.resolveTimerIfNecessary(currentMonotonicallyIncreasingTime));
        });
    }

    // Automatically called when using the wait() method. Will wait for |milliseconds|, which can
    // only be resolved by advancing the time using `server.clock.advance()`.
    wait(milliseconds) {
        return new Promise(resolve => {
            this.timers_.push({ time: this.monotonicallyIncreasingTime() + milliseconds,
                                resolver: resolve });
        });
    }

    // Disposes of the instance.
    dispose() {
        wait = previousWait;

        previousWait = null;
        existingInstance = null;
    }
}

exports = MockClock;
