// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let ChallengeDesk = require('features/races/challenge_desk.js'),
    RaceDatabase = require('features/races/race_database.js');

// The race manager is responsible for keeping track of the available races, the in-progress races
// and providing the ability to start or stop races when that's necessary.
class RaceManager {
  constructor(database) {
    this.raceDatabase_ = new RaceDatabase(database);

    this.races_ = {};
    this.challengeDesks_ = {};
  }

  // Registers |race| as a new race in the system. If the |race| has an associated challenge desk,
  // this will be created as well.
  registerRace(race) {
    if (this.races_.hasOwnProperty(race.id))
      throw new Error('A race with Id ' + race.id + ' already exists in the system.');

    this.races_[race.id] = race;
    if (race.challengeDesk === null)
      return;

    this.challengeDesks_[race.id] = new ChallengeDesk(this, race);
  }

  // Returns if |id| represents a valid race that could be started by the player.
  isValid(id) {
    return this.races_.hasOwnProperty(id);
  }

  // Starts the race |id| for |player|. When the |skipSignup| argument is set to TRUE, the sign-up
  // phase will be skipped and the race will begin immediately.
  startRace(player, id, skipSignup) {
    // TODO: Either start the sign-up phase for the race, or start the race immediately if the
    //       |skipSignup| argument is set to true.
  }

  // Returns a promise that will be resolved with a personalized list of races available for the
  // |player|, together with the all-time best time of registered players on the race. If |player|
  // is a registered player, their personal best time will be included in the overview as well.
  listRacesForPlayer(player) {
    // TODO: Abort if there are no races.
    // TODO: If the user is not registered, just return a list of available races w/ best times.
    // TODO: If the user is registered, fetch their best times from the database.

    return Promise.resolve([
      { id: 1, name: 'My Race', bestTime: 60, personalBestTime: 120 }
    ]);
  }
};

exports = RaceManager;
