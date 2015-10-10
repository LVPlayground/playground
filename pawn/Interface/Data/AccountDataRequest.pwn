// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Catch the callback from the MySQL Plugin, store the result, forward it to the AccountDataRequest
 * class and then free the result again, to ensure that we'll be able to continue.
 *
 * @param playerId Id of the player for which we know whether the password is correct.
 */
forward AccountDataRequestCallback(resultId, playerId);
public AccountDataRequestCallback(resultId, playerId) {
    AccountDataRequest->onReceivedResult(playerId, resultId);
    DatabaseResult(resultId)->free();
}

/**
 * Retrieving all information associated with an account from the database may be done by creating
 * a new Account Data Request, which will be managed by this class.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class AccountDataRequest {
    // Id of the query in the Query Builder that will generate the MySQL query for us.
    new m_queryId;

    /**
     * Initialize the query which will be used to fetch information from a user's account. Since the
     * data is fetched using various classes -- divided by the purpose of the data, several calls
     * will be made in the onReceivedResult() method.
     */
    public __construct() {
        if (!QueryBuilder->create("SELECT " ...
                                  "    users.level, " ...
                                  "    users.is_developer, " ...
                                  "    users.is_vip, " ...
                                  "    users_mutable.*, " ...
                                  "    users_gangs.gang_id, " ...
                                  "    users_gangs.user_role " ...
                                  "FROM " ...
                                  "    users " ...
                                  "LEFT JOIN " ...
                                  "    users_mutable ON users_mutable.user_id = users.user_id " ...
                                  "LEFT JOIN " ...
                                  "    users_gangs ON users_gangs.user_id = users.user_id AND users_gangs.left_gang = '0000-00-00 00:00:00' " ...
                                  "WHERE " ...
                                  "    users.user_id = %0", "i", m_queryId))
        {
            printf("[Loading] AccountDataRequest: Unable to initialize the Query Builder.");
        }
    }

    /**
     * Apply the user's User Id to the query and execute it, allowing us to fetch all information
     * known about this user that's relevant to the current gamemode.
     * 
     * @param playerId Id of the player to start fetching information for.
     * @param userId Id of the user which they have to be logged in to.
     */
    public createForPlayer(playerId, userId) {
        new queryString[1024];

        QueryBuilder(m_queryId)->apply(queryString, sizeof(queryString), userId);
        if (strlen(queryString))
            Database->query(queryString, "AccountDataRequestCallback", playerId);
    }

    /**
     * When the information has been returned by the database, verify that *some* information is
     * available, and then call various methods which need to load data for the account.
     *
     * @param playerId Id of the player for who information is now available.
     */
    public onReceivedResult(playerId, resultId) {
        if (DatabaseResult(resultId)->count() == 0 || !DatabaseResult(resultId)->next())
            return;

        // Load all of the player's information from the database record.
        AccountData(playerId)->onDataAvailable(resultId);

        // Mark them as logged in, and announce it to the gamemode.
        Account(playerId)->onReceivedAccountData();
    }
};
