// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * After a password verification request has been fired, we'll want to be able to report back the
 * status to the caller. This is a simple call to Account::onPasswordVerificationComplete().
 *
 * @param resultId Id of the result in the database plugin's storage.
 * @param playerId Id of the player for which we know whether the password is correct.
 */
forward PasswordVerificationCallback(resultId, playerId);
public PasswordVerificationCallback(resultId, playerId) {
    PasswordVerificationRequest->onReceivedResult(playerId, resultId);
    DatabaseResult(resultId)->free();
}

/**
 * Request a password verification with the database server by sending a query towards it. Passwords
 * are partially encoded with data from the database, partially with data from the source-code, to
 * make sure that access to any single source will not grant anyone access to passwords.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PasswordVerificationRequest {
    // The password salt which will be used to encrypt the player's password.
    const PrivatePasswordSalt = Configuration::PasswordSalt;

    // Id of the query in the Query Builder that will generate the MySQL query for us.
    new m_queryId;

    /**
     * Initialize the query which will be used by the password verification requests. This will ease
     * the necessary work for applying user data in the query later on.
     */
    public __construct() {
        if (!QueryBuilder->create("SELECT " ...
                                  "    users.user_id " ...
                                  "FROM " ...
                                  "    users " ...
                                  "WHERE " ...
                                  "    user_id = %0 AND password = SHA1(CONCAT(password_salt, %1, %2))", "iss", m_queryId))
        {
            printf("[Loading] PlayerVerificationRequest: Unable to initialize the Query Builder.");
        }
    }

    /**
     * Create a new verification request for the given player, intended to verify whether they
     * supplied the correct password for the account they want to log in as.
     *
     * @param playerId Id of the player for which we have to create the verification request.
     * @param userId Id of the user they're intending to log in as.
     * @param password Password which supposidly is associated with that account.
     */
    public createForPlayer(playerId, userId, password[]) {
        new queryString[256];

        QueryBuilder(m_queryId)->apply(queryString, sizeof(queryString), userId, password, PrivatePasswordSalt);
        if (strlen(queryString))
            Database->query(queryString, "PasswordVerificationCallback", playerId);
    }

    /**
     * After we receive answer from the database on whether we were able to successfully verify the
     * password of this user, we'll want to inform the Account class of this.
     *
     * @param playerId Id of the player for which we launched this request.
     */
    public onReceivedResult(playerId, resultId) {
        new resultRows = DatabaseResult(resultId)->count(),
            userId = 0;

        if (resultRows > 0 && DatabaseResult(resultId)->next())
            userId = DatabaseResult(resultId)->readInteger("user_id");

        Account(playerId)->onPasswordVerificationComplete(resultRows != 0, userId);
    }
};
