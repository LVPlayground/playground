// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DependencyGraph = require('components/feature_manager/dependency_graph.js');
const Feature = require('components/feature_manager/feature.js');

// The feature manager owns all the features available in the JavaScript implementation of the
// server, provides cross-feature interfaces and access to many of the shared objects.
//
// Features can define two sorts of dependencies on each other:
//   1) Reference-based dependencies. The feature will get hold of the instance of the feature it
//      would like to depend on.
//   2) Function-based dependencies. The feature will get a function through which it can get the
//      latest instance of the feature it would like to depend on.
//
// Features that only have functional dependencies and dependents can be live reloaded by Management
// members. Of course, in doing so, the assumption is made that no significant API changes happened.
//
// TODO(Russell): Remove support for reference-based dependencies altogether.
class FeatureManager {
    constructor() {
        this.dependencyGraph_ = new DependencyGraph();

        this.registeredFeatures_ = new Map();

        this.loadedFeatureNames_ = new WeakMap();
        this.loadedFeatures_ = new Map();

        // Stack maintaining the features which are currently being loaded.
        this.loadingStack_ = [];
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

            this.dependencyGraph_.createNode(feature);
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

        this.loadingStack_.unshift(feature);

        const featureConstructor = this.registeredFeatures_.get(feature);
        const instance = new featureConstructor();

        this.loadingStack_.shift();

        if (!(instance instanceof Feature))
            throw new Error('The feature "' + feature + '" does not extend the `Feature` class.');

        this.loadedFeatureNames_.set(instance, feature);
        this.loadedFeatures_.set(feature, instance);

        return instance;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether |feature| is eligible for live reload. We can live reload when:
    //   1) The feature has been registered, but has not been loaded yet.
    //   2) The feature has been loaded, and has no dependencies or dependents.
    //   3) The feature has been loaded, and only has functional dependencies and dependents.
    isEligibleForLiveReload(feature) {
        if (!this.registeredFeatures_.has(feature))
            return false;  // the feature does not exist

        if (!this.loadedFeatures_.has(feature))
            return true;  // the feature has not been loaded yet, this is always safe

        if (this.dependencyGraph_.hasReferenceDependenciesOrDependents(feature))
            return false;  // references to the feature make live reload impossible

        return true;
    }

    // Live reloads the |feature|. Throws when the |feature| is not eligible for live reload.
    // Returns a boolean indicating whether reloading was successful.
    //
    // Live reloading a feature involves clearing the require() caches for the given feature to make
    // sure that any changed files are reloaded from disk. Then the feature is read from disk again,
    // followed by disposing the existing feature. All dependencies declared by the feature will
    // then be cleared, finished by reloading the feature through the regular code path again.
    liveReload(feature) {
        if (!this.isEligibleForLiveReload(feature))
            throw new Error('The feature "' + feature + '" is not eligible for live reload.');

        const featureDirectory = 'features/' + feature + '/';
        const featureFilename = featureDirectory + feature + '.js';

        // Clear the require() cache to be able to load the latest code for the feature.
        require.clear(featureDirectory);

        let featureConstructor = null;
        try {
            if (server.isTest())
                featureConstructor = this.registeredFeatures_.get(feature);
            else
                featureConstructor = require(featureFilename);

        } catch (exception) {
            console.log('Unable to reload ' + feature, exception);
            return false;
        }

        // Update the registered constructor for this feature so that loading it works again.
        this.registeredFeatures_.set(feature, featureConstructor);

        // Dispose of the existing instance of this feature if it exists.
        {
            const instance = this.loadedFeatures_.get(feature);
            if (instance)
                instance.dispose();

            this.loadedFeatures_.delete(feature);
        }

        // Clear all dependencies that were defined by the old instance of |feature|.
        this.dependencyGraph_.deleteDependencies(feature);

        // Now load the new instance of the |feature| through the regular code path.
        try {
            this.loadFeature(feature);

            console.log('[FeatureManager] ' + feature + ' has been reloaded.');
            return true;

        } catch (exception) {
            console.log('Unable to reload ' + feature, exception);
            return false;
        }

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Defines a dependency from |feature| (instance) to |dependencyName|. Throws an exception when
    // the dependency does not exist, or a circular dependency is being created. If |isFunctional|
    // is set to true, a function will be returned as opposed to the instance.
    defineDependency(feature, dependencyName, isFunctional = false) {
        if (!this.registeredFeatures_.has(dependencyName)) {
            throw new Error('Cannot declare a dependency on "' + dependencyName + '": ' +
                            'invalid dependency name.');
        }

        const featureName = this.loadedFeatureNames_.get(feature) || this.loadingStack_[0];
        if (!featureName) {
            throw new Error('Cannot declare a dependency on "' + dependencyName + '": ' +
                            'unable to identify the hosting feature.');
        }

        if (this.dependencyGraph_.isCircularDependency(featureName, dependencyName)) {
            throw new Error('Cannot declare a dependency on "' + dependencyName + '": ' +
                            'circular dependencies are forbidden.');
        }

        // Actually load the feature now that we know it's not a circular dependency.
        const dependency = this.loadFeature(dependencyName);

        this.dependencyGraph_.createDependencyEdge(featureName, dependencyName, isFunctional);

        return isFunctional ? () => this.loadedFeatures_.get(dependencyName)
                            : dependency;
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the instance for |feature|. Must only be used for testing purposes.
    getFeatureForTests(feature) {
        return this.loadedFeatures_.get(feature);
    }

    // Imports the |features| object as key-value pairs into the registered feature table.
    registerFeaturesForTests(features) {
        for (const [featureName, featureConstructor] of Object.entries(features)) {
            if (this.loadedFeatures_.has(featureName))
                throw new Error('Cannot register "' + featureName + '": already loaded.');

            this.dependencyGraph_.createNode(featureName);
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
