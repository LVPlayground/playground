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
export class Clock {
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

    // Formats the given |date|, in seconds, relative to the current date.
    formatRelativeTime(date, { allowFutureTimes = true } = {}) {
        const seconds = Math.floor(this.currentTime() / 1000) - date;
        const suffix = seconds < 0 ? ' from now'
                                   : ' ago';

        // Handle clock skew by the server, which isn't likely, but may happen.
        if (seconds < 0 && !allowFutureTimes)
            return 'In the future!';

        // Handle visits that have occurred less than two minutes ago, which we consider to be now.
        if (seconds < 60 && !allowFutureTimes)
            return "Just now!";

        // Otherwise, create separate buckets for minutes, hours, days, weeks, months and years.
        const minutes = Math.floor(Math.abs(seconds) / 60);
        if (minutes < 60)
            return minutes + ' minute' + (minutes == 1 ? '' : 's') + suffix;

        const hours = Math.floor(minutes / 60);
        if (hours < 24)
            return hours + ' hour' + (hours == 1 ? '' : 's') + suffix;

        const days = Math.floor(hours / 24);
        if (days < 7)
            return days + ' day' + (days == 1 ? '' : 's') + suffix;

        const weeks = Math.floor(days / 7);
        if (weeks <= 4 && days < 30.25)
            return weeks + ' week' + (weeks == 1 ? '' : 's') + suffix;

        const months = Math.floor(days / 30.25);
        if (months < 12)
            return months + ' month' + (months == 1 ? '' : 's') + suffix;

        const years = Math.floor(months / 12);
        return years + ' year' + (years == 1 ? '' : 's') + suffix;
    }

    // Disposes of the instance.
    dispose() {}
}
