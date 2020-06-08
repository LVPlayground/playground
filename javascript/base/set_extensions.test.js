// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { difference, intersect, symmetricDifference, union } from 'base/set_extensions.js';

describe('SetExtensions', it => {
    it('is able to determine the difference between two sets', assert => {
        const left = new Set([ 1, 2, 3, 4, 5 ]);
        const right = new Set([ 4, 5, 6, 7, 8 ]);

        assert.deepEqual([ ...difference(left, right) ], [ 1, 2, 3 ]);
        assert.deepEqual([ ...difference(right, left) ], [ 6, 7, 8 ]);
    });

    it('is able to determine the intersection between two sets', assert => {
        const left = new Set([ 1, 2, 3, 4, 5 ]);
        const right = new Set([ 4, 5, 6, 7, 8 ]);

        assert.deepEqual([ ...intersect(left, right) ], [ 4, 5 ]);
        assert.deepEqual([ ...intersect(right, left) ], [ 4, 5 ]);
    });

    it('is able to determine the symmetric difference between two sets', assert => {
        const left = new Set([ 1, 2, 3, 4, 5 ]);
        const right = new Set([ 4, 5, 6, 7, 8 ]);

        assert.deepEqual([ ...symmetricDifference(left, right) ], [ 1, 2, 3, 6, 7, 8 ]);
        assert.deepEqual([ ...symmetricDifference(right, left) ], [ 6, 7, 8, 1, 2, 3 ]);
    });

    it('is able to determine the union of two sets', assert => {
        const left = new Set([ 1, 2, 3, 4, 5 ]);
        const right = new Set([ 4, 5, 6, 7, 8 ]);

        assert.deepEqual([ ...union(left, right) ], [ 1, 2, 3, 4, 5, 6, 7, 8 ]);
        assert.deepEqual([ ...union(right, left) ], [ 4, 5, 6, 7, 8, 1, 2, 3 ]);
    });
});
