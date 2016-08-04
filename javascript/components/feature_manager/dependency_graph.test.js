// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DependencyGraph = require('components/feature_manager/dependency_graph.js');

describe('DependencyGraph', (it, beforeEach) => {
    let graph = null;

    beforeEach(() => graph = new DependencyGraph());

    function Vertex() {}

    it('detects immediate circular dependencies', assert => {
        const lhs = new Vertex();
        const rhs = new Vertex();

        assert.isFalse(graph.isCircularDependency(lhs, rhs));
        assert.isFalse(graph.isCircularDependency(rhs, lhs));

        graph.createDependencyEdge(lhs, rhs);

        assert.isFalse(graph.isCircularDependency(lhs, rhs));
        assert.isTrue(graph.isCircularDependency(rhs, lhs));

        graph.createDependencyEdge(rhs, lhs);

        assert.isTrue(graph.isCircularDependency(lhs, rhs));
        assert.isTrue(graph.isCircularDependency(rhs, lhs));
    });

    it('detects recursive circular dependencies', assert => {
        const lhs = new Vertex();
        const rhs = new Vertex();
        const bar = new Vertex();

        graph.createDependencyEdge(lhs, rhs);
        graph.createDependencyEdge(rhs, bar);

        assert.isFalse(graph.isCircularDependency(lhs, rhs));
        assert.isFalse(graph.isCircularDependency(lhs, bar));
        assert.isTrue(graph.isCircularDependency(rhs, lhs));
        assert.isFalse(graph.isCircularDependency(rhs, bar));
        assert.isTrue(graph.isCircularDependency(bar, lhs));
        assert.isTrue(graph.isCircularDependency(bar, rhs));
        });
});
