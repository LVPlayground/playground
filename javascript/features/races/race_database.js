// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The race database class provides a bridge between the race manager and the MySQL database that
// is backing Las Venturas Playground. It's primarily used to store and retrieve the best times of
// players on each of the games.
class RaceDatabase {
  constructor(database) {
    this.database_ = database;
  }

  // Fetches the best times for each known race for |player|.
  fetchBestTimesForPlayer(player) {
    return Promise.reject();
  }
};

exports = RaceDatabase;
