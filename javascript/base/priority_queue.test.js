// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PriorityQueue = require('base/priority_queue.js');

describe('PriorityQueue', it => {
    // Comparator that can be used when the order of values does not matter.
    const staleComparator = (lhs, rhs) => 0;

    // Comparator that can be used to sort values in the priority queue in ascending order.
    const ascendingComparator = (lhs, rhs) => {
        if (lhs === rhs)
            return 0;

        return lhs > rhs ? 1 : -1;
    };

    // Comparator that can be used to sort values in the priority queue in descending order.
    const descendingComparator = (lhs, rhs) => {
        if (lhs === rhs)
            return 0;

        return lhs > rhs ? -1 : 1;
    };

    it('should only accept functions as comparators', assert => {
        assert.throws(() => new PriorityQueue());
        assert.throws(() => new PriorityQueue(null));
        assert.throws(() => new PriorityQueue(42));
    });

    it('should not allow peeking and popping from an empty priority queue', assert => {
        const queue = new PriorityQueue(staleComparator);

        assert.equal(queue.size(), 0);
        assert.throws(() => queue.peek());
        assert.throws(() => queue.pop());
    });

    it('should behave like a regular fifo queue with a void comparator', assert => {
        const queue = new PriorityQueue(staleComparator);
        const values = [5, 10, 2, 8, 1];

        values.forEach(value => queue.push(value));
        values.forEach(value => assert.equal(queue.pop(), value));

        assert.equal(queue.size(), 0);
    });

    it('should prioritize the items with a ascending comparator', assert => {
        const queue = new PriorityQueue(ascendingComparator);

        [5, 10, 8, 2, 1].forEach(value => queue.push(value));
        [1, 2, 5, 8, 10].forEach(expected => {
            assert.equal(queue.peek(), expected);
            assert.equal(queue.pop(), expected);
        });
    });

    it('should prioritize the items with a descending comparator', assert => {
        const queue = new PriorityQueue(descendingComparator);

        assert.equal(queue.size(), 0);

        [5, 10, 2, 1].forEach(value => queue.push(value));
        [10, 5, 2, 1].forEach(expected => {
            assert.equal(queue.peek(), expected);
            assert.equal(queue.pop(), expected);
        });
    });

    it('should properly prioritize items when inserted simultaneously', assert => {
        const queue = new PriorityQueue(ascendingComparator);
        queue.push(5, 10, 2, 1);

        assert.equal(queue.size(), 4);

        [1, 2, 5, 10].forEach(expected => assert.equal(queue.pop(), expected));
    });

    it('should be able to count the size of its queue', assert => {
        const queue = new PriorityQueue(staleComparator);

        for (let i = 0; i < 100; ++i)
            queue.push(i);

        assert.equal(queue.size(), 100);
    });

    it('should be able to remove values from the priority queue', assert => {
        const queue = new PriorityQueue(ascendingComparator);
        queue.push(5, 10, 8, 2, 8, 1);

        assert.equal(queue.size(), 6);
        assert.isTrue(queue.delete(8));
        assert.equal(queue.size(), 4);

        [1, 2, 5, 10].forEach(expected => assert.equal(queue.pop(), expected));
    });

    it('should work with larger quantities of numbers', assert => {
        const queue = new PriorityQueue(ascendingComparator);
        const count = 10000;

        for (let i = 0; i < count; ++i)
            queue.push(Math.floor(Math.random() * count));

        assert.equal(queue.size(), count);

        let lastNumber = queue.pop();
        while (queue.size()) {
            const number = queue.pop();

            assert.isAboveOrEqual(number, lastNumber);
            lastNumber = number;
        }

        assert.equal(queue.size(), 0);
    });

    it('should work with objects rather than numbers as well', assert => {
        const queue = new PriorityQueue((lhs, rhs) => {
            if (lhs.value === rhs.value)
                return 0;

            return lhs.value > rhs.value ? 1 : -1;
        });

        queue.push({ value: 10000 }, { value: 100 }, { value: 1000 }, { value: 42 });

        assert.equal(queue.size(), 4);

        assert.equal(queue.pop().value, 42);
        assert.equal(queue.pop().value, 100);
        assert.equal(queue.pop().value, 1000);
        assert.equal(queue.pop().value, 10000);
    });

    it('should be able to clear all stored values in the queue', assert => {
        const queue = new PriorityQueue(ascendingComparator);
        queue.push(5, 10, 8, 2, 8, 1);

        assert.equal(queue.size(), 6);

        queue.clear();

        assert.equal(queue.size(), 0);
    });
});
