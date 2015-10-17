// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Feature = require('components/feature_manager/feature.js');

// The feature manager owns all the features available in the JavaScript implementation of the
// server, provides cross-feature interfaces and access to many of the shared objects.
class FeatureManager {
  constructor() {
    this.features_ = {};
  }

  // Loads all the |features|. The |features| parameter is expected to be an object where the key
  // maps to the feature's name, and the value to the function to be instantiated for the feature.
  load(playground, features) {
    Object.keys(features).forEach(feature => {
      let instance = new features[feature](playground);
      if (!(instance instanceof Feature))
        throw new Error('All features must extend the Feature class (failed for "' + feature + '").');

      this.features_[feature] = instance;
    });
  }
};

exports = FeatureManager;
