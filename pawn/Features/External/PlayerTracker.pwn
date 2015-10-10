// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The player tracker changes the database whenever a new player joins the game, leaves the game and
 * takes care of updating scores every few seconds. This allows external services, such as the
 * website, to stay informed about the in-game activities.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerTracker {
    // In order to avoid allocating a large buffer on the stack for each update, we use one in the
    // class-scope. This number is determined based on the query boilerplate (311 characters) plus
    // data for the amount of players this build currently supports (each player = rougly 55 characters), 
    // 311+numberOfPlayers*55
    new m_queryBuffer[311+MAX_PLAYERS*80];

    /**
     * When the gamemode first starts, we have to clear the table containing the in-game players as
     * this no longer will be relevant. When this is a GMX, players will be re-added as they connect
     * to the server again.
     */
    public __construct() {
        Database->query("TRUNCATE TABLE online", "", 0);
    }

    /**
     * Insert the player's information in the database when they connect to Las Venturas Playground.
     *
     * @param playerId Id of the player that connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        if (Player(playerId)->isNonPlayerCharacter())
            return;

        new nickname[MAX_PLAYER_NAME+1];
        GetPlayerName(playerId, nickname, sizeof(nickname));

        format(m_queryBuffer, sizeof(m_queryBuffer),
            "INSERT INTO online (player_id, nickname, ip_address, join_date) " ...
            "VALUES (%d, \"%s\", INET_ATON(\"%s\"), NOW()) " ...
            "ON DUPLICATE KEY UPDATE nickname=VALUES(nickname), ip_address=VALUES(ip_address), join_date=VALUES(join_date)",
            playerId, nickname, Player(playerId)->ipAddressString());

        Database->query(m_queryBuffer, "", 0);
    }

    /**
     * When a player disconnects from the server, we'd like to remove their information from the
     * database to ensure that any listening services are aware of this.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (Player(playerId)->isNonPlayerCharacter())
            return;

        format(m_queryBuffer, sizeof(m_queryBuffer), "DELETE FROM online WHERE player_id = %d", playerId);
        Database->query(m_queryBuffer, "", 0);
    }

    /**
     * We update the player data in the database every second, to give the most accurate information
     * possible to listening services such as our website. The cost of this a query per 50 players.
     */
    @list(SecondTimer)
    public onUpdate() {
        if (PlayerManager->connectedPlayerCount() == 0)
            return;

        new playerInsertionBuffer[80], Float: playerPosition[3], Float: playerHealth, Float: playerArmor,
            updatedPlayerCount = 0, playerId = 0;

        do {
            m_queryBuffer[0] = 0; // make sure that strcat() works the way we want it to.
            strcat(m_queryBuffer, "INSERT INTO online (player_id, user_id, score, position_x, position_y, position_z, health, armor, color) VALUES ", sizeof(m_queryBuffer));

            updatedPlayerCount = 0;
            for (; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
                if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
                    continue;

                GetPlayerPos(playerId, playerPosition[0], playerPosition[1], playerPosition[2]);
                GetPlayerHealth(playerId, playerHealth);
                GetPlayerArmour(playerId, playerArmor);

                // make sure player position coordinates aren't invalid floats (NaN)
                if (playerPosition[0] != playerPosition[0] || playerPosition[1] != playerPosition[1] || playerPosition[2] != playerPosition[2])
                    continue;

                format(playerInsertionBuffer, sizeof(playerInsertionBuffer), "(%d,%d,%d,%.2f,%.2f,%.2f,%.0f,%.0f,%d),",
                    playerId, Account(playerId)->userId(), GetPlayerScore(playerId), playerPosition[0],
                    playerPosition[1], playerPosition[2], playerHealth, playerArmor, ColorManager->playerColor(playerId));

                strcat(m_queryBuffer, playerInsertionBuffer, sizeof(m_queryBuffer));

                if (++updatedPlayerCount > 50)
                    break;
            }

            if (updatedPlayerCount == 0)
                continue; // there are no in-game players in this range.

            m_queryBuffer[strlen(m_queryBuffer)-1] = 0; // strip the last comma.
            strcat(m_queryBuffer, " ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), score=VALUES(score), " ...
                "position_x=VALUES(position_x), position_y=VALUES(position_y), position_z=VALUES(position_z), " ...
                "health=VALUES(health), armor=VALUES(armor), color=VALUES(color)", sizeof(m_queryBuffer));

            // Execute the query on the database, and check.
            Database->query(m_queryBuffer, "", 0);

        // If there are more than 50 players in-game, we need multiple queries.
        } while (playerId <= PlayerManager->highestPlayerId());
    }
};
