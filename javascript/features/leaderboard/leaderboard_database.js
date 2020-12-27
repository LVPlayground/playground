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
        shots_hit > 1000 AND
        shots_missed > 100
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

// Query to compute the leaderboard entries based on gang activity.
const kGangsLeaderboardQuery = `
    SELECT
        gangs.gang_id,
        gangs.gang_name,
        IFNULL(gangs.gang_color, 0) AS color,
        COUNT(DISTINCT sessions.user_id) AS member_count,
        SUM(sessions.session_death_count) AS death_count,
        SUM(sessions.session_kill_count) AS kill_count,
        SUM(sessions.session_damage_given) AS damage_given,
        SUM(sessions.session_damage_taken) AS damage_taken,
        SUM(sessions.session_shots_hit) AS shots_hit,
        SUM(sessions.session_shots_missed) AS shots_missed
    FROM
        sessions
    LEFT JOIN
        users ON users.user_id = sessions.user_id
    LEFT JOIN
        users_gangs ON users_gangs.user_id = sessions.user_id AND users_gangs.left_gang IS NULL
    LEFT JOIN
        gangs ON gangs.gang_id = users_gangs.gang_id AND gangs.gang_color IS NOT NULL
    WHERE
        session_date >= DATE_SUB(NOW(), INTERVAL ? DAY) AND
        users.username IS NOT NULL AND
        users_gangs.gang_id IS NOT NULL AND
        gangs.gang_name IS NOT NULL
    GROUP BY
        users_gangs.gang_id
    ORDER BY
        kill_count DESC
    LIMIT
        ?`;

// Query to compute the leaderboard entries based on kill & death statistics.
const kKillLeaderboardQuery = `
    SELECT
        sessions.user_id,
        users.username,
        IF(users_gangs.user_use_gang_color = 1,
            IFNULL(gangs.gang_color, users_mutable.custom_color),
            users_mutable.custom_color) AS color,
        SUM(session_death_count) AS death_count,
        SUM(session_kill_count) AS kill_count,
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
        kill_count DESC
    LIMIT
        ?`;

