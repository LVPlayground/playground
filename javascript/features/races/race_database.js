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

  // Fetches the best times for each known race, together with the player who raced it.
  fetchBestTimes() {
    return Promise.resolve({
      /** race Id **/ 0: {
        time: 0,
        name: 'nobody'
      }
    })
  }

  // Fetches the best times for each known race for |player|. A promise will be returned that will
  // be fulfilled with an object having a mapping between race Id and personal best time in seconds.
  //
  // An empty object ("no high scores") will be used for unregistered players.
  fetchBestTimesForPlayer(player) {
    if (!player.isRegistered())
      return Promise.resolve({});

    return Promise.resolve({
      /** race Id **/ 0: /** best time (sec) **/ 120,
    });
  }
};

exports = RaceDatabase;
