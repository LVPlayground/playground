// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to load account information when a player has identified with the server.
const ACCOUNT_LOAD_QUERY = `
    SELECT
        users_mutable.user_id,
        users_mutable.money_bank,
        users_mutable.stats_reaction
    FROM
        users_mutable
    WHERE
        users_mutable.user_id = ?`;

// Query to store account information when a player disconnects from the server, or for periodic
// updates when an important player property has been changed.
const ACCOUNT_SAVE_QUERY = `
    UPDATE
        users_mutable
    SET
        users_mutable.money_bank = ?,
        users_mutable.stats_reaction = ?
    WHERE
        users_mutable.user_id = ?`;

// Provides the ability for the gamemode to load and store information related to accounts in the
// database. Future optimization opportunities include differential updating.
export class AccountProviderDatabase {
    // Loads the account data for the given |userId|. Will return the raw database row, which is to
    // be parsed and applied by the AccountData structure. Returns NULL if there are no results.
    async loadAccountData(userId) {
        const results = await server.database.query(ACCOUNT_LOAD_QUERY, userId);
        return results && results.rows.length ? results.rows[0]
                                              : null;
    }

    // Stores the given |accountData|, which must follow the database column names as returned by
    // the `loadAccountData()` method. Generally composited by the AccountData structure.
    async saveAccountData(accountData) {
        await server.database.query(
            ACCOUNT_SAVE_QUERY, accountData.money_bank, accountData.stats_reaction,
            accountData.user_id);

        return true;
    }
}