// Query to compute the leaderboard entries for reaction tests.
const kReactionTestLeaderboardQuery = `
    SELECT
        sessions.user_id,
        users.username,
        IF(users_gangs.user_use_gang_color = 1,
            IFNULL(gangs.gang_color, users_mutable.custom_color),
            users_mutable.custom_color) AS color,
        users_mutable.stats_reaction AS reaction_tests_total,
        SUM(session_reaction_tests) AS reaction_tests,
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
        session_date >= DATE_SUB(NOW(), INTERVAL ? DAY) AND
        users.username IS NOT NULL
    GROUP BY
        sessions.user_id
    ORDER BY
        reaction_tests DESC
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

            const shotsHit = result.shots_hit + sessionShotsHit;
            const shotsMissed = result.shots_missed + sessionShotsMissed;
            const shotsTaken = result.shots_taken + sessionShotsTaken;

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

    // Gets the leaderboard data for ruling gangs. This works a little bit differently from the
    // other leaderboards, as this is tied to gangs rather than individual players.
    async getGangsLeaderboard({ days, limit }) {
        const results = await this._getGangsLeaderboardQuery({ days, limit });
        const statistics = new Map();

        // Get the session statistics of in-game players, grouped by the gang they're part of.
        for (const player of server.playerManager) {
            if (!player.account.isIdentified() || !player.gangId)
                continue;
            
            if (statistics.has(player.gangId))
                statistics.get(player.gangId).add(player.stats.session);
            else
                statistics.set(player.gangId, new Set([ player.stats.session ]));
        }

        const leaderboard = [];

        for (const result of results) {
            let sessionKillCount = 0, sessionDeathCount = 0;
            let sessionDamageGiven = 0, sessionDamageTaken = 0;
            let sessionShotsHit = 0, sessionShotsMissed = 0;

            for (const stats of statistics.get(result.gang_id) || []) {
                sessionDeathCount += stats.deathCount;
                sessionKillCount += stats.killCount;
                
                sessionDamageGiven += stats.damageGiven;
                sessionDamageTaken += stats.damageTaken;

                sessionShotsHit += stats.shotsHit;
                sessionShotsMissed = stats.shotsMissed;
            }

            // Total number of shots that were fired by this gang.
            const totalShots =
                result.shots_hit + sessionShotsHit + result.shots_missed + sessionShotsMissed;

            leaderboard.push({
                name: result.gang_name,
                color: result.color !== 0 ? Color.fromNumberRGBA(result.color) : null,
                members: result.member_count,

                // (1) Kill / death statistics
                deathCount: result.death_count + sessionDeathCount,
                killCount: result.kill_count + sessionKillCount,
                ratio: (result.kill_count + sessionKillCount) /
                            (result.death_count + sessionDeathCount),

                // (2) Damage statistics
                damageGiven: result.damage_given + sessionDamageGiven,
                damageTaken: result.damage_taken + sessionDamageTaken,
                damageRatio: (result.damage_given + sessionDamageGiven) /
                                (result.damage_taken + sessionDamageTaken),

                // (3) Accuracy statistics
                shots: totalShots,
                accuracy: (result.shots_hit + sessionShotsHit) / totalShots
            });
        }

        // Re-sort the |leaderboard| now that live session statistics have been considered, which
        // may influence the positioning of certain gangs.
        leaderboard.sort((lhs, rhs) => {
            if (lhs.killCount === rhs.killCount)
                return 0;
            
            return lhs.killCount > rhs.killCount ? -1 : 1;
        });

        return leaderboard;
    }

    // Actually executes the query for getting the gangs-based leaderboard.
    async _getGangsLeaderboardQuery({ days, limit }) {
        const results = await server.database.query(kGangsLeaderboardQuery, days, limit);
        return results && results.rows ? results.rows : [];
    }

    // Gets the leaderboard data when sorting players by number of kills.
    async getKillsLeaderboard({ days, limit }) {
        const results = await this._getKillsLeaderboardQuery({ days, limit });
        const statistics = this.getOnlinePlayerStatistics();

        const leaderboard = [];

        for (const result of results) {
            const sessionStatistics = statistics.get(result.user_id);

            const sessionOnlineTime = sessionStatistics?.onlineTime ?? 0;
            const sessionDeathCount = sessionStatistics?.deathCount ?? 0;
            const sessionKillCount = sessionStatistics?.killCount ?? 0;
            const sessionShots = sessionStatistics?.shots ?? 0;

            const deathCount = result.death_count + sessionDeathCount;
            const killCount = result.kill_count + sessionKillCount;

            leaderboard.push({
                nickname: result.username,
                color: result.color !== 0 ? Color.fromNumberRGBA(result.color) : null,

                deathCount, killCount,
                ratio: deathCount > 0 ? killCount / deathCount
                                      : killCount,

                duration: result.duration + sessionOnlineTime,
                shots: result.shots + sessionShots,
            });
        }

        // Re-sort the |leaderboard| now that live session statistics have been considered, which
        // may influence the positioning of certain players.
        leaderboard.sort((lhs, rhs) => {
            if (lhs.killCount === rhs.killCount)
                return 0;
            
            return lhs.killCount > rhs.killCount ? -1 : 1;
        });

        return leaderboard;
    }

    // Actually executes the query for getting the kill-based leaderboard.
    async _getKillsLeaderboardQuery({ days, limit }) {
        const results = await server.database.query(kKillLeaderboardQuery, days, limit);
        return results && results.rows ? results.rows : [];
    }

    // Gets the leaderboard data when sorting players by number of reaction test wins.
    async getReactionTestsLeaderboard({ days, limit }) {
        const results = await this._getReactionTestLeaderboardQuery({ days, limit });
        const statistics = this.getOnlinePlayerStatistics();

        const leaderboard = [];

        for (const result of results) {
            const sessionStatistics = statistics.get(result.user_id);

            const sessionOnlineTime = sessionStatistics?.onlineTime ?? 0;
            const sessionReactionTests = sessionStatistics?.reactionTests ?? 0;

            leaderboard.push({
                nickname: result.username,
                color: result.color !== 0 ? Color.fromNumberRGBA(result.color) : null,

                reactionTests: result.reaction_tests + sessionReactionTests,
                reactionTestsTotal: result.reaction_tests_total + sessionReactionTests,

                duration: result.duration + sessionOnlineTime,
            });
        }

        // Re-sort the |leaderboard| now that live session statistics have been considered, which
        // may influence the positioning of certain players.
        leaderboard.sort((lhs, rhs) => {
            if (lhs.reactionTests === rhs.reactionTests)
                return 0;

            return lhs.reactionTests > rhs.reactionTests ? -1 : 1;
        });

        return leaderboard;
    }

    // Actually executes the query for getting the reaction test-based leaderboard.
    async _getReactionTestLeaderboardQuery({ days, limit }) {
        const results = await server.database.query(kReactionTestLeaderboardQuery, days, limit);
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
