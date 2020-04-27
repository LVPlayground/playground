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

// Query to get the aliases associated with a nickname, as well as a flag on whether a particular
// entry is their main username.
const PLAYER_ALIASES_QUERY = `
    SELECT
        users_nickname.user_id,
        users_nickname.nickname,
        IF(users.username = users_nickname.nickname, 1, 0) AS is_primary
    FROM
        users_nickname
    LEFT JOIN
        users ON users.user_id = users_nickname.user_id
    WHERE
        users_nickname.user_id = (
            SELECT
                user_id
            FROM
                users_nickname
            WHERE
                nickname = ?)`;

// Query to add an alias to the database.
const PLAYER_ADD_ALIAS_QUERY = `
    INSERT INTO
        users_nickname
        (user_id, nickname)
    VALUES
        (?, ?)`;

// Query to remove an alias from the database.
const PLAYER_REMOVE_ALIAS_QUERY = `
    DELETE FROM
        users_nickname
    WHERE
        user_id = ? AND
        nickname = ?
    LIMIT
        1`;

// Query to change someone's main username into something else.
const PLAYER_CHANGE_NAME_QUERY = `
    UPDATE
        users
    SET
        username = ?
    WHERE
        user_id = ? AND
        username = ?
    LIMIT
        1`;

// Query for logging a player's nickname change in the database.
const PLAYER_CHANGE_NAME_LOG_QUERY = `
    INSERT INTO
        nickname_changes
        (user_id, nickname, date)
    VALUES
        (?, ?, NOW())`;

// Query for reading a user's past nicknames in the database.
const PLAYER_PAST_NICKNAMES_QUERY = `
    SELECT
        nickname
    FROM
        nickname_changes
    WHERE
        user_id = (
            SELECT
                user_id
            FROM
                users_nickname
            WHERE
                nickname = ?)
    ORDER BY
        date DESC`;

// Regular expression to test whether a string is a valid SA-MP nickname.
const kValidNicknameExpression = /^[0-9a-z\[\]\(\)\$@\._=]{1,24}$/i;

