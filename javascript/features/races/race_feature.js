// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Feature = require('components/feature_manager/feature.js'),
    RaceManager = require('features/races/race_manager.js');

// This class represents the Feature that contains all racing functionality of Las Venturas
// Playground. It also provides the interface for features depending on races.
class RaceFeature extends Feature {
  constructor(playground) {
    super(playground);

    this.raceManager_ = new RaceManager();
    this.raceCommands_ = new RaceCommands(playground.commandManager, this.raceManager_);
  }
};

exports = RaceFeature;
