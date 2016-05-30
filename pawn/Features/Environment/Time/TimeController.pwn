// Copyright 2006-2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Controlling time on Las Venturas Playground should be done through the Time controller, which
 * keeps track of what the active time is in the main world and for certain players.
 *
 * This class maintains three kinds of times for each player:
 *
 *   (1) Global Time, current time of the San Andreas world. Updates automatically. This will be
 *       used for the majority of players.
 *
 *   (2) Player Default Time. VIPs and beyond have the ability to set a custom default time, which
 *       takes precedence over the global time. This allows them to always have their time set in
 *       the evening, except when engaging in activities such as minigames.
 *
 *   (3) Player Override Time. Can be set for any player, and takes precedence over any other sort
 *       of time. Used for creating an equal playing field for e.g. minigames.
 *
 *
 * The time will be updated throughout an in-game day (the duration of which is defined in the
 * DayCycleDuration constant) using a parabola formula, because players prefer the light provided by
 * the day-time hours over the darkness of the night.
 *
 * Considering the current formula of -0.17(h-12)^2+27, day time will last for 78.6% whereas night
 * time will last for 21.4%. Assuming a cyclic duration of 60 minutes, this maps to 47 minutes of
 * day time, and 13 minutes of night time.
 *
 * Thanks to Martijn for asking Wolfram Alpha for a more optimized formula :-).
 *
 * Time updates will be distributed to all players whose times are not overridden every ten in-game
 * minutes. This will enable a smooth progression of the time, even during the hours where the
 * updates are significant (5 - 7 o'clock in the morning).
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class TimeController {
    // Number of seconds a single in-game day will last for. This will be an approximation, a few
    // seconds could be lost or gained due to the calculation we use. Public for testing.
    public const DayCycleDuration = 3600.0;

    // Constant used to identify invalid time values.
    const InvalidTime = -1;

    // In-game hour that will apply when the gamemode is loaded.
    const InitialGameHour = 10;

    // Total duration of all hours in a day. Used to be able to convert the Y coordinates of the
    // parabola to a number of seconds for which the hour should last.
    new Float: m_totalDayDuration = 0.0;

    // The update timer, which will take care of updating the in-game time when necessary.
    new m_updateTimer = -1;

    // The current time in the main world applying to all players.
    new m_globalTime;

    // A player-specific default time that should apply to them instead of the global time. This can
    // still be overridden by the override time, which is important for e.g. minigames.
    new m_playerDefaultTime[MAX_PLAYERS] = { InvalidTime, ... };

    // A player-specific time which should override both the global and the player's default times.
    new m_playerOverrideTime[MAX_PLAYERS] = { InvalidTime, ... };

    /**
     * Converts separate hour and minute values to a single timestamp value, which can be stored in
     * any of the class variables part of this class. Public for testing.
     *
     * @param hours The number of hours to convert in the timestamp.
     * @param minutes The number of minutes to convert in the timestamp.
     * @return integer The created timestamp from the separate hour and minute components.
     */
    public inline toTimestamp(hours, minutes) {
        return ((hours * 60) + minutes);
    }

    /**
     * Converts a compressed timestamp to separate hour and minute variables, allowing them to
     * be used in the SetPlayerTime() method, as well as in other areas. Public for testing.
     *
     * @param timestamp The timestamp to convert to separate fields.
     * @param Variable to store the timestamp's hour in.
     * @param minutes Variable to store the timestamp's minutes in.
     */
    public inline fromTimestamp(timestamp, &hours, &minutes) {
        hours = Math->floor(timestamp / 60), minutes = timestamp % 60;
    }

    /**
     * Resolves the parabola function of -0.17(h-12)^2+27 for |hour|. An optimized implementation
     * has been used to avoid the use of pow().
     * 
     * When updating this function, please be sure to also update this command and the class-level
     * comment of the TimeController class, to make sure they stay in sync.
     *
     * @param hour The hour for which to resolve the parabola.
     * @return float The resolved value in the function.
     */
    private inline Float: resolveParabolaForHour(hour) {
        return -0.17 * (float(hour) - 24.6025) * (float(hour) + 0.602521);
    }

    /**
     * Resolves the time duration for |hour|. This method will only work as expected after the
     * constructor has finished executing, since it depends on the cached total day duration.
     * This method is public for testing purposes.
     *
     * @param hour The hour for which to resolve the in-game duration.
     * @return integer Number of seconds the current value should last for.
     */
    public inline Float: resolveDurationForHour(hour) {
        return (this->resolveParabolaForHour(hour) / m_totalDayDuration) * TimeController::DayCycleDuration;
    }

    /**
     * Determines the total day duration per the parabola function and initializes both the current
     * time and the next progression timer to their expected values.
     */
    public __construct() {
        for (new hour = 0; hour < 24; ++hour)
            m_totalDayDuration += this->resolveParabolaForHour(hour);

        this->setTime(InitialGameHour);
    }

    /**
     * Reset a player's override time when a new player with the same Id connects.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerOverrideTime[playerId] = InvalidTime;
        m_playerDefaultTime[playerId] = InvalidTime;
    }

    /**
     * Update the server's time with a new value. All connected players who are not non-player
     * characters and who don't have an override time set will be considered for this. The next
     * time update will automatically be scheduled.
     *
     * @param hour The hour count which the server should be updated to. It will be clamped to the
     *             range of [0, 23] to ensure having a valid value.
     * @param minute The minutes to update the server's time to. Optional, defaults to zero.
     */
    public setTime(hour, minute = 0) {
        if (hour < 0) hour = 0;
        if (hour > 23) hour = 23;

        m_globalTime = this->toTimestamp(hour, minute);
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter())
                continue; // the player isn't connected, or is a NPC.

            if (m_playerDefaultTime[playerId] != InvalidTime)
                continue; // the player has a custom default time set.

            if (m_playerOverrideTime[playerId] != InvalidTime)
                continue; // the player has a custom override time set.

            SetPlayerTimePrivate(playerId, hour, minute);
        }

        this->scheduleNextUpdate(hour, minute);
    }

    /**
     * Schedules the next in-game time update. Updates are done every ten in-game minutes to make
     * sure that time progresses smoothly, even in the hours where visual change rapidly.
     *
     * @param hour The current hour of the server's in-game time.
     * @param minute The current minute of the server's in-game time.
     */
    private scheduleNextUpdate(hour, minute) {
        #if Feature::DisableKilltime == 0
        KillTimer(m_updateTimer);
        #endif

        // Determine the hourly update duration for the current |hour|.
        new Float: hourlyUpdateIntervalMs = this->resolveDurationForHour(hour) * 1000;

        // Attempt to update to ten minutes in the future, but never more than the exact moment the
        // next in-game hour will start because it will depend on different durations.
        new updateGameMinutes = min(10, 60 - minute),
            updateInterval = floatround((hourlyUpdateIntervalMs / 60.0) * updateGameMinutes);

        // Determine the in-game time at the next update.
        new nextMinute = minute + updateGameMinutes,
            nextHour = hour;

        if (nextMinute >= 60) {
            nextMinute = 0;
            nextHour = (hour + 1) % 24;
        }

        m_updateTimer = SetTimerEx("OnProgressiveTimeUpdate", updateInterval, 0, "ii", nextHour, nextMinute);
    }

    /**
     * Resets the time for the |playerId| to whichever time definition takes most precedence.
     *
     * @param playerId Id of the player to reset the time for.
     */
    private resetTimeForPlayer(playerId) {
        new hours, minutes;

        if (m_playerOverrideTime[playerId] != InvalidTime)
            this->fromTimestamp(m_playerOverrideTime[playerId], hours, minutes);
        else if (m_playerDefaultTime[playerId] != InvalidTime)
            this->fromTimestamp(m_playerDefaultTime[playerId], hours, minutes);
        else
            this->fromTimestamp(m_globalTime, hours, minutes);

        SetPlayerTimePrivate(playerId, hours, minutes);
    }

    /**
     * Sets a default time for this player. This will override the global time (and associated time
     * updates) for them, but will not override explicit override times used for e.g. minigames and
     * spawn selection.
     *
     * @param playerId Id of the player to set the default time for.
     * @param hours Number of hours in the day, which should be in the range of [0, 23].
     * @param minutes Number of minutes in the hour, which should be in the range of [0, 59].
     */
    public setPlayerDefaultTime(playerId, hours, minutes) {
        this->m_playerDefaultTime[playerId] = this->toTimestamp(hours, minutes);
        if (m_playerOverrideTime[playerId] == InvalidTime)
            SetPlayerTimePrivate(playerId, hours, minutes);
    }

    /**
     * Releases the player's default time, which means they will be subject to the global time.
     *
     * @param playerId Id of the player to reset default time for.
     */
    public releasePlayerDefaultTime(playerId) {
        this->m_playerDefaultTime[playerId] = InvalidTime;
        this->resetTimeForPlayer(playerId);
    }

    /**
     * Sets an override time for this player. Any global time updates will not be applied to them
     * anymore, and we'll instead stick to this time until it's released.
     *
     * @param playerId Id of the player to override the global time for.
     * @param hours Number of hours in the day, which should be in the range of [0, 23].
     * @param minutes Number of minutes in the hour, which should be in the range of [0, 59].
     * @param set Whether to immediately apply the new override time.
     */
    public setPlayerOverrideTime(playerId, hours, minutes, bool: set = true) {
        this->m_playerOverrideTime[playerId] = this->toTimestamp(hours, minutes);
        if (set)
            SetPlayerTimePrivate(playerId, hours, minutes);
    }

    /**
     * Releases the override time which has been set for a player. The global in-game time will be
     * reinstated for the player.
     *
     * @param playerId Id of the player to release the override time for.
     */
    public releasePlayerOverrideTime(playerId) {
        this->m_playerOverrideTime[playerId] = InvalidTime;
        this->resetTimeForPlayer(playerId);
    }
};

// Public function used to update the progressive in-game clock.
forward OnProgressiveTimeUpdate(hour, minutes);
public OnProgressiveTimeUpdate(hour, minutes) {
    TimeController->setTime(hour, minutes);
}

// Include the test-suite for the TimeController class.
#include "Features/Environment/Time/TimeController.tests.pwn"
