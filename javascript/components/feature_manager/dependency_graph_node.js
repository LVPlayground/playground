// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A node in the dependency graph contains all information about the immediate dependencies and
// immediate dependents of a certain feature.
class DependencyGraphNode {
    constructor() {
        this.functionalDependencies_ = new Set();
        this.functionalDependents_ = new Set();

        this.referenceDependencies_ = new Set();
        this.referenceDependents_ = new Set();
    }

    get functionalDependencies() { return this.functionalDependencies_; }
    get functionalDependents() { return this.functionalDependents_; }

    get referenceDependencies() { return this.referenceDependencies_; }
    get referenceDependents() { return this.referenceDependents_; }

    // Adds a direct dependency from this node on to |dependency|.
    addDependency(dependency, isFunctional) {
        if (isFunctional)
            this.functionalDependencies_.add(dependency);
        else
            this.referenceDependencies_.add(dependency);
    }

    // Returns whether this node depends on the |dependency|.
    hasDependency(dependency) {
        return this.functionalDependencies_.has(dependency) ||
               this.referenceDependencies_.has(dependency);
    }

    // Gets a 
    *getDependencies() {
        yield* this.functionalDependencies_;
        yield* this.referenceDependencies_;
    }

    // Adds |dependent| as a feature that depends on this node.
    addDependent(dependent, isFunctional) {
        if (isFunctional)
            this.functionalDependents_.add(dependent);
        else
            this.referenceDependents_.add(dependent);
    }

}

exports = DependencyGraphNode;
