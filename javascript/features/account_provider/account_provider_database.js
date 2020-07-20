// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to load account information when a player has identified with the server.
const ACCOUNT_LOAD_QUERY = `
    SELECT
        users_mutable.user_id,
        users_mutable.online_time,
        users_mutable.custom_color,
        users_mutable.kill_count,
        users_mutable.death_count,
        users_mutable.money_bank,
        users_mutable.money_cash,
        users_mutable.stats_reaction,
        users_mutable.stats_damage_given,
        users_mutable.stats_damage_taken,
        users_mutable.stats_shots_hit,
        users_mutable.stats_shots_missed,
        users_mutable.stats_shots_taken,
        users_mutable.muted
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
        users_mutable.custom_color = ?,
        users_mutable.kill_count = ?,
        users_mutable.death_count = ?,
        users_mutable.money_bank = ?,
        users_mutable.money_cash = ?,
        users_mutable.stats_reaction = ?,
        users_mutable.stats_damage_given = ?,
        users_mutable.stats_damage_taken = ?,
        users_mutable.stats_shots_hit = ?,
        users_mutable.stats_shots_missed = ?,
        users_mutable.stats_shots_taken = ?,
        users_mutable.muted = ?
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
            ACCOUNT_SAVE_QUERY, accountData.custom_color, accountData.kill_count,
            accountData.death_count, accountData.money_bank, accountData.money_cash,
            accountData.stats_reaction, accountData.stats_damage_given,
            accountData.stats_damage_taken, accountData.stats_shots_hit,
            accountData.stats_shots_missed, accountData.stats_shots_taken, accountData.muted,
            accountData.user_id);

        return true;
    }
}
