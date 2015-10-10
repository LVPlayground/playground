// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * After the database tells us that one or more achievements are available, we'll just forward the
 * call to the Achievements class which will handle loading data for us.
 *
 * @param resultId Id of the result in the database plugin's storage.
 * @param playerId Id of the player for which we loaded the achievements.
 */
forward AchievementsAvailableCallback(resultId, playerId);
public AchievementsAvailableCallback(resultId, playerId) {
    Achievements(playerId)->onAchievementsAvailable(resultId);
    DatabaseResult(resultId)->free();
}

/**
 * Firing off a query to load the achievements that a player has achieved may be done by creating
 * a new request for a certain player. Generally only the Achievement class will do this once the
 * player has logged in to their account.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerAchievementRequest {
    // Id of the query in the Query Builder that will generate the MySQL query for us.
    new m_queryId;

    /**
     * Initialize the query which will be used for fetching information about the achievements from
     * the database. We'll use the query builder instance in the createForPlayer() method.
     */
    public __construct() {
        if (!QueryBuilder->create("SELECT " ...
                                  "    achievementid " ...
                                  "FROM " ...
                                  "    achievements " ...
                                  "WHERE " ...
                                  "    playerid = %0", "i", m_queryId))
        {
            printf("[Loading] PlayerAchievementRequest: Unable to initialize the Query Builder.");
        }
    }

    /**
     * Create a new achievement request for this player, which will fetch one or more achievements
     * from the database that the player has already achieved.
     *
     * @param playerId Id of the player to load the achievements of.
     * @param userId Id of the player's account.
     */
    public createForPlayer(playerId, userId) {
        new queryString[256];

        QueryBuilder(m_queryId)->apply(queryString, sizeof(queryString), userId);
        if (strlen(queryString))
            Database->query(queryString, "AchievementsAvailableCallback", playerId);
    }
};
