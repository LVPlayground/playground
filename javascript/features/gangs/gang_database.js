// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import Gang from 'features/gangs/gang.js';

// Query for loading a gang's information for a specific player.
const LOAD_GANG_FOR_PLAYER_QUERY = `
    SELECT
        users_gangs.user_role,
        users_gangs.user_use_gang_color,
        gangs.*,
        UNIX_TIMESTAMP(gang_chat_encryption.encryption_expire) AS encryption_expire
    FROM
        users_gangs
    LEFT JOIN
        gangs ON gangs.gang_id = users_gangs.gang_id
    LEFT JOIN
        (
            SELECT
                gang_chat_encryption.gang_id,
                MAX(gang_chat_encryption.encryption_expire) AS encryption_expire
            FROM
                gang_chat_encryption
            GROUP BY
                gang_chat_encryption.gang_id
        ) AS gang_chat_encryption ON
             gang_chat_encryption.gang_id = users_gangs.gang_id
    WHERE
        users_gangs.user_id = ? AND
        users_gangs.gang_id = ? AND
        users_gangs.left_gang IS NULL`;

// Query to determine whether any gang currently exists for a given name or tag.
const GANG_EXISTS_QUERY = `
    SELECT
        gangs.gang_tag,
        gangs.gang_name
    FROM
        gangs
    WHERE
        (LOWER(gangs.gang_tag) = ? OR LOWER(gangs.gang_name) = ?) AND
        (NOT EXISTS(SELECT 1 FROM users_gangs WHERE users_gangs.gang_id = gangs.gang_id AND
                                                    users_gangs.left_gang IS NOT NULL))
    LIMIT
        1`;

// Query to determine whether any gang currently exists for a given name.
const NAME_EXISTS_QUERY = `
    SELECT
        gangs.gang_tag,
        gangs.gang_name
    FROM
        gangs
    WHERE
        LOWER(gangs.gang_name) = ? AND
        NOT EXISTS(SELECT 1 FROM users_gangs WHERE users_gangs.gang_id = gangs.gang_id AND
                                                   users_gangs.left_gang IS NOT NULL)
    LIMIT
        1`;

// Query to determine whether any gang currently exists for a given tag.
const TAG_EXISTS_QUERY = `
    SELECT
        gangs.gang_tag,
        gangs.gang_name
    FROM
        gangs
    WHERE
        LOWER(gangs.gang_tag) = ? AND
        NOT EXISTS(SELECT 1 FROM users_gangs WHERE users_gangs.gang_id = gangs.gang_id AND
                                                   users_gangs.left_gang IS NOT NULL)
    LIMIT
        1`;

// Query to read a full list of members from the database.
const GANG_MEMBERS_QUERY = `
    SELECT
        users_gangs.user_id,
        users_gangs.user_role,
        users.username,
        IF(users_gangs.user_use_gang_color = 1,
            IFNULL(gangs.gang_color, users_mutable.custom_color),
            users_mutable.custom_color) AS color,
        users_mutable.last_seen
    FROM
        users_gangs
    LEFT JOIN
        gangs ON gangs.gang_id = users_gangs.gang_id
    LEFT JOIN
        users ON users.user_id = users_gangs.user_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = users_gangs.user_id
    WHERE
        users_gangs.gang_id = ? AND
        users_gangs.left_gang IS NULL AND
        users.username IS NOT NULL
    ORDER BY
        users_gangs.user_role ASC,
        users.username ASC`;

// Query to actually create a gang in the database.
const GANG_CREATE_QUERY = `
    INSERT INTO
        gangs
        (gang_tag, gang_name, gang_goal)
    VALUES
        (?, ?, ?)`;

// Query to clear prior memberships when joining a new gang.
const GANG_CLEAR_MEMBER_QUERY = `
    UPDATE
        users_gangs
    SET
        users_gangs.left_gang = NOW()
    WHERE
        users_gangs.user_id = ? AND
        users_gangs.left_gang IS NULL`;

