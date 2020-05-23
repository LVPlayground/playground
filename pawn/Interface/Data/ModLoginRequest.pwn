// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Exported callback to which the results of a mod login request will be announced, allowing us to
 * determine whether the given player should be granted administration rights.
 *
 * @param resultId Id of the result set associated with this query.
 * @param playerId Id of the player for whom we executed the moderator login request.
 */
forward ModLoginResultCallback(resultId, playerId);
public ModLoginResultCallback(resultId, playerId) {
    ModLoginRequest->onReceivedResult(playerId, resultId);
    DatabaseResult(resultId)->free();
}

/**
 * Administrators and other members of the Las Venturas Playground Staff are allowed to retrieve
 * staff rights in-game without having to use their own nickname. The Mod Login Request will fire
 * off a MySQL query in an attempt to verify their login details.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ModLoginRequest {
    // Id of the QueryBuilder instance that will be used for creating the right queries.
    new m_queryId;

    /**
     * We use a QueryBuilder instance so we don't have to do repeated escaping of usernames and
     * passwords in MySQL queries ourselves, which is initialized in the constructor.
     */
    public __construct() {
        if (!QueryBuilder->create("SELECT " ...
                                  "    users.level, users.username, users.user_id " ...
                                  "FROM " ...
                                  "    users " ...
                                  "WHERE " ...
                                  "    username = %0 AND password = SHA1(CONCAT(password_salt, %1, %2))", "sss", m_queryId))
        {
            printf("[Loading] ModLoginRequest: Unable to initialize the Query Builder.");
        }
    }

    /**
     * Create a new ModLoginRequest for the given player Id. The query will be executed asynchronous
     * meaning that this method will return immediately, without a result.
     *
     * @param playerId Id of the player to create this request for.
     * @param username Username that they're trying to log in to.
     * @param password Password associated with the username, should match in the database.
     */
    public createForPlayer(playerId, username[], password[]) {
        new queryString[256];

        QueryBuilder(m_queryId)->apply(queryString, sizeof(queryString), username, password, Database->passwordSaltString());
        if (strlen(queryString))
            Database->query(queryString, "ModLoginResultCallback", playerId);
    }

    /**
     * When results have been received, read them carefully and determine which method on the
     * Account class has to be called in order to handle the request correctly.
     *
     * @param playerId Id of the player for which we launched this request.
     * @param resultId Id of the result that contains the account data.
     */
    public onReceivedResult(playerId, resultId) {
        if (DatabaseResult(resultId)->count() != 1) {
            Account(playerId)->onFailedModLoginAttempt();
            return;
        }

        new level[24], originalUsername[MAX_PLAYER_NAME+1], userId;
        DatabaseResult(resultId)->next();
        DatabaseResult(resultId)->readString("level", level);
        DatabaseResult(resultId)->readString("username", originalUsername);
        userId = DatabaseResult(resultId)->readInteger("user_id");

        if (!strcmp (level, "Player")) { // Preventing players from using modlogin
            Account(playerId)->onFailedModLoginAttempt();
        } else {
            Account(playerId)->onSuccessfulModLoginAttempt(AccountData->stringToPlayerLevel(level), originalUsername, userId);
        }
    }
};
