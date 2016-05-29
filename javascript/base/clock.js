// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A clock is an entity that tells you the time. Las Venturas Playground works with two kinds of
// time: the actual real-world time, obtainable through the now() function, and a monotonically
// increasing time obtainable through the highResolutionTime() function.
//
// The rule of thumb is that when you use time for presentation, use now(), when you use time to
// calculate duration, use highResolutionTime().
//
// The Clock class is mocked for tests, and will be of type MockClock instead which provides the
// same interface, but also a utility method to advance the current time.
class Clock {
    // Returns the current time as the number of milliseconds elapsed since January 1st 1970. May
    // jump forwards or backwards when the server time changes, use for presentational purposes.
    currentTime() {
        return Date.now();
    }

    // Returns a monotonically increasing time in milliseconds since an arbitrary point in the past.
    // Guaranteed to always increase at a steady rate. Should be used when measuring duration.
    monotonicallyIncreasingTime() {
        return highResolutionTime();
    }

    // Disposes of the instance.
    dispose() {}
}

exports = Clock;