// Query to add a member to a given gang in the database.
const GANG_CREATE_MEMBER_QUERY = `
    INSERT INTO
        users_gangs
        (user_id, gang_id, user_role, joined_gang)
    VALUES
        (?, ?, ?, NOW())`;

// Query to remove a player from a given gang.
const GANG_REMOVE_MEMBER_QUERY = `
    UPDATE
        users_gangs
    SET
        users_gangs.left_gang = NOW()
    WHERE
        users_gangs.user_id = ? AND
        users_gangs.gang_id = ? AND
        users_gangs.left_gang IS NULL`;

// Query to determine the next person in the line of succession of the gang. We can rely on
// ascending ordering here because [Leader, Manager, Member] happens to be alphabetically ordered.
const GANG_DETERMINE_NEXT_LEADER = `
    SELECT
        users_gangs.user_id,
        users_gangs.user_role,
        users.username
    FROM
        users_gangs
    LEFT JOIN
        users ON users.user_id = users_gangs.user_id
    WHERE
        users_gangs.user_id != ? AND
        users_gangs.gang_id = ? AND
        users_gangs.user_role != 'Leader' AND
        users_gangs.left_gang IS NULL
    ORDER BY
        users_gangs.user_role ASC,
        users_gangs.joined_gang ASC
    LIMIT
        1`;

// Query to update the role of a given player in a given gang to a given role.
const GANG_UPDATE_ROLE_QUERY = `
    UPDATE
        users_gangs
    SET
        users_gangs.user_role = ?
    WHERE
        users_gangs.user_id = ? AND
        users_gangs.gang_id = ? AND
        users_gangs.left_gang IS NULL`;

// Query to purchase additional encryption time for the gang's communications.
const PURCHASE_CHAT_ENCRYPTION_QUERY = `
    INSERT INTO
        gang_chat_encryption
        (gang_id, user_id, purchase_date, purchase_amount, encryption_expire)
    VALUES
        (?, ?, NOW(), ?, FROM_UNIXTIME(?))`;

// Query to update the skin of a gang.
const GANG_UPDATE_SKIN_QUERY = `
    UPDATE
        gangs
    SET
        gangs.gang_skin = ?
    WHERE
        gangs.gang_id = ?`;

// Query to update the color of a gang.
const GANG_UPDATE_COLOR_QUERY = `
    UPDATE
        gangs
    SET
        gangs.gang_color = ?
    WHERE
        gangs.gang_id = ?`;

// Query to update the personal color preferences of a gang member.
const GANG_UPDATE_COLOR_PREFERENCES_QUERY = `
    UPDATE
        users_gangs
    SET
        users_gangs.user_use_gang_color = ?
    WHERE
        users_gangs.user_id = ? AND
        users_gangs.gang_id = ? AND
        users_gangs.left_gang IS NULL`;

// Query to update the name of a gang.
const GANG_UPDATE_NAME_QUERY = `
    UPDATE
        gangs
    SET
        gangs.gang_name = ?
    WHERE
        gangs.gang_id = ?`;

// Query to update the tag of a gang.
const GANG_UPDATE_TAG_QUERY = `
    UPDATE
        gangs
    SET
        gangs.gang_tag = ?
    WHERE
        gangs.gang_id = ?`;

// Query to update the goal of a gang.
const GANG_UPDATE_GOAL_QUERY = `
    UPDATE
        gangs
    SET
        gangs.gang_goal = ?
    WHERE
        gangs.gang_id = ?`;

// Query to update gang bank account balance.
const GANG_UPDATE_BALANCE_ACCESS_QUERY = `
    UPDATE
        gangs
    SET
        gangs.gang_balance_access = ?
    WHERE
        gangs.gang_id = ?`;

// Query to get the balance a gang has in their bank account.
const GANG_GET_BALANCE_QUERY = `
    SELECT
        gangs.gang_balance
    FROM
        gangs
    WHERE
        gangs.gang_id = ?`;

