// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FastPriorityQueue = require('features/streamer/fast_priority_queue.js');

describe('FastPriorityQueue', it => {
    // Comparator that can be used to sort values in the priority queue in descending order.
    const descendingComparator = (lhs, rhs) => {
        if (lhs === rhs)
            return 0;

        return lhs > rhs ? -1 : 1;
    };

    it('should adhere to its comparator', assert => {
        const queue = new FastPriorityQueue(descendingComparator);
        queue.push(5, 3, 1, 9, 6, 4);

        assert.equal(queue.pop(), 9);
        assert.equal(queue.pop(), 6);
        assert.equal(queue.pop(), 5);
        assert.equal(queue.pop(), 4);
        assert.equal(queue.pop(), 3);
        assert.equal(queue.pop(), 1);
    });

    it('should be able to tell the size of the queue', assert => {
        const queue = new FastPriorityQueue(descendingComparator);
        queue.push(5, 3, 1, 9, 6, 4);

        assert.equal(queue.size, 6);
    });

    it('should be able to tell whether entries exist in the queue', assert => {
        const queue = new FastPriorityQueue(descendingComparator);
        queue.push(5, 3, 1, 9, 6, 4);

        assert.isTrue(queue.has(9));
        assert.isTrue(queue.has(6));

        queue.delete(9);

        assert.isFalse(queue.has(9));
        assert.isTrue(queue.has(6));

        queue.clear();

        assert.isFalse(queue.has(9));
        assert.isFalse(queue.has(6));
    });
});
