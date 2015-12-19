// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandManager = require('components/command_manager/command_manager.js'),
    Database = require('components/database/database.js'),
    FeatureManager = require('components/feature_manager/feature_manager.js');

// The Playground class is the main runtime of the JavaScript implementation of the server. It owns
// the critical objects (e.g. the command manager) and features. A single instance will exist for
// the lifetime of the JavaScript runtime, available as `playground` on the global object.
class Playground {
  constructor() {
    this.commandManager_ = new CommandManager();
    this.database_ = new Database();

    this.featureManager_ = new FeatureManager();
    this.featureManager_.load(this, {
      account:       require('features/account/account_feature.js'),
      death_feed:    require('features/death_feed/death_feed_feature.js'),
      debug:         require('features/debug/debug_feature.js'),
      gangs:         require('features/gangs/feature.js'),
      introduction:  require('features/introduction/introduction.js'),
      races:         require('features/races/race_feature.js')
    });
  }

  // Returns the instance of the command manager.
  get commandManager() {
    return this.commandManager_;
  }

  // Returns the (established) MySQL database connection.
  get database() {
    return this.database_;
  }

  // Returns the instance of the feature manager.
  get featureManager() {
    return this.featureManager_;
  }
};

exports = Playground;
