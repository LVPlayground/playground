// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

// Query to determine the active players on Las Venturas Playground, per the definition documented
// in README.md. Should only be run on feature initialization.
const SEED_ACTIVE_MEMBERS_QUERY = `
    SELECT
        users_gangs.user_id,
        users_gangs.gang_id,
        users.is_vip
    FROM
        users_gangs
    LEFT JOIN
        users ON users.user_id = users_gangs.user_id
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
        gangs.gang_goal,
        gangs.gang_color
    FROM
        gangs
    WHERE
        gangs.gang_id IN (?)`;

// Query to fetch information about a particular gang's members after initialization has completed.
const GET_ACTIVE_MEMBERS_FOR_GANG_QUERY = `
    SELECT
        users_gangs.gang_id,
        users_gangs.user_id,
        users.is_vip
    FROM
        users_gangs
    LEFT JOIN
        users ON users.user_id = users_gangs.user_id
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

// Query to load all live decorations for a particular zone from the database.
const LOAD_DECORATIONS_QUERY = `
    SELECT
        gang_decorations.decoration_id,
        gang_decorations.model_id,
        gang_decorations.position_x,
        gang_decorations.position_y,
        gang_decorations.position_z,
        gang_decorations.rotation_x,
        gang_decorations.rotation_y,
        gang_decorations.rotation_z
    FROM
        gang_decorations
    WHERE
        gang_decorations.gang_id = ? AND
        gang_decorations.decoration_removed IS NULL AND
        gang_decorations.position_x >= ? AND gang_decorations.position_x <= ? AND
        gang_decorations.position_y >= ? AND gang_decorations.position_y <= ?`;

// Query to store a gang zone decoration in the database.
const STORE_DECORATION_QUERY = `
    INSERT INTO
        gang_decorations
        (decoration_added, gang_id, model_id, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z)
    VALUES
        (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`;

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
                    isVip: row.is_vip,
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
                    goal: row.gang_goal,
                    color: row.gang_color ? Color.fromNumberRGBA(row.gang_color)
                                          : null,
                });
            }
        }

        return gangs;
    }

    async _getActiveGangsQuery(activeGangIds) {
        return server.database.query(SEED_ACTIVE_GANGS_QUERY, [...activeGangIds]);
    }

    // Loads the decorations for the given |zone| from the database. Each decoration will be
    // returned with full positioning information, as well as its model and unique Ids.
    async loadDecorationsForZone(zone) {
        const results = await this._loadDecorationsForZoneQuery(zone);
        const decorations = [];

        if (results && results.rows.length > 0) {
            for (const row of results.rows) {
                decorations.push({
                    decorationId: row.decoration_id,
                    modelId: row.model_id,
                    position: new Vector(row.position_x, row.position_y, row.position_z),
                    rotation: new Vector(row.rotation_x, row.rotation_y, row.rotation_z),
                });
            }
        }

        return decorations;
    }

    async _loadDecorationsForZoneQuery(zone) {
        return server.database.query(
            LOAD_DECORATIONS_QUERY, zone.gangId, zone.area.minX, zone.area.maxX, zone.area.minY,
            zone.area.maxY);
    }

    // Stores the object having |modelId| with |position| and |rotation| in the database for the
    // given |gangId|. Will return the new unique Id for the object.
    async createDecoration(gangId, modelId, position, rotation) {
        const results = await server.database.query(
            STORE_DECORATION_QUERY, gangId, modelId, position.x, position.y, position.z, rotation.x,
            rotation.y, rotation.z);
        
        if (!results || !results.insertId)
            return null;  // the object could not be stored in the database 
        
        return results.insertId;
    }
}
