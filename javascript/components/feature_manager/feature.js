// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Feature class must be the base class of all features.
class Feature {
    constructor() {}

    // Defines a dependency on |featureName|. An exception will be thrown if the dependency could
    // not be declared, or when a circular dependency would be created. This method is safe to be
    // called any number of times.
    defineDependency(featureName) {
        return server.featureManager.defineDependency(this, featureName);
    }

    // To be called when the feature shuts down. All known resources associated with the feature
    // will be disposed and removed from the gamemode as well.
    dispose() {
        // TODO(Russell): Make sure that the dependencies are disposed of first.
    }
}

exports = Feature;
