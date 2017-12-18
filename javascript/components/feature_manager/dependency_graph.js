// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The dependency graph maintains a list of the dependencies between features, and provides the
// necessary functionality to determine whether a circular dependency may be created.
class DependencyGraph {
    constructor() {
        this.features_ = new Map();
    }

    // Creates a node in the dependency graph for the |feature|.
    createNode(feature) {
        this.features_.set(feature, { dependencies: new Set(), dependents: new Set() });
    }

    // Creates a new dependency edge from |feature| to |dependency|. Dependencies may be declared
    // multiple times, since the edges are stored in a set.
    createDependencyEdge(feature, dependency) {
        const { dependencies: featureDependencies } = this.features_.get(feature);
        const { dependents: dependencyDependents } = this.features_.get(dependency);

        featureDependencies.add(dependency);
        dependencyDependents.add(feature);
    }

    // Deletes the dependencies that have been defined by the |feature|.
    deleteDependencies(feature) {
        const { dependencies } = this.features_.get(feature);

        for (const dependencyName of dependencies)
            this.features_.get(dependencyName).dependents.delete(feature);

        dependencies.clear();
    }

    // Determines whether defining a dependency from |feature| to |dependency| would create a
    // circular dependency using a depth first search, returning a boolean.
    isCircularDependency(feature, dependency, skipFastPathForTests = false) {
        const { dependencies: featureDependencies } = this.features_.get(feature);
        if (featureDependencies.has(dependency) && !skipFastPathForTests)
            return false;  // the dependency has already been declared

        const visited = new Set();
        const queue = [];

        queue.push(dependency);

        while (queue.length > 0) {
            const { dependencies: nodeDependencies } = this.features_.get(queue.shift());
            if (visited.has(nodeDependencies))
                continue;

            visited.add(nodeDependencies);

            if (nodeDependencies.has(feature))
                return true;

            for (const childDependency of nodeDependencies)
                queue.push(childDependency);
        }

        return false;
    }

    // Determines the order in which the declared features can safely be disposed of. This considers
    // the graph of dependencies the features have declared among each other, and makes sure that
    // features don't get disposed before their dependencies do. The time complexity of this method
    // is O(n^2) in the worst case on the number of loaded features.
    determineDisposalOrder() {
        const graph = new Map(this.features_);
        const disposalList = [];

        while (graph.size) {
            for (const [feature, { dependencies, dependents }] of graph) {
                if (dependents.size)
                    continue;

                for (const dependencyName of dependencies)
                    graph.get(dependencyName).dependents.delete(feature);

                disposalList.push(feature);
                graph.delete(feature);
            }
        }

        return disposalList;
    }
}

export default DependencyGraph;
