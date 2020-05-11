// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Feature class must be the base class of all features.
class Feature {
    constructor() {
        this.foundationalFeature_ = false;
        this.liveReloadEnabled_ = true;
    }

    // Returns whether this is a foundational feature.
    isFoundational() { return this.foundationalFeature_; }

    // Returns whether live reload has been enabled for this feature.
    isLiveReloadEnabled() { return this.liveReloadEnabled_; }

    // Defines a dependency on |featureName|. An exception will be thrown if the dependency could
    // not be declared, or when a circular dependency would be created. This method is safe to be
    // called any number of times.
    defineDependency(featureName) {
        return server.featureManager.defineDependency(this, featureName, this.foundationalFeature_);
    }

    // Defines that the feature is not eligible for live reload.
    disableLiveReload() {
        this.liveReloadEnabled_ = false;
    }

    // Marks this feature as a foundational feature. That means that it's not allowed to define any
    // dependencies, as that goes against the rules of a foundational feature.
    markFoundational() {
        this.foundationalFeature_ = true;
    }

    // To be called when the feature shuts down. All known resources associated with the feature
    // will be disposed and removed from the gamemode as well.
    dispose() {}
}

export default Feature;
