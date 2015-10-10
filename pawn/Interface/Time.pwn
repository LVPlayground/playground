// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * This class will group various utility methods to deal with actual time in the gamemode, including
 * higher performance functions, time and date generation functions and dealing with timezones.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Time {
    // What is the current time? This cached data may be lagging behind .25 seconds at most, so
    // when accuracy is not your main concern but performance is, use currentTime().
    new m_currentTime;

    // Increment used for tests. Tests are responsible for resetting this value after they're
    // done exercising the time system.
    new m_currentTimeIncrementForTests;

    // What is the current time in high resolution numbers? The data is cached and may be lagging
    // .25 seconds behind, but that still gives you decent granularity.
    new m_currentHighResolutionTime;

    /**
     * Retrieve a high resolution representation of the current moment, in this implementation
     * expressed as the tick count since the server started, with a tick per millisecond.
     *
     * @return integer A high resolution representation of the current moment.
     */
    public highResolution() {
        return GetTickCount();
    }

    /**
     * Returns the current time in seconds. This method is much faster than actually invoking the
     * gettime() function, but does have the limitation that the data may be .25 behind.
     *
     * @return integer The current time in second granularity.
     */
    public inline currentTime() {
        return (m_currentTime + m_currentTimeIncrementForTests);
    }

    /**
     * Returns the current time on the server in milliseconds. This data may be lagging up to .25
     * seconds behind, so it's not the best fit for high quality comparisons.
     *
     * @return integer The current time in .25 second granularity.
     */
    public inline currentHighResolutionTime() {
        return (m_currentHighResolutionTime);
    }

    /**
     * Formats the buffer translating the given number of remaining seconds into human readable 
     * form (e.g. hh:mm:ss). It also performs checks to prevent writing unnecessary time units.
     *
     * @param seconds Number of seconds which has to be formatted.
     * @param buffer Buffer to store the result in. It should be at least nine cells in size.
     * @param bufferSize Size of the buffer which the time will be formatted in.
     * @param forceMinutes Force output of minutes (HH:MM) for more consistency.
     */
    public formatRemainingTime(seconds, buffer[], bufferSize, bool: forceMinutes = false) {
        if (forceMinutes == false && seconds <= 0)
            format(buffer, bufferSize, "0");
        else if (forceMinutes == false  && seconds < 60)
            format(buffer, bufferSize, "%d", seconds);
        else if (forceMinutes == true || seconds < 3600)
            format(buffer, bufferSize, "%d:%02d", seconds / 60, seconds % 60);
        else
            format(buffer, bufferSize, "%d:%02d:%02d", seconds / 3600, (seconds % 3600) / 60, seconds % 60);
    }

    /**
     * Updates the cached timestamp with the current time, at second granularity. Useful for systems
     * which require a lot of time updates but won't want to be too expensive.
     */
    @list(HighResolutionTimer)
    public updateCurrentTimeCache() {
        m_currentTime = gettime();
        m_currentHighResolutionTime = GetTickCount();
    }

    /**
     * Updates the current time increment to |increment|. Must only be used for tests.
     */
    public inline setIncrementForTests(increment) {
        m_currentTimeIncrementForTests = increment;
    }
};
