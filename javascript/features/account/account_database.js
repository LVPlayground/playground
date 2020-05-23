// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ip2long, long2ip } from 'features/nuwani_commands/ip_utilities.js';
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

// Query to read the password salt from the database for the given user.
const PLAYER_HASHED_PASSWORD_QUERY = `
    SELECT
        password,
        password_salt
    FROM
        users
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
        users.username,
        users.level,
        users.is_vip,
        users_mutable.online_time,
        users_mutable.kill_count,
        users_mutable.death_count,
        users_mutable.last_seen
    FROM
        users_nickname
    LEFT JOIN
        users ON users.user_id = users_nickname.user_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = users_nickname.user_id
    WHERE
        users_nickname.nickname = ?`;

// Query to find nicknames similar to the given text, ordered by most recent activity.
const PLAYER_NICKNAME_QUERY = `
    SELECT
        users_nickname.nickname
    FROM
        users_nickname
    LEFT JOIN
        users_mutable ON users_mutable.user_id = users_nickname.user_id
    WHERE
        users_nickname.nickname COLLATE latin1_general_ci LIKE CONCAT('%', ?, '%')
    ORDER BY
        users_mutable.last_seen DESC
    LIMIT
        5`;

// MySQL query for getting the most recent log entries of a player.
const PLAYER_LOG_ENTRIES_QUERY = `
    SELECT
        log_date,
        log_type,
        IFNULL(username, user_nickname) AS user_nickname,
        subject_nickname,
        description
    FROM
        logs
    LEFT JOIN
        users ON users.user_id = logs.user_id
    WHERE
        subject_user_id = ? AND
        (? = 1 OR log_type != 'note')
    ORDER BY
        log_date DESC`;

// MySQL query for getting the player's #N most recent sessions.
const PLAYER_SESSIONS_QUERY = `
    SELECT
        session_date,
        session_duration,
        nickname,
        ip_address
    FROM
        sessions
    WHERE
        user_id = ?
    ORDER BY
        session_date DESC
    LIMIT
        ?`;

// Query to get information about a particular account from the database.
const PLAYER_INFORMATION_QUERY = `
    SELECT
        users.username,
        users.level,
        users.is_vip,
        (
            SELECT
                SUM(revenue_amount)
            FROM
                lvp_website.financial_revenue
            WHERE
                sender_id = users_links.user_id
        ) AS donations,
        (
            SELECT
                COUNT(1)
            FROM
                sessions
            WHERE
                user_id = users.user_id
        ) AS sessions,
        b.registered,
        b.email,
        b.karma
    FROM
        users
    LEFT JOIN
        lvp_website.users_links ON users_links.samp_id = users.user_id
    LEFT JOIN
        lvp_website.users b ON b.user_id = users_links.user_id
    WHERE
        users.user_id = ?`;

// Query to get the aliases associated with a nickname, as well as a flag on whether a particular
// entry is their main username.
const PLAYER_ALIASES_QUERY = `
    SELECT
        users_nickname.user_id,
        users_nickname.nickname,
        users_nickname.creation_date,
        (
            SELECT
                MAX(sessions.session_date)
            FROM
                sessions
            WHERE
                sessions.user_id = users_nickname.user_id AND
                sessions.nickname COLLATE latin1_general_ci = users_nickname.nickname
        ) AS last_seen,
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
        (user_id, nickname, creation_date)
    VALUES
        (?, ?, NOW())`;

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
        nickname,
        date
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

// Query to create a new user account in the database.
const CREATE_ACCOUNT_QUERY = `
    INSERT INTO
        users
        (username, password, password_salt, validated, level)
    VALUES
        (?, ?, ?, 1, "Player")`;

// Query to associate a player's nickname with their new account.
const CREATE_NICKNAME_ACCOUNT_QUERY = `
    INSERT INTO
        users_nickname
        (user_id, nickname)
    VALUES
        (?, ?)`;
    
// Query to create the mutable user information in the database.
const CREATE_MUTABLE_ACCOUNT_QUERY = `
    INSERT INTO
        users_mutable
        (user_id)
    VALUES
        (?)`;

// Regular expression to test whether a string is a valid SA-MP nickname.
const kValidNicknameExpression = /^[0-9a-z\[\]\(\)\$@\._=]{1,24}$/i;

