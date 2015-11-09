// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Feature class must be the base class of all features.
class Feature {
  constructor(playground) {
    this.playground_ = playground;
  }

  // Defines a dependency on |feature|. If |feature| cannot be found by the feature manager, an
  // exception will be thrown as dependencies must be satisfyable. Furthermore, there may not be any
  // circular dependencies in Las Venturas Playground.
  defineDependency(feature) {
    return this.playground_.featureManager.defineDependency(this, feature);
  }
};

exports = Feature;
