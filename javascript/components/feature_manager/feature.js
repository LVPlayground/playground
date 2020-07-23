// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Feature class must be the base class of all features.
export class Feature {
    // Available scopes of features that they can be defined as.
    static kScopeFoundational = 0;
    static kScopeLowLevel = 1;
    static kScopeRegular = 2;

    #liveReloadEnabled_ = true;
    #scope_ = Feature.kScopeRegular;

    constructor() {}

    // ---------------------------------------------------------------------------------------------
    // Section: mutators
    // ---------------------------------------------------------------------------------------------

    // Defines a dependency on |featureName|. Circular dependencies are not allowed, nor is it
    // possible to depend on features with a higher scope than your own.
    defineDependency(featureName) {
        return server.featureManager.defineDependency(this, featureName, this.#scope_);
    }

    // Marks this feature as living at the Foundational scope.
    markFoundational() { this.#scope_ = Feature.kScopeFoundational; }

    // Marks this feature as living at the Low-level scope.
    markLowLevel() { this.#scope_ = Feature.kScopeLowLevel; }

    // Marks this feature as not being eligible for live reload.
    disableLiveReload() { this.#liveReloadEnabled_ = false; }

    // ---------------------------------------------------------------------------------------------
    // Section: meta information
    // ---------------------------------------------------------------------------------------------

    // Returns the scope of this feature, which defines its allowed dependencies.
    getFeatureScope() { return this.#scope_; }

    // Returns whether this feature supports live reload, which should only rarely be disabled.
    supportsLiveReload() { return this.#liveReloadEnabled_; }

    // ---------------------------------------------------------------------------------------------

    // To be called when the feature shuts down. All known resources associated with the feature
    // will be disposed and removed from the gamemode as well.
    dispose() {}
}