// Encapsulates the functionality required for executing account-related operations on the database,
// in a way that logic can be shared between different sources and reasons.
export class AccountDatabase {
    static kTypeNumber = 0;
    static kTypeString = 1;
    static kTypeCustom = 2;

    passwordSalt_ = null;

    // Updates the password salt that should be used when updating or creating new passwords.
    setPasswordSalt(passwordSalt) {
        this.passwordSalt_ = passwordSalt;
    }

    // Retrieves portions of the player information for the given |nickname| from the database that
    // will be used for outputting their information on IRC.
    async getPlayerSummaryInfo(nickname) {
        const results = await server.database.query(PLAYER_SUMMARY_QUERY, nickname);
        return results.rows.length ? results.rows[0]
                                   : null;
    }

    // Finds nicknames that are similar to the given |nickname|. Returns an array with the results,
    // which may be empty in case no results can be found.
    async findSimilarNicknames(nickname) {
        const results = await server.database.query(PLAYER_NICKNAME_QUERY, nickname);
        const nicknames = [];

        if (results && results.rows.length > 0) {
            for (const row of results.rows)
                nicknames.push(row.nickname);
        }

        return nicknames;
    }

    // Gets the player record for the given |userId|. All entries returned from this function are
    // safe to be shared with the player directly.
    async getPlayerRecord(userId, { includeNotes = false } = {}) {
        const results = await this._getPlayerRecordQuery(userId, { includeNotes });
        const record = [];

        for (const row of results) {
            record.push({
                date: new Date(row.log_date),
                type: row.log_type,
                issuedBy: row.user_nickname,
                issuedTo: row.subject_nickname,
                reason: row.description,
            });
        }

        return record;
    }

    // Actually executes the MySQL query for getting entries out of a player's log.
    async _getPlayerRecordQuery(userId, { includeNotes }) {
        const results =
            await server.database.query(PLAYER_LOG_ENTRIES_QUERY, userId, includeNotes ? 1 : 0);
        return results ? results.rows : [];
    }

    // Gets the |limit| most recent playing sessions for the given |userId|.
    async getPlayerSessions({ userId, limit = 50 } = {}) {
        const results = await this._getPlayerSessionsQuery({ userId, limit });
        const sessions = [];

        for (const row of results) {
            sessions.push({
                date: new Date(row.session_date),
                duration: row.session_duration,
                nickname: row.nickname,
                ip: long2ip(row.ip_address),
            });
        }

        return sessions;
    }

    // Actually executes the MySQL query for getting a player's most recent sessions.
    async _getPlayerSessionsQuery({ userId, limit }) {
        const results = await server.database.query(PLAYER_SESSIONS_QUERY, userId, limit);
        return results ? results.rows : [];
    }

    // Gets various bits of information about an account from the database.
    async getAccountInformation(userId) {
        let information = null;
        try {
            information = await this._getAccountInformationQuery(userId);
        } catch {
            // Getting account information requires access to the website's database, which is not
            // allowed for the staging (and/or local) environments. 
            return null;
        }

        return {
            username: information.username,
            email: information.email,
            registered: new Date(information.registered),
            karma: Math.round(information.karma),
            level: information.level,
            vip: information.is_vip,
            donations: information.donations / 100,
            sessions: information.sessions,
        };
    }

    // Actually executes the MySQL query for getting an account's information.
    async _getAccountInformationQuery(userId) {
        const results = await server.database.query(PLAYER_INFORMATION_QUERY, userId);
        return results ? results.rows[0] : [];
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

            if (!!row.is_primary) {
                results.nickname = row.nickname;
            } else {
                results.aliases.push({
                    nickname: row.nickname,
                    created: row.creation_date ? new Date(row.creation_date) : null,
                    lastSeen: row.last_seen ? new Date(row.last_seen) : null,
                });
            }
        }

