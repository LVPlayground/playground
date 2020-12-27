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
        users.user_id,
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
        IF(BINARY users.username = users_nickname.nickname, 1, 0) AS is_primary
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

// Query to determine which players are geographically nearby a particular longitude/latitude pair.
// This depends on the GCDistDeg function: http://mysql.rjweb.org/doc.php/find_nearest_in_mysql
const NEARBY_QUERY = `
    SELECT
        users.username,
        users_mutable.last_seen,
        COUNT(sessions_geographical.session_id) AS session_count,
        CEIL((GCDistDeg(ST_X(sessions_geographical.session_point),
                        ST_Y(sessions_geographical.session_point),
                        ?, ?) * 69.172) / 50) * 50 AS distance
    FROM
        sessions_geographical
    LEFT JOIN
        sessions ON sessions.session_id = sessions_geographical.session_id
    LEFT JOIN
        users ON users.user_id = sessions.user_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = sessions.user_id
    WHERE
        sessions.session_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND
        sessions.user_id != 0
    GROUP BY
        sessions.user_id, distance
    ORDER BY
        distance ASC, session_count DESC
    LIMIT
        50`;

// Query to change permanently the level of a particular player, keyed by user Id.
const PLAYER_BETA_SET_LEVEL = `
    UPDATE
        users
    SET
        users.level = ?
    WHERE
        users.user_id = ?`;

// Query to change whether a particular player, keyed by user Id, has VIP rights.
const PLAYER_BETA_SET_VIP = `
    UPDATE
        users
    SET
        users.is_vip = ?
    WHERE
        users.user_id = ?`;

// Query for identifying proxy information for a particular IP address.
const WHEREIS_PROXY_QUERY = `
    SELECT
        ip2proxy.country_name,
        ip2proxy.region_name,
        ip2proxy.city_name,
        ip2proxy.isp,
        ip2proxy.domain,
        ip2proxy.usage_type,
        ip2proxy.as,
        ip2proxy.asn
    FROM
        (
            SELECT
                ip2proxy_px8.ip_from,
                ip2proxy_px8.country_name,
                ip2proxy_px8.region_name,
                ip2proxy_px8.city_name,
                ip2proxy_px8.isp,
                ip2proxy_px8.domain,
                ip2proxy_px8.usage_type,
                ip2proxy_px8.as,
                ip2proxy_px8.asn
            FROM
                lvp_location.ip2proxy_px8
            WHERE
                ip2proxy_px8.ip_to >= INET_ATON(?)
            LIMIT
                1
        ) AS ip2proxy
    WHERE
        ip2proxy.ip_from <= INET_ATON(?)`;

// Query for identifying location information for a particular IP address.
const WHEREIS_LOCATION_QUERY = `
    SELECT
        ip2location.longitude,
        ip2location.latitude,
        ip2location.country_name,
        ip2location.region_name,
        ip2location.city_name,
        ip2location.time_zone
    FROM
        (
            SELECT
                ip2location_db11.ip_from,
                ip2location_db11.longitude,
                ip2location_db11.latitude,
                ip2location_db11.country_name,
                ip2location_db11.region_name,
                ip2location_db11.city_name,
                ip2location_db11.time_zone
            FROM
                lvp_location.ip2location_db11
            WHERE
                ip2location_db11.ip_to >= INET_ATON(?)
            LIMIT
                1
        ) AS ip2location
    WHERE
        ip2location.ip_from <= INET_ATON(?)`;

