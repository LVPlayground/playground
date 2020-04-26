// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { sha1 } from 'features/nuwani_commands/sha1.js';

// Query to update a player's (hashed) password to the given hashed value and salt.
const CHANGE_PASSWORD_QUERY = `
    UPDATE
        users
    SET
        password = ?,
        password_salt = ?
    WHERE
        user_id = (
            SELECT
                user_id
            FROM
                users_nickname
            WHERE
                nickname = ?)
    LIMIT
        1`;

// Query to retrieve the necessary information to display a player summary message.
const PLAYER_SUMMARY_QUERY = `
    SELECT
        users.level,
        users.is_vip,
        users_mutable.online_time,
        users_mutable.kill_count,
        users_mutable.death_count,
        IFNULL(TIMESTAMPDIFF(SECOND, users_mutable.last_seen, NOW()), 0) as last_seen
    FROM
        users_nickname
    LEFT JOIN
        users ON users.user_id = users_nickname.user_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = users_nickname.user_id
    WHERE
        users_nickname.nickname = ?`;

// Enables interacting with the MySQL database for purposes of the PlayerCommands provided by the
// Nuwani IRC system. Requires a live MySQL connection.
export class PlayerDatabase {
    static kTypeNumber = 0;
    static kTypeString = 1;
    static kTypeCustom = 2;

    passwordSalt_ = null;

    constructor(passwordSalt) {
        this.passwordSalt_ = passwordSalt;
    }

    // Retrieves portions of the player information for the given |nickname| from the database that
    // will be used for outputting their information on IRC.
    async getPlayerSummaryInfo(nickname) {
        const results = await server.database.query(PLAYER_SUMMARY_QUERY, nickname);
        return results.rows.length ? results.rows[0]
                                   : null;
    }

    // Returns which fields are supported by the !supported, !getvalue and !setvalue commands. This
    // is a hardcoded list because we only want to support a sub-set of the database column data.
    getSupportedFields() {
        return {
            clock_tz: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            clock: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            custom_color: { table: 'users_mutable', type: PlayerDatabase.kTypeCustom },
            death_count: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            death_message: { table: 'users_mutable', type: PlayerDatabase.kTypeString },
            is_developer: { table: 'users', type: PlayerDatabase.kTypeNumber },
            is_vip: { table: 'users', type: PlayerDatabase.kTypeNumber },
            jailed: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            kill_count: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            last_ip: { table: 'users_mutable', type: PlayerDatabase.kTypeCustom },
            last_seen: { table: 'users_mutable', type: PlayerDatabase.kTypeCustom },
            level: { table: 'users', type: PlayerDatabase.kTypeCustom },
            money_bank_type: { table: 'users_mutable', type: PlayerDatabase.kTypeCustom },
            money_bank: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            money_bounty: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            money_cash: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            money_debt: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            money_spawn: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            online_time: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            preferred_radio_channel: { table: 'users_mutable', type: PlayerDatabase.kTypeString },
            skin_id: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_carbombs: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_drivebys: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_exports: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_fc_deaths: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_fc_kills: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_heli_kills: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_minigame: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_packages: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            stats_reaction: { table: 'users_mutable', type: PlayerDatabase.kTypeNumber },
            validated: { table: 'users', type: PlayerDatabase.kTypeNumber },
        };
    }

    // Returns whether the PlayerDatabase has the ability to update player passwords.
    canUpdatePasswords() {
        return !!this.passwordSalt_;
    }

    // Changes the password of the |nickname| to |temporaryPassword|. A new database salt will be
    // generated as well, leading to a completely new value.
    async changePassword(nickname, temporaryPassword) {
        if (!this.canUpdatePasswords())
            throw new Error('The `passwordSalt` configuration option is required for this.');

        const databaseSalt = this.generateDatabaseSalt();
        const hashedPassword = sha1(`${databaseSalt}${temporaryPassword}${this.passwordSalt_}`);

        return this._changePasswordQuery(nickname, hashedPassword, databaseSalt);
    }

    // Actually changes the password for the given |nickname| to |password|, a hashed value so that
    // the actual password doesn't have to leave the server's JavaScript code.
    async _changePasswordQuery(nickname, password, databaseSalt) {
        const results =
            await server.database.query(CHANGE_PASSWORD_QUERY, password, databaseSalt, nickname);
        
        return results.affectedRows > 0;
    }

    // Gets the given |fieldName| from the |nickname|'s data in the database. Custom fields will be
    // pre-processed before being returned.
    async getPlayerField(nickname, fieldName) {

    }

    // Updates the |fieldName| setting of the given |nickname| to the set |value|. Validation will
    // be applied based on the type of field.
    async updatePlayerField(nickname, fieldName, value) {

    }

    // Generates a new random database salt, which is an integer between 100000000 and 999999999.
    generateDatabaseSalt() {
        return Math.floor(Math.random() * (999999999 - 100000000)) + 100000000;
    }

    // Updates the |field| setting of the given |nickname|, which is one of the custom values.
    // Validation and formatting specific to the |field| will be done in here.
    async _updateCustomPlayerField(nickname, field, value) {
        // custom_color
        // level
        // money_bank_type
        // last_ip
        // last_seen
    }

    // Updates the numeric |field| setting of the given |nickname|.
    async _updateNumericPlayerField(nickname, field, value) {

    }

    // Updates the textual |field| setting of the given |nickname|.
    async _updateStringPlayerField(nickname, field, value) {

    }
}
