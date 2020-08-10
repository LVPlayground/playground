// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';

// Query to fetch the high scores across races, including the person who set it.
const kQueryHighscores = `
    SELECT
        race_results.race_id,
        race_results.result_time,
        users.username,
        IF(users_gangs.user_use_gang_color = 1,
            IFNULL(gangs.gang_color, users_mutable.custom_color),
            users_mutable.custom_color) AS color
    FROM
        (SELECT
             inner_race_results.race_id,
             MIN(inner_race_results.result_time) AS result_time
         FROM
            race_results AS inner_race_results
         GROUP BY
             inner_race_results.race_id) AS inner_race_results
    LEFT JOIN
        race_results ON race_results.race_id = inner_race_results.race_id AND
        race_results.result_time = inner_race_results.result_time
    LEFT JOIN
        users ON users.user_id = race_results.user_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = race_results.user_id
    LEFT JOIN
        users_gangs ON users_gangs.user_id = race_results.user_id AND users_gangs.left_gang IS NULL
    LEFT JOIN
        gangs ON gangs.gang_id = users_gangs.gang_id AND gangs.gang_color IS NOT NULL`;

// Query to fetch the high scores across races for a particular player.
const kQueryPlayerHighscores = `
    SELECT
        race_results.race_id,
        MIN(race_results.result_time) AS result_time
    FROM
        race_results
    WHERE
        race_results.user_id = ?
    GROUP BY
        race_results.race_id`;

// Provides the ability for the Races feature to interact with the database, for the purpose of
// storing high-scores and checkpoint time information for the participants.
export class RaceDatabase {
    // Retrieves the race highscores across the server from the database, and returns them as a Map
    // keyed by race ID, and valued by the race's high score in seconds.
    async getHighscores() {
        const scores = new Map();

        for (const result of await this.getHighscoresQuery()) {
            scores.set(result.race_id, {
                color: result.color !== 0 ? Color.fromNumberRGBA(result.color) : null,
                username: result.username,
                time: result.result_time
            });
        }

        return scores;
    }

    // Actually executes the query for getting highscore information from the server. Returns an
    // array of rows, or an empty array when a database error occurred.
    async getHighscoresQuery() {
        const results = await server.database.query(kQueryHighscores);
        return results && results.rows ? results.rows : [];
    }

    // Retrieves race highscores for the given |player|. If the |player| has not registered with
    // Las Venturas Playground yet, or there is a database error, NULL will be returned instead.
    async getHighscoresForPlayer(player) {
        if (!player.account.isIdentified())
            return null;

        const scores = new Map();

        for (const result of await this.getHighscoresForPlayerQuery(player))
            scores.set(result.race_id, result.result_time);

        return scores;
    }

    // Actually executes the query on the database for reading the highscores of the given |player|,
    // who is assumed to be registered. Returns an array of rows.
    async getHighscoresForPlayerQuery(player) {
        const results = await server.database.query(kQueryPlayerHighscores, player.account.userId);
        return results && results.rows ? results.rows : [];
    }
}