        return results;
    }

    // Removes the given |alias| from the given |nickname|. The ordering here matters: |nickname|
    // must be the main nickname, where |alias| will be added to it.
    async addAlias(nickname, alias, allowAlias = false) {
        if (!kValidNicknameExpression.test(alias))
            throw new Error(`The alias ${alias} is not a valid SA-MP nickname.`);

        const [nicknameResults, aliasResults] = await Promise.all([
            this.getAliases(nickname),
            this.getAliases(alias),
        ]);

        if (!nicknameResults)
            throw new Error(`The player ${nickname} could not be found in the database.`);
        
        if (nicknameResults.nickname !== nickname && !allowAlias)
            throw new Error(`${nickname} is an alias by itself. Use their real nickname instead.`);
        
        if (aliasResults !== null)
            throw new Error(`There already is a player named ${alias} in the database.`);
        
        return this.addAliasQuery(nicknameResults.userId, alias);
    }

    // Actually adds the |alias| to the database for the given |userId|.
    async addAliasQuery(userId, alias) {
        const result = await server.database.query(PLAYER_ADD_ALIAS_QUERY, userId, alias);
        return result && result.affectedRows >= 1;
    }

    // Removes the given |alias| from the given |nickname|. The ordering here matters: |nickname|
    // must be the main nickname, where |alias| will be removed from it.
    async removeAlias(nickname, alias, allowAlias = false) {
        const nicknameResults = await this.getAliases(nickname);
        if (!nicknameResults)
            throw new Error(`The player ${nickname} could not be found in the database.`);
        
        if (nicknameResults.nickname !== nickname && !allowAlias)
            throw new Error(`${nickname} is an alias by itself. Use their main username instead.`);
        
        if (!nicknameResults.aliases.find(existingAlias => existingAlias.nickname === alias))
            throw new Error(`${alias} is not an alias of the given ${nickname}.`);
        
        return this.removeAliasQuery(nicknameResults.userId, alias);
    }

    // Actually removes the |alias| from the database for the given |userId|.
    async removeAliasQuery(userId, alias) {
        const result = await server.database.query(PLAYER_REMOVE_ALIAS_QUERY, userId, alias);
        return result && result.affectedRows >= 1;
    }

    // Gets the nickname history of the given |nickname|.
    async getNicknameHistory(nickname) {
        const results = await server.database.query(PLAYER_PAST_NICKNAMES_QUERY, nickname);
        if (!results || !results.rows.length)
            return null;
        
        const nicknames = [];
        for (const row of results.rows) {
            nicknames.push({
                nickname: row.nickname,
                date: new Date(row.date),
            });
        }
        
        return nicknames;
    }

    // Changes the nickname of the user identified by |nickname| to |newNickname|. This must be
    // their main nickname, and |newNickname| must not be in use yet either.
    async changeName(nickname, newNickname, allowAlias = false) {
        if (!kValidNicknameExpression.test(newNickname))
            throw new Error(`The alias ${newNickname} is not a valid SA-MP nickname.`);

        const [nicknameResults, newNicknameResults] = await Promise.all([
            this.getAliases(nickname),
            this.getAliases(newNickname),
        ]);

        if (!nicknameResults)
            throw new Error(`The player ${nickname} could not be found in the database.`);
        
        if (nicknameResults.nickname !== nickname && !allowAlias)
            throw new Error(`${nickname} is an alias. Use their actual username instead.`);
        
        if (newNicknameResults !== null)
            throw new Error(`There already is a player named ${newNickname} in the database.`);
        
        return this.changeNameQuery(nicknameResults.userId, nickname, newNickname);
    }

    // Actually changes the name of |nickname| to |newNickname|.
    async changeNameQuery(userId, nickname, newNickname) {
        await Promise.all([
            server.database.query(PLAYER_CHANGE_NAME_QUERY, newNickname, userId, nickname),
            server.database.query(PLAYER_REMOVE_ALIAS_QUERY, userId, nickname),
            server.database.query(PLAYER_ADD_ALIAS_QUERY, userId, newNickname),
            server.database.query(PLAYER_CHANGE_NAME_LOG_QUERY, userId, nickname),
        ]);

        return true;
    }

    // Returns the fields which may be modified by administrators.
    getSupportedFieldsForAdministrators() {
        return [
            'custom_color',
            'death_message',
            'money_bank',
            'money_bounty',
            'money_cash',
            'money_debt',
            'money_spawn',
            'skin_id',
            'validated',
        ];
    }

    // Returns which fields are supported by the !supported, !getvalue and !setvalue commands. This
    // is a hardcoded list because we only want to support a sub-set of the database column data.
    getSupportedFields() {
        return {
            custom_color: { table: 'users_mutable', type: AccountDatabase.kTypeCustom },
            death_count: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            death_message: { table: 'users_mutable', type: AccountDatabase.kTypeString },
            is_developer: { table: 'users', type: AccountDatabase.kTypeNumber },
            is_vip: { table: 'users', type: AccountDatabase.kTypeNumber },
            jailed: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            kill_count: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            last_ip: { table: 'users_mutable', type: AccountDatabase.kTypeCustom },
            last_seen: { table: 'users_mutable', type: AccountDatabase.kTypeCustom },
            level: { table: 'users', type: AccountDatabase.kTypeCustom },
            money_bank: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            money_bounty: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            money_cash: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            money_debt: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            money_spawn: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            online_time: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            preferred_radio_channel: { table: 'users_mutable', type: AccountDatabase.kTypeString },
            skin_id: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_carbombs: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_drivebys: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_exports: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_fc_deaths: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_fc_kills: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_heli_kills: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_minigame: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_packages: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            stats_reaction: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
            validated: { table: 'users', type: AccountDatabase.kTypeNumber },
        };
    }

    // Returns whether the AccountDatabase has the ability to update player passwords.
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

    // Validates whether the player identified by |nickname| would be able to sign in using the
    // |password|. Returns a boolean once the result is known.
    async validatePassword(nickname, password) {
        const data = await this._getHashedPasswordQuery(nickname);
        if (!data)
            return false;  // the nickname does not exist
        
        const hashedPassword = sha1(`${data.password_salt}${password}${this.passwordSalt_}`);
        return hashedPassword === data.password;
    }

    // Actually runs the database query necessary to get the password & salt associated with the
    // given |nickname|. This should enable us to verify the password in the JavaScript code.
    async _getHashedPasswordQuery(nickname) {
        const results = await server.database.query(PLAYER_HASHED_PASSWORD_QUERY, nickname);
        if (!results || !results.rows.length)
            return null;
        
        return results.rows[0];
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
        
        if (field.type === AccountDatabase.kTypeCustom)
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
                return value;

            case 'custom_color': {
                let colorValue = (value >>> 0).toString(16);
                if (colorValue.length > 6)
                    colorValue = colorValue.substring(0, 6);  // remove the alpha channel
                
                // Make sure that blue-only colours (e.g. #0000FF) are shown consistently.
                colorValue = ('00000' + colorValue).substr(-6);

                // Return the color value as #RRGGBB, all in uppercase.
                return '#' + colorValue.toUpperCase();
            }

            case 'last_ip':
                return long2ip(value);
        }
    }

    // Updates the |fieldName| setting of the given |nickname| to the set |value|. Validation will
    // be applied based on the type of field.
    async updatePlayerField(nickname, fieldName, value) {
        const fields = this.getSupportedFields();

        if (!fields.hasOwnProperty(fieldName))
            throw new Error(`${fieldName} is not a field known to me. Please check !supported.`);
        
        const field = fields[fieldName];
        switch (field.type) {
            case AccountDatabase.kTypeNumber:
                return this._updateNumericPlayerField(nickname, field.table, fieldName, value);
            case AccountDatabase.kTypeString:
                return this._updateStringPlayerField(nickname, field.table, fieldName, value);
            case AccountDatabase.kTypeCustom:
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
                if (!/^#[0-9a-fA-F]{6}$/.test(value))
                    throw new Error(`"${value}" is not a valid color format (#RRGGBB).`);
                
                let color = Color.fromHex(value.substring(1), 0xAA);

                processedValue = color.toNumberRGBA();
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

    //  Registers a new account for |username|, identified by |password|.
    async createAccount(username, password) {
        if (!this.canUpdatePasswords())
            throw new Error('The `passwordSalt` configuration option is required for this.');

        const databaseSalt = this.generateDatabaseSalt();
        const hashedPassword = sha1(`${databaseSalt}${password}${this.passwordSalt_}`);

        const results = 
            await server.database.query(CREATE_ACCOUNT_QUERY, username, hashedPassword,
                                        databaseSalt);
        
        if (!results || !results.insertId)
            throw new Error(`Unable to create an account for ${username} in the database.`);
        
        await Promise.all([
            server.database.query(CREATE_MUTABLE_ACCOUNT_QUERY, results.insertId),
            server.database.query(CREATE_NICKNAME_ACCOUNT_QUERY, results.insertId, username),    
        ]);
    }
}
