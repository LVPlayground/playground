// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This callback will be invoked after the player-registered-request comes back with a result. In
 * here, we'll make sure that the information will be available long enough, and then forward it.
 *
 * @param playerId Id of the player for which we fetched the registration status.
 */
forward PlayerRegisteredRequestCallback(resultId, playerId);
public PlayerRegisteredRequestCallback(resultId, playerId) {
    PlayerRegisteredRequest->onReceivedResult(playerId, resultId);
    DatabaseResult(resultId)->free();
}

/**
 * Determine whether a player is registered, and if so, get relevant information from the database
 * allowing the gamemode to show either a login box or identify them automatically.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerRegisteredRequest {
    // Id of the query in the Query Builder that will generate the MySQL query for us.
    new m_queryId;

    /**
     * Initialize the MySQL query which we'll be using with the Query Builder and store the Query
     * Id in the local variable. This allows us to optimize the requests later on.
     */
    public __construct() {
        if (!QueryBuilder->create("SELECT " ...
                                  "    users.user_id, " ...
                                  "    users_mutable.skin_id, " ...
                                  "    users_mutable.require_sampcac " ...
                                  "FROM " ...
                                  "    users_nickname " ...
                                  "LEFT JOIN " ...
                                  "    users ON users.user_id = users_nickname.user_id " ...
                                  "LEFT JOIN " ...
                                  "    users_mutable ON users_mutable.user_id = users.user_id " ...
                                  "WHERE " ...
                                  "    users_nickname.nickname = %0 AND " ...
                                  "    users.validated = 1", "s", m_queryId))
        {
            printf("[Loading] PlayerRegisteredRequest: Unable to initialize the Query Builder.");
        }
    }

    /**
     * Create a request based on the player's nickname.
     *
     * @param playerId Id of the player to check their registration status for.
     * @param nickname Nickname of the player, to match against the database.
     * @param ipAddress IP address the player is using to connect to LVP.
     */
    public createForNickname(playerId, nickname[]) {
        new queryString[512];

        QueryBuilder(m_queryId)->apply(queryString, sizeof(queryString), nickname);
        if (strlen(queryString))
            Database->query(queryString, "PlayerRegisteredRequestCallback", playerId);
    }

    /**
     * After the query finishes, gather the required information from the database and invoke the
     * right function to handle the player's registration date.
     *
     * @param playerId Id of the player for which information is available.
     */
    public onReceivedResult(playerId, resultId) {
        new bool: registered = DatabaseResult(resultId)->count() > 0 && DatabaseResult(resultId)->next();

        new userId = 0, skinId = 0;
        new bool: requireSampcac = false;

        if (registered == true) {
            userId = DatabaseResult(resultId)->readInteger("user_id");
            skinId = DatabaseResult(resultId)->readInteger("skin_id");
            requireSampcac = DatabaseResult(resultId)->readInteger("require_sampcac") != 0;
        }

        Account(playerId)->onRegisteredRequestComplete(registered, userId, skinId, requireSampcac);
    }
};