// Query to get the transaction logs for a particular gang.
const GANG_GET_TRANSACTION_LOG_QUERY = `
    SELECT
        gang_transaction_log.transaction_date,
        gang_transaction_log.transaction_amount,
        gang_transaction_log.transaction_reason,
        users.username
    FROM
        gang_transaction_log
    LEFT JOIN
        users ON users.user_id = gang_transaction_log.user_id
    WHERE
        gang_transaction_log.gang_id = ?
    ORDER BY
        gang_transaction_log.transaction_date DESC
    LIMIT
        ?`;

// Query to update the balance of a gang with the specified mutation.
const GANG_UPDATE_BALANCE_QUERY = `
    UPDATE
        gangs
    SET
        gangs.gang_balance = gangs.gang_balance + ?
    WHERE
        gangs.gang_id = ?`;

// Query to add a new transaction to the transaction log of a particular gang.
const GANG_ADD_TRANSACTION_LOG_QUERY = `
    INSERT INTO
        gang_transaction_log
        (gang_id, user_id, transaction_date, transaction_amount, transaction_reason)
    VALUES
        (?, ?, NOW(), ?, ?)`;

// The gang database is responsible for interacting with the MySQL database for queries related to
// gangs, e.g. loading, storing and updating the gang and player information.
class GangDatabase {
    // Options for the `gangs.gang_balance_access` field, which is an enumeration.
    static kAccessLeader = 0;
    static kAccessLeaderAndManagers = 1;
    static kAccessEveryone = 2;

    // Loads information for |gangId| from the perspective of |userId| from the database. Returns a
    // promise that will be resolved when the information is available.
    async loadGangForPlayer(userId, gangId) {
        const results = await server.database.query(LOAD_GANG_FOR_PLAYER_QUERY, userId, gangId);
        if (results.rows.length !== 1)
            return null;

        const info = results.rows[0];
        return {
            role: GangDatabase.toRoleValue(info.user_role),
            useGangColor: info.user_use_gang_color,
            gang: {
                id: info.gang_id,
                tag: info.gang_tag,
                name: info.gang_name,
                goal: info.gang_goal,
                balance: info.gang_balance,
                balanceAccess: GangDatabase.toAccessValue(info.gang_balance_access),
                color: info.gang_color ? Color.fromNumberRGBA(info.gang_color) : null,
                chatEncryptionExpiry: info.encryption_expire || 0,
                skinId: info.gang_skin
            }
        };
    }

    // Returns a promise that will be resolved with an object indicating whether any gang exists
    // having the |tag| or |name|. Both the tag and name will be lowercased.
    async doesGangExists(tag, name) {
        tag = tag.toLowerCase();
        name = name.toLowerCase();

        const results = await server.database.query(GANG_EXISTS_QUERY, tag, name);
        if (results.rows.length === 0)
            return { available: true };

        const info = results.rows[0];
        return {
            available: false,
            tag: info.gang_tag,
            name: info.gang_name
        };
    }

    // Returns a promise that will be resolved with a boolean indicating whether any existing gang
    // (with members) is using the given |name|.
    async doesNameExist(name) {
        const results = await server.database.query(NAME_EXISTS_QUERY, name.toLowerCase());
        return results.rows.length > 0;
    }

    // Returns a promise that will be resolved with a boolean indicating whether any existing gang
    // (with members) is using the given |tag|.
    async doesTagExist(tag) {
        const results = await server.database.query(TAG_EXISTS_QUERY, tag.toLowerCase());
        return results.rows.length > 0;
    }

    // Creates a gang having the |tag|, named |name| pursuing |goal|, and returns a promise that
    // will be resolved with the gang's information when the operation has completed. The |player|
    // shall be stored in the database as the gang's leader.
    async createGangWithLeader(player, tag, name, goal) {
        let gangId = null;

        const results = await server.database.query(GANG_CREATE_QUERY, tag, name, goal);
        if (results.insertId === null)
            throw new Error('Unexpectedly got NULL as the inserted Id.');

        gangId = results.insertId;

        await server.database.query(GANG_CLEAR_MEMBER_QUERY, player.account.userId);
        await server.database.query(
            GANG_CREATE_MEMBER_QUERY, player.account.userId, results.insertId, 'Leader');

        return {
            id: gangId,
            tag: tag,
            name: name,
            goal: goal,
            balance: 0,
            balanceAccess: GangDatabase.kLeaderAndManagers,
            color: null,
            chatEncryptionExpiry: 0,
            skinId: null
        };
    }

