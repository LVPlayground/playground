// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DependencyGraphNode = require('components/feature_manager/dependency_graph_node.js');

// The dependency graph maintains a list of the dependencies between features, and provides the
// necessary functionality to determine whether a circular dependency may be created.
class DependencyGraph {
    constructor() {
        this.features_ = new Map();
    }

    // Creates a node in the dependency graph for the |feature|.
    createNode(feature) {
        this.features_.set(feature, new DependencyGraphNode());
    }

    // Creates a new dependency edge from |feature| to |dependency|. Dependencies may be declared
    // multiple times. The |isFunctional| argument indicates whether it's a functional dependency.
    createDependencyEdge(feature, dependency, isFunctional) {
        const featureNode = this.features_.get(feature);
        const dependencyNode = this.features_.get(dependency);

        featureNode.addDependency(dependency, isFunctional);
        dependencyNode.addDependent(feature, isFunctional);
    }

    // Returns whether the |feature| has dependencies or dependents that declared a reference
    // relationship, and therefore are in posession of this instance as opposed to a getter.
    hasReferenceDependenciesOrDependents(feature) {
        const featureNode = this.features_.get(feature);
        return featureNode.referenceDependencies.size ||
               featureNode.referenceDependents.size;
    }

    // Deletes the dependencies that have been defined by the |feature|.
    deleteDependencies(feature) {
        const featureNode = this.features_.get(feature);

        featureNode.functionalDependencies_.clear();
        featureNode.referenceDependencies_.clear();
    }

    // Determines whether defining a dependency from |feature| to |dependency| would create a
    // circular dependency using a depth first search, returning a boolean.
    isCircularDependency(feature, dependency, skipFastPathForTests = false) {
        const featureNode = this.features_.get(feature);
        if (featureNode.hasDependency(dependency) && !skipFastPathForTests)
            return false;  // the dependency has already been declared

        const visited = new Set();
        const queue = [];

        queue.push(dependency);

        while (queue.length > 0) {
            const node = this.features_.get(queue.shift());
            if (visited.has(node))
                continue;

            visited.add(node);

            if (node.hasDependency(feature))
                return true;

            for (const childDependency of node.getDependencies())
                queue.push(childDependency);
        }

        return false;
    }
}

exports = DependencyGraph;
