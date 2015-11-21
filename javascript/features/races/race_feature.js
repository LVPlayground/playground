// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Feature = require('components/feature_manager/feature.js'),
    RaceCommands = require('features/races/race_commands.js'),
    RaceImporter = require('features/races/race_importer.js'),
    RaceManager = require('features/races/race_manager.js');

// This class represents the Feature that contains all racing functionality of Las Venturas
// Playground. It also provides the interface for features depending on races.
class RaceFeature extends Feature {
  constructor(playground) {
    super(playground);

    // Races depend on the death feed for disabling it during a race.
    let deathFeed = this.defineDependency('death_feed');

    this.raceManager_ = new RaceManager(playground.database, deathFeed);
    this.raceCommands_ = new RaceCommands(playground.commandManager, this.raceManager_);

    // TODO: Import races using a glob() rather than manually.
    [
      'data/races/easy_race.json',
      'data/races/hard_race.json',
      'data/races/mountain_valleyside.json',
      'data/races/normal_race.json',
      'data/races/taste_of_things_to_come.json',

    ].forEach(file => this.raceManager_.registerRace(RaceImporter.fromFile(file)));

    // Load the best times for all races from the database.
    this.raceManager_.loadBestTimes();
  }
};

exports = RaceFeature;