// Validates the |text| as a valid IP address, and converts it to a number.
function ip2long(text) {
    const parts = text.split('.');
    if (parts.length !== 4)
        throw new Error(`"${text}" is not a valid IP address.`);
    
    let numericParts = [];
    for (const part of parts) {
        if (!/^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/.test(part))
            throw new Error(`"${text}" is not a valid IP address.`);
        
        numericParts.push(parseInt(part, 10));
    }

    return numericParts[0] * 16777216 +
           numericParts[1] * 65536 +
           numericParts[2] * 256 +
           numericParts[3];
}

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

    // Gets the list of aliases owned by the |nickname|, including their username.
    async getAliases(nickname) {
        const databaseResults = await server.database.query(PLAYER_ALIASES_QUERY, nickname);
        if (!databaseResults || !databaseResults.rows.length)
            return null;

        const results = {
            userId: null,
            nickname: null,
            aliases: []
        };

        for (const row of databaseResults.rows) {
            results.userId = row.user_id;

            if (!!row.is_primary)
                results.nickname = row.nickname;
            else
                results.aliases.push(row.nickname);
        }

        return results;
    }

    // Removes the given |alias| from the given |nickname|. The ordering here matters: |nickname|
    // must be the main nickname, where |alias| will be added to it.
    async addAlias(nickname, alias) {
        if (!kValidNicknameExpression.test(alias))
            throw new Error(`The alias ${alias} is not a valid SA-MP nickname.`);

        const [nicknameResults, aliasResults] = await Promise.all([
            this.getAliases(nickname),
            this.getAliases(alias),
        ]);

        if (!nicknameResults)
            throw new Error(`The player ${nickname} could not be found in the database.`);
        
        if (nicknameResults.nickname !== nickname)
            throw new Error(`${nickname} is an alias by itself. Use their real nickname instead.`);
        
        if (aliasResults !== null)
            throw new Error(`There already is a player named ${alias} in the database.`);
        
        return this.addAliasQuery(nicknameResults.userId, alias);
    }

    // Actually adds the |alias| to the database for the given |userId|.
    async addAliasQuery(userId, alias) {
        const result = await server.database.query(PLAYER_ADD_ALIAS_QUERY, userId, alias);
        console.log(result);

        return true;
    }

    // Removes the given |alias| from the given |nickname|. The ordering here matters: |nickname|
    // must be the main nickname, where |alias| will be removed from it.
    async removeAlias(nickname, alias) {
        const nicknameResults = await this.getAliases(nickname);
        if (!nicknameResults)
            throw new Error(`The player ${nickname} could not be found in the database.`);
        
        if (nicknameResults.nickname !== nickname)
            throw new Error(`${nickname} is an alias by itself. Use their main username instead.`);
        
        if (!nicknameResults.aliases.includes(alias))
            throw new Error(`${alias} is not an alias of the given ${nickname}.`);
        
        return this.removeAliasQuery(nicknameResults.userId, alias);
    }

    // Actually removes the |alias| from the database for the given |userId|.
    async removeAliasQuery(userId, alias) {
        const result = await server.database.query(PLAYER_REMOVE_ALIAS_QUERY, userId, alias);
        console.log(result);

        return true;
    }

    // Gets the nickname history of the given |nickname|.
    async getNicknameHistory(nickname) {
        const results = await server.database.query(PLAYER_PAST_NICKNAMES_QUERY, nickname);
        if (!results || !results.rows.length)
            return null;
        
        const nicknames = [];
        for (const row of results.rows)
            nicknames.push(row.nickname);
        
        return nicknames;
    }

    // Changes the nickname of the user identified by |nickname| to |newNickname|. This must be
    // their main nickname, and |newNickname| must not be in use yet either.
    async changeName(nickname, newNickname) {
        if (!kValidNicknameExpression.test(newNickname))
            throw new Error(`The alias ${newNickname} is not a valid SA-MP nickname.`);

        const [nicknameResults, newNicknameResults] = await Promise.all([
            this.getAliases(nickname),
            this.getAliases(newNickname),
        ]);

        if (!nicknameResults)
            throw new Error(`The player ${nickname} could not be found in the database.`);
        
        if (nicknameResults.nickname !== nickname)
            throw new Error(`${nickname} is an alias. Use their actual username instead.`);
        
        if (newNicknameResults !== null)
            throw new Error(`There already is a player named ${newNickname} in the database.`);
        
        return this.changeNameQuery(nicknameResults.userId, nickname, newNickname);
    }

    // Actually changes the name of |nickname| to |newNickname|.
    async changeNameQuery(userId, nickname, newNickname) {
        const [changeNameResult, removeAliasResult, addAliasResult] = Promise.all([
            server.database.query(PLAYER_CHANGE_NAME_QUERY, newNickname, userId, nickname),
            server.database.query(PLAYER_REMOVE_ALIAS_QUERY, userId, nickname),
            server.database.query(PLAYER_ADD_ALIAS_QUERY, userId, newNickname),
            server.database.query(PLAYER_CHANGE_NAME_LOG_QUERY, userId, newNickname),
        ]);

        console.log(changeNameResult);
        return true;
    }

    // Returns which fields are supported by the !supported, !getvalue and !setvalue commands. This
    // is a hardcoded list because we only want to support a sub-set of the database column data.
    getSupportedFields() {
        return {
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
        const fields = this.getSupportedFields();

        if (!fields.hasOwnProperty(fieldName))
            throw new Error(`${fieldName} is not a field known to me. Please check !supported.`);
        
        const field = fields[fieldName];
        const result = await this._getPlayerFieldQuery(nickname, fieldName, field);

        if (result === null)
            throw new Error(`The player ${nickname} could not be found in the database.`);
        
        if (field.type === PlayerDatabase.kTypeCustom)
            return this.formatCustomPlayerField(fieldName, result);

        return result;
    }

    // Actually runs a database query for getting the |field| from the |nickname|'s player data. The
    // |field| includes the table name that |fieldName| exists in. Both values are safe to use
    // directly, but |nickname| will potentially have to be filtered.
    async _getPlayerFieldQuery(nickname, fieldName, field) {
        const query = `
            SELECT
                ${fieldName}
            FROM
                ${field.table}
            WHERE
                user_id = (
                    SELECT
                        user_id
                    FROM
                        users_nickname
                    WHERE
                        nickname = ?)`;
        
        const result = await server.database.query(query, nickname);
        if (!result.rows.length || !result.rows[0].hasOwnProperty(fieldName))
            return null;

        return result.rows[0][fieldName];
    }

    // Returns the |value| formatted in a way that's appropriate for the given |fieldName|. Updating
    // the value should take this format too, so when making any changes here be sure to also
    // update the `_updateCustomPlayerField` method in this class.
    formatCustomPlayerField(fieldName, value) {
        switch (fieldName) {
            case 'last_seen':
            case 'level':
            case 'money_bank_type':
                return value;

            case 'custom_color': {
                let colorValue = (value >>> 0).toString(16);
                if (colorValue.length > 6)
                    colorValue = colorValue.substring(0, 6);  // remove the alpha channel
                
                // Make sure that blue-only colours (e.g. 0x0000FF) are shown consistently.
                colorValue = ('00000' + colorValue).substr(-6);

                // Return the color value as 0xRRGGBB, all in uppercase.
                return '0x' + colorValue.toUpperCase();
            }

            case 'last_ip':
                return [
                    value >>> 24 & 0xFF,
                    value >>> 16 & 0xFF,
                    value >>>  8 & 0xFF,
                    value        & 0xFF
                ].join('.');
        }

        // custom_color
    }

    // Updates the |fieldName| setting of the given |nickname| to the set |value|. Validation will
    // be applied based on the type of field.
    async updatePlayerField(nickname, fieldName, value) {
        const fields = this.getSupportedFields();

        if (!fields.hasOwnProperty(fieldName))
            throw new Error(`${fieldName} is not a field known to me. Please check !supported.`);
        
        const field = fields[fieldName];
        switch (field.type) {
            case PlayerDatabase.kTypeNumber:
                return this._updateNumericPlayerField(nickname, field.table, fieldName, value);
            case PlayerDatabase.kTypeString:
                return this._updateStringPlayerField(nickname, field.table, fieldName, value);
            case PlayerDatabase.kTypeCustom:
                return this._updateCustomPlayerField(nickname, field.table, fieldName, value);
            default:
                throw new Error(`${fieldName} has an invalid type defined in the code.`);
        }
    }

    // Generates a new random database salt, which is an integer between 100000000 and 999999999.
    generateDatabaseSalt() {
        return Math.floor(Math.random() * (999999999 - 100000000)) + 100000000;
    }

    // Updates the |field| setting of the given |nickname|, which is one of the custom values.
    // Validation and formatting specific to the |column| will be done in here.
    async _updateCustomPlayerField(nickname, table, column, value) {
        let processedValue = null;

        switch (column) {
            case 'custom_color':
                if (!/^0[xX][0-9a-fA-F]{6}$/.test(value))
                    throw new Error(`"${value}" is not a valid color format (0xRRGGBB).`);
                
                let color = parseInt(value.substring(2), 16);
                if (color > 2147483647)
                    color = -2147483648 + (color - (2147483647 + 1));

                processedValue = color;
                break;

            case 'last_ip':
                processedValue = ip2long(value);
                break;
            
            case 'last_seen':
                const date = new Date(value);
                if (Number.isNaN(date.getTime()))
                    throw new Error(`"${value}" is not a valid date format.`);
                
                if (date.getFullYear() < 2006 || date.getTime() > Date.now())
                    throw new Error('The last seen time must be between 2006 and right now.');

                processedValue = value;
                break;

            case 'level':
                if (!['Player', 'Administrator', 'Management'].includes(value))
                    throw new Error(`"${value}" is not a valid player level.`);
                
                processedValue = value;
                break;
            
            case 'money_bank_type':
                if (!['Normal', 'Premier'].includes(value))
                    throw new Error(`"${value}" is not a valid bank account type.`);
                
                processedValue = value;
                break;

            default:
                throw new Error(`Formatting for ${column} has not been implemented.`);
        }

        await this._updatePlayerFieldQuery(nickname, table, column, processedValue);

        // The complexity of the above data types has been hidden away from people on IRC, so no
        // need to show the actual `processedValue` here.
        return value;
    }

    // Updates the numeric |column| setting of the given |nickname|.
    async _updateNumericPlayerField(nickname, table, column, value) {
        const numericValue = parseInt(value, 10);
        if (numericValue <= -2147483648 || numericValue >= 2147483647)
            throw new Error('Numeric values must be between -2147483647 and 2147483646.');
        
        return this._updatePlayerFieldQuery(nickname, table, column, numericValue);
    }

    // Updates the textual |column| setting of the given |nickname|.
    async _updateStringPlayerField(nickname, table, column, value) {
        const stringValue = String(value);
        if (stringValue.length >= 64)
            throw new Error('Textual values must not be longer than 64 characters in length.');
        
        return this._updatePlayerFieldQuery(nickname, table, column, value);
    }

    // Actually updates the |column| in |table| to |value| for the given |nickname|. At this point
    // the |value| must have been normalized already, but it's still not trusted.
    async _updatePlayerFieldQuery(nickname, table, column, value) {
        const query = `
            UPDATE
                ${table}
            SET
                ${column} = ?
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

        const results = await server.database.query(query, value, nickname);
        if (!results || !results.affectedRows)
            throw new Error(`The player ${nickname} could not be found in the database.`);

        return value;
    }
}
