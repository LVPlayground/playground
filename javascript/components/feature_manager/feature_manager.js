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

    // Returns whether the |feature| has been registered with the feature manager.
    hasFeature(feature) {
        return this.loadedFeatures_.has(feature);
    }

    // ---------------------------------------------------------------------------------------------

    // Loads all the |features|. This should be an array of feature names, each of which is presumed
    // to have their Feature instance defined as //features/{name}/{name}.js.
    loadFeatures(features) {
        if (this.registeredFeatures_.size != 0 && !server.isTest())
            throw new Error('The feature manager may only be initialized once.');

        // Load all the feature constructors in the map of registered features.
        features.forEach(feature => {
            if (this.registeredFeatures_.has(feature) && server.isTest())
                return;

            const featureFilename = 'features/' + feature + '/' + feature + '.js';
            const featureConstructor = require(featureFilename);

            this.registeredFeatures_.set(feature, featureConstructor);
        });

        // Load all the features into the system by instantiating them.
        for (const feature of this.registeredFeatures_.keys())
            this.loadFeature(feature);
    }

    // Loads the |feature|. If the feature has already been laoded, a cached version will be
    // returned instead. A number of basic validations will be exercised on the constructor.
    loadFeature(feature) {
        const existingInstance = this.loadedFeatures_.get(feature);
        if (existingInstance)
            return existingInstance;

        if (!this.registeredFeatures_.has(feature))
            throw new Error('The feature "' + feature + '" is not known to the server.');

        const featureConstructor = this.registeredFeatures_.get(feature);
        const instance = new featureConstructor();

        if (!(instance instanceof Feature))
            throw new Error('The feature "' + feature + '" does not extend the `Feature` class.');

        this.loadedFeatures_.set(feature, instance);
        return instance;
    }

    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------

    // Defines a dependency from |feature| (instance) to |dependencyName|. Throws an exception when
    // the dependency does not exist, or a circular dependency is being created.
    defineDependency(feature, dependencyName) {
        if (!this.registeredFeatures_.has(dependencyName)) {
            throw new Error('Cannot declare a dependency on "' + dependencyName + '": ' +
                            'invalid dependency name.');
        }

        const dependency = this.loadFeature(dependencyName);
        if (this.dependencyGraph_.isCircularDependency(feature, dependency)) {
            throw new Error('Cannot declare a dependency on "' + dependencyName + '": ' +
                            'circular dependencies are forbidden.');
        }

        this.dependencyGraph_.createDependencyEdge(feature, dependency);
        return dependency;
    }

    // ---------------------------------------------------------------------------------------------

    // Imports the |features| object as key-value pairs into the registered feature table.
    registerFeaturesForTests(features) {
        for (const [featureName, featureConstructor] of Object.entries(features)) {
            if (this.loadedFeatures_.has(featureName))
                throw new Error('Cannot register "' + featureName + '": already loaded.');

            this.registeredFeatures_.set(featureName, featureConstructor);
        }
    }

    // ---------------------------------------------------------------------------------------------

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