    // Gets a full list of members for |gang|. Returns a promise that will be resolved with the
    // members when the operation has completed.
    async getFullMemberList(gang) {
        const results = await server.database.query(GANG_MEMBERS_QUERY, gang.id);

        let gangMembers = [];

        results.rows.forEach(row => {
            gangMembers.push({
                role: GangDatabase.toRoleValue(row.user_role),
                userId: row.user_id,
                username: row.username,
                color: row.color !== 0 ? Color.fromNumberRGBA(row.color) : null,
                lastSeen: new Date(row.last_seen),
            });
        });

        return gangMembers;
    }

    // Adds |player| to |gang|. Returns a promise that will be resolved when the information has
    // been stored in the database.
    async addPlayerToGang(player, gang) {
        const userId = player.account.userId;
        const gangId = gang.id;

        await server.database.query(GANG_CLEAR_MEMBER_QUERY, userId);
        await server.database.query(GANG_CREATE_MEMBER_QUERY, userId, gangId, 'Member');
    }

    // Removes the |userId| from the |gang|. Returns a promise that will be resolved with a boolean
    // reflecting whether the information in the database has been updated.
    async removePlayerFromGang(userId, gang) {
        const results = await server.database.query(GANG_REMOVE_MEMBER_QUERY, userId, gang.id);
        return results.affectedRows >= 1;
    }

    // Determines the best person to lead the |gang| after |player| has left. Returns a promise that
    // will be resolved with the userId, name and current role of the newly suggested leader.
    async determineSuccessionAfterDeparture(player, gang) {
        const results =
            await server.database.query(GANG_DETERMINE_NEXT_LEADER, player.account.userId, gang.id);

        if (results.rows.length === 0)
            return null;

        const successor = results.rows[0];
        return {
            userId: successor.user_id,
            username: successor.username,
            role: successor.user_role  // string used for presentation
        };
    }

    // Updates the role of |userId| in |gang| to |role|. Returns a promise that will be resolved
    // without value when this operation has completed.
    async updateRoleForUserId(userId, gang, role) {
        await server.database.query(GANG_UPDATE_ROLE_QUERY, GangDatabase.toRoleString(role),
                                   userId, gang.id);
    }

    // Asynchronously creates an entry in the database where the |player| member of the |gang| has
    // purchased an additional |encryptionTime| seconds of gang chat encryption.
    async purchaseChatEncryption(gang, player, encryptionTime) {
        await server.database.query(
            PURCHASE_CHAT_ENCRYPTION_QUERY, gang.id, player.id, encryptionTime,
            gang.chatEncryptionExpiry);
    }

    // Updates the skin of the |gang| to |skinId|. Returns a promise that will be resolved when the
    // database has been updated with the new information.
    async updateSkinId(gang, skinId) {
        await server.database.query(GANG_UPDATE_SKIN_QUERY, skinId, gang.id);        
    }

    // Updates the color of the |gang| to |color|. Returns a promise that will be resolved when the
    // database has been updated with the new information.
    async updateColor(gang, color) {
        await server.database.query(GANG_UPDATE_COLOR_QUERY, color.toNumberRGBA(), gang.id);
    }

    // Updates the color preferences of |player| in |gang| to |useGangColor|. Returns a promise that
    // will be resolved when the database has been updated with the new information.
    async updateColorPreference(gang, player, useGangColor) {
        await server.database.query(
            GANG_UPDATE_COLOR_PREFERENCES_QUERY, useGangColor ? 1 : 0,
            player.account.userId, gang.id);
    }

    // Updates the name of the |gang| to |name|. Returns a promise that will be resolved when the
    // database has been updated with the new information.
    async updateName(gang, name) {
        await server.database.query(GANG_UPDATE_NAME_QUERY, name, gang.id);
    }

