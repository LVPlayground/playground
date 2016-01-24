// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Controlling time on Las Venturas Playground should be done through the Time controller, which
 * keeps track of what the active time is in the main world and for certain players.
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
 * @todo It would be grand if we could, instead of updating once per hour, update once per ten
 *       minutes or so to enable a more smooth progression of time.
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

    // A player-specific time which should override the global time.
    new m_playerOverrideTime[MAX_PLAYERS] = { InvalidTime, ... };

    /**
     * Converts separate hour and minute values to a single timestamp value, which can be stored in
     * any of the class variables part of this class.
     *
     * @param hours The number of hours to convert in the timestamp.
     * @param minutes The number of minutes to convert in the timestamp.
     * @return integer The created timestamp from the separate hour and minute components.
     */
    private inline toTimestamp(hours, minutes) {
        return ((hours * 100) + minutes);
    }

    /**
     * Converts a compressed timestamp to separate hour and minute variables, allowing them to
     * be used in the SetPlayerTime() method, as well as in other areas.
     *
     * @param timestamp The timestamp to convert to separate fields.
     * @param Variable to store the timestamp's hour in.
     * @param minutes Variable to store the timestamp's minutes in.
     */
    private inline fromTimestamp(timestamp, &hours, &minutes) {
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
    public inline resolveDurationForHour(hour) {
        return floatround((this->resolveParabolaForHour(hour) / m_totalDayDuration) * TimeController::DayCycleDuration);
    }

    /**
     * Determines the total day duration per the parabola function and initializes both the current
     * time and the next progression timer to their expected values.
     */
    public __construct() {
        for (new hour = 0; hour < 24; ++hour)
            m_totalDayDuration += this->resolveParabolaForHour(hour);

        this->setTime(InitialGameHour, 0);
    }

    /**
     * Reset a player's override time when a new player with the same Id connects.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerOverrideTime[playerId] = InvalidTime;
    }

    /**
     * Update the server's time with a new value. All connected players who are not non-player
     * characters and who don't have an override time set will be considered for this. The next
     * time update will automatically be scheduled.
     *
     * @todo Remove the |minutes| parameter, we should either support it completely or have magic
     *       take care of that. I'm inclined towards magic for simplicity for now.
     *
     * @param hours The hour count which the server should be updated to.
     * @param minutes The minute count which the server should be updated to.
     */
    public setTime(hours, minutes) {
        m_globalTime = this->toTimestamp(hours, minutes);
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter())
                continue; // the player isn't connected, or is a NPC.

            if (m_playerOverrideTime[playerId] != InvalidTime)
                continue; // the player has a custom override time set.

            SetPlayerTimePrivate(playerId, hours, minutes);
        }

        KillTimer(m_updateTimer);

        new updateIntervalMs = this->resolveDurationForHour(hours) * 1000,
            updateHour = (hours + 1) % 24;

        m_updateTimer = SetTimerEx("OnProgressiveTimeUpdate", updateIntervalMs, 0, "i", updateHour);
    }

    /**
     * Sets an override time for this player. Any global time updates will not be applied to them
     * anymore, and we'll instead stick to this time until it's released.
     *
     * @param playerId Id of the player to override the global time for.
     * @param hours Number of hours in the day, which should be in the range of [0, 23].
     * @param minutes Number of minutes in the hour, which should be in the range of [0, 59].
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
        new hours, minutes;
        this->m_playerOverrideTime[playerId] = InvalidTime;

        this->fromTimestamp(m_globalTime, hours, minutes);
        SetPlayerTimePrivate(playerId, hours, minutes);
    }
};

// Public function used to update the progressive in-game clock.
forward OnProgressiveTimeUpdate(hour);
public OnProgressiveTimeUpdate(hour) {
    TimeController->setTime(hour, 0);
}

// Include the test-suite for the TimeController class.
#include "Features/Environment/Time/TimeController.tests.pwn"
