// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// MySQL query for fetching the best times for each individual race.
const FETCH_BEST_TIMES_QUERY = `
    SELECT
      race_results.race_id,
      MAX(race_results.race_result_time) AS race_result_time,
      users.username
    FROM
      race_results
    LEFT JOIN
      users ON users.user_id = race_results.user_id
    GROUP BY
      race_results.race_id`;

// MySQL query for fetching the best times for an individual player. This query takes one parameter:
// the account id of the player for whom to fetch best times.
const FETCH_BEST_PLAYER_TIMES_QUERY = `
    SELECT
      race_results.race_id,
      MAX(race_results.race_result_time) AS race_result_time
    FROM
      race_results
    WHERE
      race_results.user_id = ?
    GROUP BY
      race_results.race_id`;

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
          times[row.race_id] = { time: row.race_result_time,
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
          times[row.race_id] = row.race_result_time);

      return times;
    });
  }
};

exports = RaceDatabase;
