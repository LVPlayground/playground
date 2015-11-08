// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let ChallengeDesk = require('features/races/challenge_desk.js'),
    RaceDatabase = require('features/races/race_database.js'),
    RunningRace = require('features/race/running_race.js');

// The race manager is responsible for keeping track of the available races, the in-progress races
// and providing the ability to start or stop races when that's necessary.
class RaceManager {
  constructor(database) {
    this.raceDatabase_ = new RaceDatabase(database);

    // An array of all races that are currently in-progress.
    this.activeRaces_ = [];

    this.races_ = {};
    this.challengeDesks_ = {};
  }

  // Returns the number of races that have been created on the system.
  get raceCount() {
    return Object.keys(this.races_).length;
  }

  // Registers |race| as a new race in the system. If the |race| has an associated challenge desk,
  // this will be created as well.
  registerRace(race) {
    if (this.races_.hasOwnProperty(race.id))
      throw new Error('A race with Id ' + race.id + ' already exists in the system.');

    this.races_[race.id] = race;
    if (!race.challengeDesk)
      return;

    this.challengeDesks_[race.id] = new ChallengeDesk(this, race);
  }

  // Asynchronously loads the best times for all known races from the database. They will be stored
  // in the Race instance associated with the race.
  loadBestTimes() {
    this.raceDatabase_.fetchBestTimes().then(bestTimes => {
      Object.keys(this.races_).forEach(raceId => {
        if (!bestTimes.hasOwnProperty(raceId))
          return;

        let bestTime = bestTimes[raceId];
        this.races_[raceId].bestRace = {
          time: bestTime.time,
          name: bestTime.name
        };
      });
    });
  }

  // Returns if |race_id| represents a valid race that could be started by the player.
  isValid(race_id) {
    return this.races_.hasOwnProperty(race_id);
  }

  // Starts the race |race_id| for |player|. When the |skipSignup| argument is set to TRUE, the
  // sign-up phase will be skipped and the race will begin immediately.
  startRace(player, race_id, skipSignup) {
    let activeRace = null;

    // If the sign-up phase does not have to be skipped (i.e. because it hasn't been started through
    // a challenge desk, or because the player is the only person online), find other races of the
    // same type that are currently in sign-up phase to join.
    if (!skipSignup) {
      this.activeRaces_.forEach(runningRace => {
        if (runningRace.race.id != race_id || runningRace.state != RunningRace.STATE_SIGNUP)
          return;

        activeRace = runningRace;
      });
    }

    // If there is an active race that can be joined, join it. Alternatively start a new race for
    // the player. If |skipSignup| is true, the announcement phase will be skipped.
    if (activeRace) {
      activeRace.addPlayer(player);
    } else {
      activeRace = new RunningRace(this.races_[race_id], player, skipSignup);
      activeRace.finished.then(() =>
          this.activeRaces_ = this.activeRaces_.filter(runningRace => activeRace !== runningRace));

      if (activeRace.state == RunningRace.STATE_SIGNUP)
        this.announceRace(activeRace);

      this.activeRaces_.push(activeRace);
    }
  }

  // Announces that |runningRace| has started and is now accepting sign-ups. Other players can join
  // for a given number of seconds before the race will automatically start.
  announceRace(runningRace) {
    // TODO: Announce that the race can be joined by other players.
  }

  // Returns a promise that will be resolved with a personalized list of races available for the
  // |player|, together with the all-time best time of registered players on the race. If |player|
  // is a registered player, their personal best time will be included in the overview as well.
  listRacesForPlayer(player) {
    if (!this.raceCount)
      return Promise.resolve([]);

    return this.raceDatabase_.fetchBestTimesForPlayer(player).then(bestTimes => {
      let races = [];

      Object.keys(this.races_).forEach(raceId => {
        let personalBest = bestTimes.hasOwnProperty(raceId) ? bestTimes[raceId] : null,
            race = this.races_[raceId];

        races.push({ id: race.id,
                     name: race.name,
                     bestRace: race.bestRace,
                     personalBestTime: personalBest });
      });

      return races;
    });
  }
};

exports = RaceManager;