    // Updates the tag of the |gang| to |tag|. Returns a promise that will be resolved when the
    // database has been updated with the new information.
    async updateTag(gang, tag) {
        await server.database.query(GANG_UPDATE_TAG_QUERY, tag, gang.id);
    }

    // Updates the goal of the |gang| to |goal|. Returns a promise that will be resolved when the
    // database has been updated with the new information.
    async updateGoal(gang, goal) {
        await server.database.query(GANG_UPDATE_GOAL_QUERY, goal, gang.id);
    }

    // Updates who's able to withdraw from the |gang|'s balance. Can only be changed by leaders.
    async updateBalanceAccess(gang, access) {
        await server.database.query(
            GANG_UPDATE_BALANCE_ACCESS_QUERY, GangDatabase.toAccessString(access), gang.id);
    }

    // Returns the balance of the gang identified by |gangId| from the database. This works even
    // when the gang is not connected to the server.
    async getBalance(gangId) {
        const results = await server.database.query(GANG_GET_BALANCE_QUERY, gangId);
        if (!results || results.rows.length !== 1)
            return null;  // unable to load the balance
        
        return results.rows[0].gang_balance;
    }

    // Returns the transaction logs from the given |gangId|. Up to |limit| entries will be returned.
    async getTransactionLog(gangId, { limit = 30 } = {}) {
        const results = await server.database.query(GANG_GET_TRANSACTION_LOG_QUERY, gangId, limit);
        const transactions = [];

        if (results) {
            for (const row of results.rows) {
                transactions.push({
                    date: new Date(row.transaction_date),
                    amount: row.transaction_amount,
                    reason: row.transaction_reason,
                    username: row.username,
                });
            }
        }

        return transactions;
    }

    // Processes a gang bank transaction for the given |gangId|, as initiated by the |userId| which
    // may be NULL (when it's the server initiating the transation). The |amount| will be withdrawn
    // from their balance, and the transaction will be logged with the given |reason|.
    async processTransaction(gangId, userId, amount, reason) {
        await Promise.all([
            server.database.query(GANG_UPDATE_BALANCE_QUERY, amount, gangId),
            server.database.query(GANG_ADD_TRANSACTION_LOG_QUERY, gangId, userId, amount, reason),
        ]);
    }

    // Utility function for converting a role string to a Gang.ROLE_* value.
    static toRoleValue(role) {
        switch (role) {
            case 'Leader':
                return Gang.ROLE_LEADER;
            case 'Manager':
                return Gang.ROLE_MANAGER;
            case 'Member':
                return Gang.ROLE_MEMBER;
            default:
                throw new Error('Invalid gang role: ' + role);
        }
    }

    // Utility function for converting a Gang.ROLE_* value to a role string.
    static toRoleString(role) {
        switch (role) {
            case Gang.ROLE_LEADER:
                return 'Leader';
            case Gang.ROLE_MANAGER:
                return 'Manager';
            case Gang.ROLE_MEMBER:
                return 'Member';
            default:
                throw new Error('Invalid gang role: ' + role);
        }
    }

    // Utility function for converting an access string to a Gang.kAccess* value.
    static toAccessValue(access) {
        switch (access) {
            case 'LeaderOnly':
                return GangDatabase.kAccessLeader;
            case 'LeaderAndManagers':
                return GangDatabase.kAccessLeaderAndManagers;
            case 'Everyone':
                return GangDatabase.kAccessEveryone;
            default:
                throw new Error('Invalid gang balance access: ' + access);
        }
    }

    // Utility function for converting an access value to a string.
    static toAccessString(access) {
        switch (access) {
            case GangDatabase.kAccessLeader:
                return 'LeaderOnly';
            case GangDatabase.kAccessLeaderAndManagers:
                return 'LeaderAndManagers';
            case GangDatabase.kAccessEveryone:
                return 'Everyone';
            default:
                throw new Error('Invalid gang balance access: ' + access);
        }
    }
}

// Values that can be returned by the GangDatabase.doesGangExist() method.
GangDatabase.EXISTS_AVAILABLE = 0;
GangDatabase.EXISTS_TAG = 1;
GangDatabase.EXISTS_NAME = 2;

export default GangDatabase;
