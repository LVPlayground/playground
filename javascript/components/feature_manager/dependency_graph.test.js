// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import DependencyGraph from 'components/feature_manager/dependency_graph.js';

describe('DependencyGraph', (it, beforeEach) => {
    let graph = null;

    beforeEach(() => graph = new DependencyGraph());

    it('detects immediate circular dependencies', assert => {
        graph.createNode('lhs');
        graph.createNode('rhs');

        assert.isFalse(graph.isCircularDependency('lhs', 'rhs'));
        assert.isFalse(graph.isCircularDependency('rhs', 'lhs'));

        graph.createDependencyEdge('lhs', 'rhs');

        assert.isFalse(graph.isCircularDependency('lhs', 'rhs'));
        assert.isTrue(graph.isCircularDependency('rhs', 'lhs'));

        graph.createDependencyEdge('rhs', 'lhs');

        assert.isTrue(graph.isCircularDependency('lhs', 'rhs', true /* skipFastPathForTests */));
        assert.isTrue(graph.isCircularDependency('rhs', 'lhs', true /* skipFastPathForTests */));
    });

    it('detects recursive circular dependencies', assert => {
        graph.createNode('lhs');
        graph.createNode('rhs');
        graph.createNode('bar');

        graph.createDependencyEdge('lhs', 'rhs');
        graph.createDependencyEdge('rhs', 'bar');

        assert.isFalse(graph.isCircularDependency('lhs', 'rhs'));
        assert.isFalse(graph.isCircularDependency('lhs', 'bar'));
        assert.isTrue(graph.isCircularDependency('rhs', 'lhs'));
        assert.isFalse(graph.isCircularDependency('rhs', 'bar'));
        assert.isTrue(graph.isCircularDependency('bar', 'lhs'));
        assert.isTrue(graph.isCircularDependency('bar', 'rhs'));
    });
});
