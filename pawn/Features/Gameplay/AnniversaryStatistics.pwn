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

    // What are the amount of points one gets for each participated minigame?
    const participatedMinigamePoints = 1;

    // What are the amount of points one gets for each won minigame?
    const wonMinigamePoints = 4;

    // What are the amount of points one gets for each kill?
    new Float: m_killPoints = 0.1;

    // Save the amount of minigames the player has participated in.
    new m_minigamesParticipated[MAX_PLAYERS];

    // Save the amount of minigames the player has won.
    new m_minigamesWon[MAX_PLAYERS];

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
     * Create a database query that updates the player's anniversary statistics in the back-end.
     *
     * @param playerId Id of the player who the statistics are updated for.
     */
    public updateAnniversaryStatistics(playerId) {
        new score, databaseQuery[128];
        score = (m_minigamesParticipated[playerId] * participatedMinigamePoints) + 
                (m_minigamesWon[playerId] * wonMinigamePoints) +
                (floatround(m_kills[playerId] * m_killPoints));

        format(databaseQuery, sizeof(databaseQuery),
            "UPDATE %s SET minigames_participated = %d, minigames_won = %d, kills = %d, score = %d, WHERE user_id = %d",
            statisticsTableName, m_minigamesParticipated[playerId], m_minigamesWon[playerId], m_kills[playerId], score, Account(playerId)->userId());
        Database->query(databaseQuery, "", -1);
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
                if (Player(playerId)->isConnected() == false || Player(playerId)->isLoggedIn() == false)
                    continue;

                this->updateAnniversaryStatistics(playerId);
            }

            m_fiveMinuteTicker = 0;
        }
    }

    /**
     * Upon player login, check if there already exists data concerned with anniversary statistics.
     *
     * @param playerId Id of the player who logged in to the server.
     */
    @list(OnPlayerLogin)
    public onPlayerLogin(playerId) {
        new databaseQuery[128];
        format(databaseQuery, sizeof(databaseQuery), "SELECT * FROM %s WHERE user_id = %d", statisticsTableName, Account(playerId)->userId());
        Database->query(databaseQuery, "OnAnniversaryStatisticsDataAvailable", playerId);
    }

    /**
     * Upon player login, check if there already exists data concerned with anniversary statistics.
     *
     * @param playerId Id of the player who logged in to the server.
     */
    forward OnAnniversaryStatisticsDataAvailable(resultId, playerId);
    public OnAnniversaryStatisticsDataAvailable(resultId, playerId) {
        // If no data is found, we create a dummy line in order to smooth out future updating.
        if (DatabaseResult(resultId)->count() == 0 || !DatabaseResult(resultId)->next()) {
            new databaseQuery[128];
            format(databaseQuery, sizeof(databaseQuery),
                "INSERT INTO %s (user_id, minigames_participated, minigames_won, kills, score, last_updated) VALUES (%d, 0, 0, 0, 0, NOW())",
                statisticsTableName, Account(playerid)->userId());
            Database->query(databaseQuery, "", -1);
            return;
        }

        // Else, the statistics are put into the member variables.
        m_minigamesParticipated[playerId] = DatabaseResult(resultId)->readInteger("minigames_participated");
        m_minigamesWon[playerId] = DatabaseResult(resultId)->readInteger("minigames_won");
        m_kills[playerId] = DatabaseResult(resultId)->readInteger("kills");

        DatabaseResult(resultId)->free();
    }

    /**
     * Upon connecting, reset the player's member variables for statistic gathering.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_minigamesParticipated[playerId] = 0;
        m_minigamesWon[playerId] = 0;
        m_kills[playerId] = 0;
    }

    /**
     * Upon disconnecting, save the statistics to the database.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (Player(playerId)->isLoggedIn() == true && m_anniversary)
            this->updateAnniversaryStatistics(playerId);
    }
};