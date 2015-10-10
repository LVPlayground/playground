// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Controlling time on Las Venturas Playground should be done through the Time controller, which
 * keeps track of what the active time is in the main world and for certain players.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class TimeController {
    // Constant used to identify invalid time values.
    const InvalidTime = -1;

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
     * Initializes the global world time to 5pm. That's a nice near-sunset time which creates a
     * great looking scenario for players who immediately connect.
     */
    public __construct() {
        m_globalTime = this->toTimestamp(17, 00);
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
     * characters and who don't have an override time set will be considered for this.
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
    }

    /**
     * Returns the current global time on the server in separate hour and minute variables.
     *
     * @param hours Variable to store the server's current hour on.
     * @param minutes Variable to store the server's current minutes on.
     */
    public inline getTime(&hours, &minutes) {
        this->fromTimestamp(m_globalTime, hours, minutes);
    }

    /**
     * Sets an override time for this player. Any global time updates will not be applied to them
     * anymore, and we'll instead stick to this time until it's released.
     *
     * @param playerId Id of the player to override the global time for.
     * @param hours Number of hours in the day, which should be in the range of [0, 23].
     * @param minutes Number of minutes in the hour, which should be in the range of [0, 59].
     */
    public setPlayerOverrideTime(playerId, hours, minutes) {
        this->m_playerOverrideTime[playerId] = this->toTimestamp(hours, minutes);
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

        this->getTime(hours, minutes);
        SetPlayerTimePrivate(playerId, hours, minutes);
    }
};
