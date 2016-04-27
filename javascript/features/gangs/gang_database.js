// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Gang = require('features/gangs/gang.js');

// Query for loading a gang's information for a specific player.
const LOAD_GANG_FOR_PLAYER_QUERY = `
    SELECT
        users_gangs.user_role,
        gangs.*
    FROM
        users_gangs
    LEFT JOIN
        gangs ON gangs.gang_id = users_gangs.gang_id
    WHERE
        users_gangs.user_id = ? AND
        users_gangs.gang_id = ?`;

// The gang database is responsible for interacting with the MySQL database for queries related to
// gangs, e.g. loading, storing and updating the gang and player information.
class GangDatabase {
    constructor(database) {
        this.database_ = database;
    }

    // Loads information for |gangId| from the perspective of |userId| from the database. Returns a
    // promise that will be resolved when the information is available.
    loadGangForPlayer(userId, gangId) {
        return this.database_.query(LOAD_GANG_FOR_PLAYER_QUERY, userId, gangId).then(results => {
            if (results.rows.length !== 1)
                return null;

            const info = results.rows[0];
            return {
                role: toRoleValue(info.user_role),
                gang: {
                    id: info.gang_id,
                    tag: info.gang_tag,
                    name: info.gang_name,
                    goal: info.gang_goal,
                    color: info.gang_color
                }
            };
        });
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
}

exports = GangDatabase;
