// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from "base/color.js";

// Query to compute the leaderboard entries for accuracy-based ranking.
const kAccuracyLeaderboardQuery = `
    SELECT
        sessions.user_id,
        users.username,
        IF(users_gangs.user_use_gang_color = 1,
            IFNULL(gangs.gang_color, users_mutable.custom_color),
            users_mutable.custom_color) AS color,
        (SUM(session_shots_hit) / (SUM(session_shots_hit) + SUM(session_shots_missed))) AS accuracy,
        SUM(session_shots_hit) AS shots_hit,
        SUM(session_shots_missed) AS shots_missed,
        SUM(session_shots_taken) AS shots_taken,
        SUM(session_duration) AS duration
    FROM
        sessions
    LEFT JOIN
        users ON users.user_id = sessions.user_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = sessions.user_id
    LEFT JOIN
        users_gangs ON users_gangs.user_id = sessions.user_id AND users_gangs.left_gang IS NULL
    LEFT JOIN
        gangs ON gangs.gang_id = users_gangs.gang_id AND gangs.gang_color IS NOT NULL
    WHERE
        sessions.session_date >= DATE_SUB(NOW(), INTERVAL ? DAY) AND
        sessions.session_shots_missed > 0 AND
        users.username IS NOT NULL
    GROUP BY
        sessions.user_id
    HAVING
        shots_hit > 1000
    ORDER BY
        accuracy DESC
    LIMIT
        ?`;

// Query to compute the leaderboard entries for damage-based ranking.
const kDamageLeaderboardQuery = `
    SELECT
        sessions.user_id,
        users.username,
        IF(users_gangs.user_use_gang_color = 1,
            IFNULL(gangs.gang_color, users_mutable.custom_color),
            users_mutable.custom_color) AS color,
        SUM(session_damage_given) AS damage_given,
        SUM(session_damage_taken) AS damage_taken,
        SUM(session_duration) AS duration,
        (SUM(session_shots_hit) + SUM(session_shots_missed)) AS shots
    FROM
        sessions
    LEFT JOIN
        users ON users.user_id = sessions.user_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = sessions.user_id
    LEFT JOIN
        users_gangs ON users_gangs.user_id = sessions.user_id AND users_gangs.left_gang IS NULL
    LEFT JOIN
        gangs ON gangs.gang_id = users_gangs.gang_id AND gangs.gang_color IS NOT NULL
    WHERE
        session_date >= DATE_SUB(NOW(), INTERVAL ? DAY) AND
        users.username IS NOT NULL
    GROUP BY
        sessions.user_id
    ORDER BY
        damage_given DESC
    LIMIT
        ?`;

// Retrieves leaderboard information from the database and makes it available to JavaScript in an
// intuitive and idiomatic manner. Not safe for testing, use MockLeaderboardDatabase instead.
export class LeaderboardDatabase {
    // Gets the leaderboard data when sorting players by in-game accuracy.
    async getAccuracyLeaderboard({ days, limit }) {
        const results = await this._getAccuracyLeaderboardQuery({ days, limit });
        const statistics = this.getOnlinePlayerStatistics();

        const leaderboard = [];

        for (const result of results) {
            const sessionStatistics = statistics.get(result.user_id);

            const sessionOnlineTime = sessionStatistics?.onlineTime ?? 0;
            const sessionShotsHit = sessionStatistics?.shotsHit ?? 0;
            const sessionShotsMissed = sessionStatistics?.shotsMissed ?? 0;
            const sessionShotsTaken = sessionStatistics?.shotsTaken ?? 0;

            const shotsHit = parseInt(result.shots_hit, 10) + sessionShotsHit;
            const shotsMissed = parseInt(result.shots_missed, 10) + sessionShotsMissed;
            const shotsTaken = parseInt(result.shots_taken, 10) + sessionShotsTaken;

            // Recalculate the |accuracy|, because it might've changed based on the database data.
            const accuracy = shotsHit / (shotsHit + shotsMissed);

            leaderboard.push({
                nickname: result.username,
                color: result.color !== 0 ? Color.fromNumberRGBA(result.color) : null,

                accuracy, shotsHit, shotsMissed, shotsTaken,

                duration: result.duration + sessionOnlineTime,
            });
        }

        // Re-sort the |leaderboard| now that live session statistics have been considered, which
        // may influence the positioning of certain players.
        leaderboard.sort((lhs, rhs) => {
            if (lhs.accuracy === rhs.accuracy)
                return 0;
            
            return lhs.accuracy > rhs.accuracy ? -1 : 1;
        });

        return leaderboard;
    }

    // Actually executes the query for getting the accuracy-based leaderboard.
    async _getAccuracyLeaderboardQuery({ days, limit }) {
        const results = await server.database.query(kAccuracyLeaderboardQuery, days, limit);
        return results && results.rows ? results.rows : [];
    }

    // Gets the leaderboard data when sorting players by amount of damage done.
    async getDamageLeaderboard({ days, limit }) {
        const results = await this._getDamageLeaderboardQuery({ days, limit });
        const statistics = this.getOnlinePlayerStatistics();

        const leaderboard = [];

        for (const result of results) {
            const sessionStatistics = statistics.get(result.user_id);

            const sessionOnlineTime = sessionStatistics?.onlineTime ?? 0;
            const sessionDamageGiven = sessionStatistics?.damageGiven ?? 0;
            const sessionDamageTaken = sessionStatistics?.damageTaken ?? 0;
            const sessionShots = sessionStatistics?.shots ?? 0;

            leaderboard.push({
                nickname: result.username,
                color: result.color !== 0 ? Color.fromNumberRGBA(result.color) : null,

                damageGiven: result.damage_given + sessionDamageGiven,
                damageTaken: result.damage_taken + sessionDamageTaken,

                duration: result.duration + sessionOnlineTime,
                shots: result.shots + sessionShots,
            });
        }

        // Re-sort the |leaderboard| now that live session statistics have been considered, which
        // may influence the positioning of certain players.
        leaderboard.sort((lhs, rhs) => {
            if (lhs.damageGiven === rhs.damageGiven)
                return 0;
            
            return lhs.damageGiven > rhs.damageGiven ? -1 : 1;
        });

        return leaderboard;
    }

    // Actually executes the query for getting the damage-based leaderboard.
    async _getDamageLeaderboardQuery({ days, limit }) {
        const results = await server.database.query(kDamageLeaderboardQuery, days, limit);
        return results && results.rows ? results.rows : [];
    }

    // Gets a Map of userId to PlayerStatsView instances for online player session statistics.
    getOnlinePlayerStatistics() {
        const statistics = new Map();

        for (const player of server.playerManager) {
            if (player.account.isIdentified())
                statistics.set(player.account.userId, player.stats.session);
        }

        return statistics;
    }
}