// Query to investigate which players are likely candidates for a given IP address and serial
// number. Uses a ton of heuristics to get to a reasonable sorting of results.
const WHOIS_QUERY = `
    SELECT
        IFNULL(users.username, sessions.nickname) AS nickname,
        IF(users.username IS NULL, 0, 1) AS registered,
        sessions.ip_address,
        @ip_distance := CASE
            WHEN sessions.ip_address = ? THEN 1
            WHEN sessions.ip_address >= ? AND sessions.ip_address <= ? THEN 2
            WHEN sessions.ip_address >= ? AND sessions.ip_address <= ? THEN 3
            ELSE 4
        END AS ip_address_distance,
        sessions.gpci_hash,
        @gpci_common := IFNULL(sessions_common_gpci.hits, 0) AS gpci_common,
        MAX(sessions.session_date) AS last_seen,
        COUNT(*) AS hits,
        (
            IF(@ip_distance = 1, 5, 0) +
            IF(@ip_distance = 2, 4, 0) +
            IF(@ip_distance = 3, 2, 0) +
            IF(sessions.gpci_hash = ? AND sessions_common_gpci.hits IS NULL, 4, 0) +
            IF(sessions.gpci_hash = ? AND sessions_common_gpci.hits IS NOT NULL, 2, 0) +
            IF(users.username IS NOT NULL AND COUNT(*) > 25, 2, 0) +
            IF(users.username IS NOT NULL, 2, 0)
        ) AS score
    FROM
        sessions
    LEFT JOIN
        sessions_common_gpci ON sessions_common_gpci.gpci_hash = sessions.gpci_hash AND
                                sessions_common_gpci.gpci_hash > 250
    LEFT JOIN
        users ON users.user_id = sessions.user_id
    WHERE
        (
            (sessions.user_id IS NULL AND sessions.session_date > DATE_SUB(NOW(), INTERVAL 6 MONTH)) OR
            (sessions.user_id IS NOT NULL AND sessions.session_date > DATE_SUB(NOW(), INTERVAL 18 MONTH))
        ) AND
        (
            (sessions.ip_address >= ? AND sessions.ip_address <= ?) OR
            (sessions.gpci_hash = ?)
        )
    GROUP BY
        nickname, ip_address_distance, gpci_hash
    ORDER BY
        score DESC, hits DESC, last_seen DESC
    LIMIT
        20`;

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
            'muted',
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
            require_sampcac: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
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
            muted: { table: 'users_mutable', type: AccountDatabase.kTypeNumber },
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

    // Changes the level of the |userId| to the given |level|.
    async setUserLevel(userId, level) {
        await server.database.query(PLAYER_BETA_SET_LEVEL, level, userId);
    }

    // Changes whether the |userId| has VIP rights or not.
    async setUserVip(userId, vip) {
        await server.database.query(PLAYER_BETA_SET_VIP, (!!vip) ? 1 : 0, userId);
    }

    // Runs a query that finds a number of nearby players, grouped together in distance groups,
    // based on the given |ip| address. A where-is query will be ran to locate that first.
    async nearby(ip) {
        const where = await this.whereIs(ip);
        if (!where.location)
            return null;

        const results = await this._nearbyQuery(where.location.latitude, where.location.longitude);
        const nearby = [];

        if (results) {
            for (const result of results) {
                nearby.push({
                    username: result.username,
                    lastSeen: new Date(result.last_seen),
                    sessions: result.session_count,
                    distance: result.distance,
                });
            }
        }

        return nearby;
    }

    // Executes the actual MySQL query necessary for identifying nearby players.
    async _nearbyQuery(latitude, longitude) {
        const results = await server.database.query(NEARBY_QUERY, latitude, longitude);
        return results && results.rows.length ? results.rows : null;
    }

    // Runs a query that figures out where the |ip| address is, and if it's a known proxy server of
    // a particular type. Aids administrators in identifying who someone might be.
    async whereIs(ip) {
        const [ proxyResults, locationResults ] = await this._whereIsQueries(ip);
        const results = {
            proxy: null,
            location: null,
        };

        // (1) Process results about the proxy lookup for the given |ip| address.
        if (proxyResults && proxyResults.rows.length === 1) {
            const row = proxyResults.rows[0];
            results.proxy = {
                country: row.country_name,
                region: row.region_name,
                city: row.city_name,

                isp: row.isp,
                domain: row.domain,
                usage: this.parseUsageType(row.usage_type),

                network: row.asn,
                networkName: row.as,
            };
        }

        // (2) Process results about the location lookup for the given |ip| address.
        if (locationResults && locationResults.rows.length === 1) {
            const row = locationResults.rows[0];
            results.location = {
                longitude: row.longitude,
                latitude: row.latitude,

                country: row.country_name,
                region: row.region_name,
                city: row.city_name,
                timeZone: row.time_zone
            };
        }

        // (3) Return the formatted results to the caller.
        return results;
    }

    // Parses the given |usage|, which is a set of type acronyms divided by slashes.
    parseUsageType(usage) {
        const kMapping = {
            COM: 'Commercial',
            ORG: 'Organisation',
            GOV: 'Government',
            MIL: 'Military',
            EDU: 'Education',
            LIB: 'Library',
            CDN: 'Content Delivery',
            ISP: 'Internet Provider',
            MOB: 'Mobile Carrier',
            DCH: 'Network Infra',
            SES: 'Search Engine',
            RSV: 'Reserved',
        };

        const types = new Set();

        for (const type of usage.split('/'))
            types.add(kMapping[type] ?? 'Unknown');

        return [ ...types ].sort();
    }

    // Actually executes the Where Is-related queries on the database.
    async _whereIsQueries(ip) {
        return await Promise.all([
            server.database.query(WHEREIS_PROXY_QUERY, ip, ip),
            server.database.query(WHEREIS_LOCATION_QUERY, ip, ip),
        ]);
    }

    // Query to find similar users based on a given IP address and serial number. Most of the logic
    // is contained within the query, but some post-processing is done in JavaScript.
    async whois(ip, serial) {
        const numericIp = ip2long(ip);
        const classC = [
            ip2long(ip.replace(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/, '$1.$2.$3.0')),
            ip2long(ip.replace(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/, '$1.$2.$3.255')),
        ];

        const classB = [
            ip2long(ip.replace(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/, '$1.$2.0.0')),
            ip2long(ip.replace(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/, '$1.$2.255.255')),
        ];

        const results = await this._whoisQuery(numericIp, classC, classB, serial);
        const matches = [];

        for (const row of results) {
            let match = null;

            switch (row.ip_address_distance) {
                case 1:
                    match = ip;
                    break;
                
                case 2:
                    match = ip.replace(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/, '$1.$2.$3.*');
                    break;
                
                case 3:
                    match = ip.replace(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/, '$1.$2.*.*');
                    break;
                
                case 4:
                    match = 'no match';
                    break;
            }

            matches.push({
                nickname: row.nickname,
                registered: !!row.registered,
                hits: row.hits,

                ip: long2ip(row.ip_address),
                ipDistance: row.ip_address_distance,
                ipMatch: match,

                serial: row.gpci_hash,
                serialCommon: !!row.gpci_common,

                lastSeen: new Date(row.last_seen),
                score: row.score,
            });
        }

        return matches;
    }

    // Actually executes the WHOIS query for the given information.
    async _whoisQuery(numericIp, classC, classB, serial) {
        const result = await server.database.query(
            WHOIS_QUERY, numericIp, classC[0], classC[1], classB[0], classB[1], serial, serial,
            classB[0], classB[1], serial);
        
        return result && result.rows ? result.rows : [];
    }
}
