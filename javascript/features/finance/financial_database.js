// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// MySQL query to read a player's bank account balance from the database.
const GET_PLAYER_BALANCE_QUERY = `
    SELECT
        money_bank
    FROM
        users_mutable
    WHERE
        user_id = ?`;

// MySQL query to update the player's bank account balance in the database.
const SET_PLAYER_BALANCE_QUERY = `
    UPDATE
        users_mutable
    SET
        money_bank = ?
    WHERE
        user_id = ?`;

// The financial database is responsible for interaction with the database on financial matters. It
// will be instructed by the financial regulator, who'll be keeping the books.
export class FinancialDatabase {
    // Reads the current account balance owned by the |player|.
    async getPlayerAccountBalance(player) {
        const results = await server.database.query(GET_PLAYER_BALANCE_QUERY, player.userId);
        if (!results || !results.rows.length)
            return 0;
        
        return results.rows[0].money_bank;
    }

    // Writes the current account balance owned by the |player| to be |amount|.
    async setPlayerAccountBalance(player, amount) {
        await server.database.query(SET_PLAYER_BALANCE_QUERY, player.userId, amount);
    }
}
