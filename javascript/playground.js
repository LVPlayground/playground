// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FeatureManager = require('components/feature_manager/feature_manager.js');

// The Playground class is the main runtime of the JavaScript implementation of the server. It owns
// the critical objects (e.g. the command manager) and features. A single instance will exist for
// the lifetime of the JavaScript runtime, available as `playground` on the global object.
class Playground {
  constructor() {
    this.featureManager_ = new FeatureManager(this);
    this.featureManager_.load({
      account:       require('features/account/account_feature.js'),
      activityLog:   require('features/activity_log/activity_log.js'),
      commands:      require('features/commands/commands_feature.js'),
      deathFeed:     require('features/death_feed/death_feed_feature.js'),
      debug:         require('features/debug/debug_feature.js'),
      friends:       require('features/friends/friends_feature.js'),
      gangs:         require('features/gangs/feature.js'),
      races:         require('features/races/race_feature.js')
    });
  }

  // Returns the instance of the feature manager.
  get featureManager() {
    return this.featureManager_;
  }
};

exports = Playground;
