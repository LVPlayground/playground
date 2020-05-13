// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to determine the active players on Las Venturas Playground, per the definition documented
// in README.md. Should only be run on feature initialization.
const SEED_ACTIVE_MEMBERS_QUERY = `
    SELECT
        users_gangs.user_id,
        users_gangs.gang_id
    FROM
        users_gangs
    LEFT JOIN
        users_mutable ON users_mutable.user_id = users_gangs.user_id
    WHERE
        users_gangs.left_gang IS NULL AND
        (
            (users_mutable.online_time >= 3600000) OR
            (users_mutable.online_time >= 1800000 AND users_mutable.last_seen > DATE_SUB(NOW(), INTERVAL 24 MONTH)) OR
            (users_mutable.online_time >= 720000  AND users_mutable.last_seen > DATE_SUB(NOW(), INTERVAL 12 MONTH)) OR
            (users_mutable.last_seen > DATE_SUB(NOW(), INTERVAL 6 MONTH))
        )`;

// Query to get details about the active gangs, on the server, so that their information can be
// properly initialized in the GangDataAggregator.
const SEED_ACTIVE_GANGS_QUERY = `
    SELECT
        gangs.gang_id,
        gangs.gang_name,
        gangs.gang_color
    FROM
        gangs
    WHERE
        gangs.gang_id IN (?)`;

// Query to fetch information about a particular gang's members after initialization has completed.
const GET_ACTIVE_MEMBERS_FOR_GANG_QUERY = `
    SELECT
        users_gangs.gang_id,
        users_gangs.user_id
    FROM
        users_gangs
    LEFT JOIN
        users_mutable ON users_mutable.user_id = users_gangs.user_id
    WHERE
        users_gangs.gang_id = ? AND
        users_gangs.left_gang IS NULL AND
        (
            (users_mutable.online_time >= 3600000) OR
            (users_mutable.online_time >= 1800000 AND users_mutable.last_seen > DATE_SUB(NOW(), INTERVAL 24 MONTH)) OR
            (users_mutable.online_time >= 720000  AND users_mutable.last_seen > DATE_SUB(NOW(), INTERVAL 12 MONTH)) OR
            (users_mutable.last_seen > DATE_SUB(NOW(), INTERVAL 6 MONTH))
        )`;

// Provides database access and mutation abilities for the gang zone feature. Tests should use the
// MockZoneDatabase class instead, which avoids relying on actual MySQL connections.
export class ZoneDatabase {
    // Returns the active players on the server. Should only be used at feature initialization time,
    // as callbacks an internal state mangling is expected to keep things in sync otherwise.
    async getActiveMembers({ gangId = null } = {}) {
        const results = await this._getActiveMembersQuery({ gangId });
        const players = [];

        if (results && results.rows.length > 0) {
            for (const row of results.rows) {
                players.push({
                    userId: row.user_id,
                    gangId: row.gang_id,
                });
            }
        }

        return players;
    }

    async _getActiveMembersQuery({ gangId }) {
        return gangId !== null ? server.database.query(GET_ACTIVE_MEMBERS_FOR_GANG_QUERY, gangId)
                               : server.database.query(SEED_ACTIVE_MEMBERS_QUERY);
    }

    // Returns details about the active gangs listed in |activeGangIds|, which must be an iterable
    // object. Structure of the returned information will match //features/gangs/gang.js.
    async getActiveGangs(activeGangIds) {
        const results = await this._getActiveGangsQuery(activeGangIds);
        const gangs = [];

        if (results && results.rows.length > 0) {
            for (const row of results.rows) {
                gangs.push({
                    id: row.gang_id,
                    name: row.gang_name,
                    color: row.gang_color ? Color.fromNumberRGB(row.gang_color)
                                          : null,
                });
            }
        }

        return gangs;
    }

    async _getActiveGangsQuery(activeGangIds) {
        return server.database.query(SEED_ACTIVE_GANGS_QUERY, [...activeGangIds]);
    }
}
