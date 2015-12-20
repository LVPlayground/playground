// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The dependency graph maintains a list of the dependencies between features, and provides the
// necessary functionality to determine whether a circular dependency may be created.
class DependencyGraph {
  constructor() {
    this.features_ = new Map();
  }

  // Creates a new dependency edge from |feature| to |dependency|. It's safe to declare dependencies
  // multiple times, as they're stored in a set based on the instance.
  createDependencyEdge(feature, dependency) {
    if (!this.features_.has(feature))
      this.features_.set(feature, new Set());

    this.features_.get(feature).add(dependency);
  }

  // Determines whether defining a dependency from |feature| to |dependency| would create a circular
  // dependency using a depth first search, returning a boolean.
  isCircularDependency(feature, dependency) {
    let visited = new Set(),
        queue = [];

    queue.push(dependency);
    while (queue.length > 0) {
      let dependencyInstance = queue.shift();
      if (dependencyInstance === feature)
        return true;

      if (visited.has(dependencyInstance))
        continue;

      visited.add(dependencyInstance);

      if (this.features_.has(dependencyInstance)) {
        for (let childDependency of this.features_.get(dependencyInstance))
          queue.push(childDependency);
      }
    }

    return false;
  }
};

exports = DependencyGraph;
