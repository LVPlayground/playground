// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { shuffle } from 'base/shuffle.js';

describe('shuffle', it => {
    it('should be able to shuffle iterables', assert => {
        assert.throws(() => shuffle());
        assert.throws(() => shuffle(3.14));
        assert.throws(() => shuffle({ yo: 1 }));
        assert.throws(() => shuffle(null));

        // Arrays
        const array = shuffle([ 1, 2, 3, 4, 5 ]);

        assert.isTrue(Array.isArray(array));
        assert.equal(array.length, 5);
        assert.deepEqual(array.sort(), [ 1, 2, 3, 4, 5 ]);

        // Maps
        const map = shuffle(new Map([ [ 'a', 1 ], [ 'c', 3 ], [ 'b', 2 ] ]));
        const sortedMap = [ ...map ].sort((lhs, rhs) => lhs[1] > rhs[1] ? 1 : -1);

        assert.instanceOf(map, Map);
        assert.equal(map.size, 3);

        assert.deepEqual(sortedMap, [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]);

        // Sets
        const set = shuffle(new Set([ 'aap', 'noot', 'mies' ]));

        assert.instanceOf(set, Set);
        assert.equal(set.size, 3);
        assert.deepEqual([ ...set ].sort(), [ 'aap', 'mies', 'noot' ]);

        // Strings
        const string = shuffle('banana');

        assert.typeOf(string, 'string');
        assert.equal(string.length, 6);
        assert.deepEqual([ ...'banana' ].sort(), [ ...string ].sort());

        // Distribution
        //
        // The letters in the string 'banana' can be arranged in 60 different ways, because both the
        // 'A' and 'B' occur multiple times. Given 1000 attempts, we should see at least 50 of those
        // ways, or there's something seriously wrong with the PRNG.
        const distribution = new Set();

        for (let iteration = 0; iteration < 1000; ++iteration)
            distribution.add(shuffle('banana'));

        assert.isAboveOrEqual(distribution.size, 50);
    });
});
