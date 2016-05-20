/**
 * Copyright (c) 2006-2016 Las Venturas Playground
 *
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; if
 * not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301, USA.
 */

/**
 * LVP exists 10 years, and we're going to celebrate that! In order to track player statistics
 * during the weekend, this file is responsible for gathering and syncing the specific statistics
 * to the back-end.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class AnniversaryStatistics {
    // Is it time to start gathering anniversary statistics?
    new bool: m_anniversary = true;

    // The name of the table the statistics are saved to.
    const statisticsTableName = "anniversary_statistics";

    // Save the amount of minigames the player has participated in.
    new m_minigamesParticipated[MAX_PLAYERS];

    // Save the amount of kills the player has gotten.
    new m_kills[MAX_PLAYERS];

    // Variable to track the update timer.
    new m_fiveMinuteTicker = 0;

    /**
     * The LVP 10 anniversary script officially tracks statistics between 20 May 6 PM and 22 May
     * midnight (GMT +2).
     */
    public checkAnniversaryStatus() {
        new year, month, day, hour, minute, second;
        getdate(year, month, day);
        gettime(hour, minute, second);

        if (day == 20 && hour < 18)
            m_anniversary = false;
        if (day == 22 && hour > 23)
            m_anniversary = false;
        if (day > 22)
            m_anniversary = false;
    }

    /**
     * Upon initialization of the gamemode, properly set the anniversary boolean.
     */
    @list(OnGameModeInit)
    public initialize() {
        this->checkAnniversaryStatus();
    }

    /**
     * After a player has participated in a minigame, increase their score.
     *
     * @param playerId Id of the player who the statistic is increased for.
     */
    public inline increaseMinigameParticipationScore(playerId) {
        m_minigamesParticipated[playerId]++;
    }

    /**
     * After a player has killed someone, increase their score.
     *
     * @param playerId Id of the player who the statistic is increased for.
     */
    public inline increaseKillScore(playerId) {
        m_kills[playerId]++;
    }

    /**
     * Clear the statistics for a certain player after they've been pushed to the database.
     *
     * @param playerId Id of the player who the statistics are cleared for.
     */
    public clearAnniversaryStatistics(playerId) {
        m_minigamesParticipated[playerId] = 0;
        m_kills[playerId] = 0;
    }

    /**
     * Create a database query that updates the player's anniversary statistics in the back-end.
     *
     * @param playerId Id of the player who the statistics are updated for.
     */
    public updateAnniversaryStatistics(playerId) {
        new databaseQuery[128];
        format(databaseQuery, sizeof(databaseQuery),
            "INSERT INTO %s (user_id, minigames_participated, kills, timestamp) VALUES (%d, %d, %d, NOW())",
            statisticsTableName, Account(playerId)->userId(), m_minigamesParticipated[playerId], m_kills[playerId]);
        Database->query(databaseQuery, "", -1);

        this->clearAnniversaryStatistics(playerId);
    }

    /**
     * Let's process anniversary statistics per five minutes.
     */
    @list(MinuteTimer)
    public onMinuteTimerTick() {
        this->checkAnniversaryStatus();

        if (++m_fiveMinuteTicker == 5) {
            if (!m_anniversary)
                return;

            for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
                if (Player(playerId)->isConnected() == false || Player(playerId)->isLoggedIn() == false
                    || Player(playerId)->isAdministrator() == true)
                    continue;

                this->updateAnniversaryStatistics(playerId);
            }

            m_fiveMinuteTicker = 0;
        }
    }

    /**
     * Upon connecting, reset the player's member variables for statistic gathering.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        this->clearAnniversaryStatistics(playerId);
    }

    /**
     * Upon disconnecting, save the statistics to the database.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (Player(playerId)->isLoggedIn() == true && m_anniversary && Player(playerId)->isAdministrator() == false)
            this->updateAnniversaryStatistics(playerId);
    }
};

forward OnPlayerMinigameStateChange(playerid);
public OnPlayerMinigameStateChange(playerid) {
    if (!IsPlayerConnected(playerid))
        return;

    AnniversaryStatistics->increaseMinigameParticipationScore(playerid);
}