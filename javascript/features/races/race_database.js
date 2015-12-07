// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// MySQL query for fetching the best times for each individual race.
const FETCH_BEST_TIMES_QUERY = `
  SELECT
    race_results.race_id,
    race_results.result_time,
    users.username
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
    users ON users.user_id = race_results.user_id`;

// MySQL query for fetching the best times for an individual player. This query takes one parameter:
// the account id of the player for whom to fetch best times.
const FETCH_BEST_PLAYER_TIMES_QUERY = `
    SELECT
      race_results.race_id,
      MIN(race_results.result_time) AS result_time
    FROM
      race_results
    WHERE
      race_results.user_id = ?
    GROUP BY
      race_results.race_id`;

// MySQL query to fetch the best race results for a given number of players.
const FETCH_BEST_RACE_RESULTS_QUERY = `
    SELECT
      best_time_per_player.user_id,
      race_results.result_time,
      race_checkpoint_results.checkpoint_time AS checkpoint_time
    FROM
      (SELECT
         user_id, MIN(result_time) AS result_time
       FROM
         race_results
       WHERE
         race_id = ? AND
         user_id IN (?)
       GROUP BY
         user_id) AS best_time_per_player
    LEFT JOIN
      race_results ON race_results.user_id = best_time_per_player.user_id AND
                      race_results.result_time = best_time_per_player.result_time
    LEFT JOIN
      race_checkpoint_results ON race_checkpoint_results.result_id = race_results.result_id`;

// MySQL query for storing the high-level result of a race done by the player.
const STORE_RACE_RESULT_QUERY = `
    INSERT INTO
      race_results
      (user_id, race_id, race_date, result_rank, result_time)
    VALUES
      (?, ?, NOW(), ?, ?)`;

// MySQL query for storing the results of the individual checkpoints for a race result.
const STORE_RACE_CHECKPOINT_RESULT_QUERY = `
    INSERT INTO
      race_checkpoint_results
      (result_id, checkpoint_index, checkpoint_time)
    VALUES `;

// The race database class provides a bridge between the race manager and the MySQL database that
// is backing Las Venturas Playground. It's primarily used to store and retrieve the best times of
// players on each of the games.
class RaceDatabase {
  constructor(database) {
    this.database_ = database;
  }

  // Fetches the best times for each known race, together with the player who raced it. The result
  // will include *all* races, not just those available in the race manager.
  fetchBestTimes() {
    return this.database_.query(FETCH_BEST_TIMES_QUERY).then(result => {
      let times = {};

      result.rows.forEach(row =>
          times[row.race_id] = { time: Math.round(row.result_time / 1000),
                                 name: row.username });

      return times;
    });
  }

  // Fetches the best times for each known race for |player|. A promise will be returned that will
  // be fulfilled with an object having a mapping between race Id and personal best time in seconds.
  //
  // An empty object ("no high scores") will be used for unregistered players. The returned object
  // will include best times for *all* races, not just those available in the race manager.
  fetchBestTimesForPlayer(player) {
    if (!player.isRegistered())
      return Promise.resolve({});

    return this.database_.query(FETCH_BEST_PLAYER_TIMES_QUERY, player.account.userId).then(result => {
      let times = {};

      result.rows.forEach(row =>
          times[row.race_id] = Math.round(row.result_time / 1000));

      return times;
    });
  }

  // Fetches detailed statistics about the best races for all |userIds| on |raceId|. A promise will
  // be returned that will be resolved the best times, and the per-checkpoint times for all users.
  fetchBestRaceResult(raceId, userIds) {
    return this.database_.query(FETCH_BEST_RACE_RESULTS_QUERY, raceId, userIds).then(result => {
      if (!result.rows.length)
        return {};

      let userResults = {};
      result.rows.forEach(resultRow => {
        if (!userResults.hasOwnProperty(resultRow.user_id)) {
          userResults[resultRow.user_id] = { totalTime: resultRow.result_time,
                                             checkpointTimes: [] };
        }

        userResults[resultRow.user_id].checkpointTimes.push(resultRow.checkpoint_time);
      });

      return userResults;
    });
  }

  // Stores the result as driven by |userId| on the |raceId| race. It took them |totalTime|
  // milliseconds to finish the race. |checkpointTimes| is an array with the number of milliseconds
  // at which they passed through each of the checkpoints of the race.
  storeRaceResult(raceId, userId, rank, totalTime, checkpointTimes) {
    return this.database_.query(STORE_RACE_RESULT_QUERY, userId, raceId, rank, totalTime).then(result => {
      if (!result.insertId)
        return;  // the result couldn't be written.

      if (!checkpointTimes.length)
        return;  // races with a single checkpoint don't have intermediary times.

      let checkpointId = 0,
          parameters = [],
          values = [];

      checkpointTimes.forEach(time => {
        parameters.push(result.insertId, checkpointId++, time);
        values.push('(?, ?, ?)');
      });

      return this.database_.query(STORE_RACE_CHECKPOINT_RESULT_QUERY + values.join(', '), ...parameters);
    });
  }
};

exports = RaceDatabase;
