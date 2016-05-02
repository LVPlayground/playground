// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let DependencyGraph = require('components/feature_manager/dependency_graph.js'),
    Feature = require('components/feature_manager/feature.js');

// The feature manager owns all the features available in the JavaScript implementation of the
// server, provides cross-feature interfaces and access to many of the shared objects.
class FeatureManager {
  constructor() {
    this.dependencyGraph_ = new DependencyGraph();
    this.registeredFeatures_ = {};
    this.features_ = {};
  }

  // Loads all the |features|. The |features| will first be registered, then loaded in random order
  // (per JavaScript map semantics). When a feature defines a dependency on another feature that has
  // not been loaded yet, it will be loaded automatically.
  load(features) {
    this.registeredFeatures_ = features;

    Object.keys(features).forEach(feature => this.ensureLoadFeature(feature));
  }

  // Returns whether |feature| is a registered feature in this manager.
  hasFeature(feature) {
    return this.registeredFeatures_.hasOwnProperty(feature);
  }

  // Lazily loads the |feature| - returns the existing instance if it already had been initialized
  // in the past, or will create and initialize a new instance otherwise.
  ensureLoadFeature(feature) {
    if (this.features_.hasOwnProperty(feature))
      return this.features_[feature];

    if (!this.hasFeature(feature))
      throw new Error('No feature named "' + feature + '" is known. Did you define it in playground.js?');

    let instance = new this.registeredFeatures_[feature](server);
    if (!(instance instanceof Feature))
      throw new Error('All features must extend the Feature class (failed for "' + feature + '").');

    this.features_[feature] = instance;
    return instance;
  }

  // Defines a dependency from |feature| (instance) to |dependencyName|. Throws an exception when
  // the dependency does not exist, or a circular dependency is being created.
  defineDependency(feature, dependencyName) {
    if (!this.hasFeature(dependencyName))
      throw new Error('Unable to declare a dependency on "' + dependencyName + '": feature does not exist.');

    let dependency = this.ensureLoadFeature(dependencyName);
    if (this.dependencyGraph_.isCircularDependency(feature, dependency))
      throw new Error('Unable to declare a dependency on "' + dependencyName + '": this would create a circular dependency.');

    this.dependencyGraph_.createDependencyEdge(feature, dependency);
    return dependency;
  }

  // Disposes the feature manager and all features owned by it.
  dispose() {
    Object.values(this.features_).forEach(feature => feature.dispose());
  }
};

exports = FeatureManager;
