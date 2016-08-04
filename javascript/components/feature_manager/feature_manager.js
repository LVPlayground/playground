// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DependencyGraph = require('components/feature_manager/dependency_graph.js');
const Feature = require('components/feature_manager/feature.js');

// The feature manager owns all the features available in the JavaScript implementation of the
// server, provides cross-feature interfaces and access to many of the shared objects.
class FeatureManager {
    constructor() {
        this.dependencyGraph_ = new DependencyGraph();

        this.registeredFeatures_ = new Map();
        this.loadedFeatures_ = new Map();
    }

    // Gets the number of features that have been loaded on the server.
    get count() { return this.loadedFeatures_.size; }

    // Returns the feature named |feature| for testing purposes only.
    getFeatureForTests(feature) {
        return this.loadedFeatures_.get(feature);
    }

    // Loads all the |features|. The |features| will first be registered, then loaded in random order
    // (per JavaScript map semantics). When a feature defines a dependency on another feature that has
    // not been loaded yet, it will be loaded automatically.
    load(features) {
        // TODO(Russell): require() the features in this file.

        for (const [featureName, feature] of Object.entries(features))
            this.registeredFeatures_.set(featureName, feature);

        Object.keys(features).forEach(feature =>
            this.ensureLoadFeature(feature));
    }

    // Returns whether |feature| is a registered feature in this manager.
    hasFeature(feature) {
        return this.registeredFeatures_.has(feature);
    }

    // Returns whether |feature| is eligible for live reload.
    isEligibleForLiveReload(feature) {
        // TODO(Russell): Implement the heuristics for live reload.
        return false;
    }

    // Live reloads the |feature|. Throws when the |feature| is not eligible for live reload.
    liveReload(feature) {
        if (!this.isEligibleForLiveReload(feature))
            throw new Error('The feature "' + feature + '" is not eligible for live reload.');

        // TODO(Russell): Implement live reload.
    }

    // Lazily loads the |feature| - returns the existing instance if it already had been initialized
    // in the past, or will create and initialize a new instance otherwise.
    ensureLoadFeature(feature) {
        const loadedFeature = this.loadedFeatures_.get(feature);
        if (loadedFeature)
            return loadedFeature;

        if (!this.hasFeature(feature))
            throw new Error('The feature "' + feature + '" is not known to the server.');

        const featureConstructor = this.registeredFeatures_.get(feature);
        const instance = new featureConstructor();

        if (!(instance instanceof Feature))
            throw new Error('The feature "' + feature + '" does not extend the `Feature` class.');

        this.loadedFeatures_.set(feature, instance);
        return instance;
    }

    // Defines a dependency from |feature| (instance) to |dependencyName|. Throws an exception when
    // the dependency does not exist, or a circular dependency is being created.
    defineDependency(feature, dependencyName) {
        if (!this.hasFeature(dependencyName)) {
            throw new Error('Cannot declare dependency "' + feature + ':' + dependencyName + '": ' +
                            'invalid dependency name.');
        }

        let dependency = this.ensureLoadFeature(dependencyName);
        if (this.dependencyGraph_.isCircularDependency(feature, dependency)) {
            throw new Error('Cannot declare dependency "' + feature + ':' + dependencyName + '": ' +
                            'circular dependencies are forbidden.');
        }

        this.dependencyGraph_.createDependencyEdge(feature, dependency);
        return dependency;
    }

    // Disposes the feature manager and all features owned by it.
    dispose() {
        for (const instance of this.loadedFeatures_.values())
            instance.dispose();

        this.loadedFeatures_.clear();
        this.loadedFeatures_ = null;

        this.registeredFeatures_.clear();
        this.registeredFeatures_ = null;
    }
};

exports = FeatureManager;
