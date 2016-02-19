// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PriorityQueue = require('base/priority_queue.js');

describe('PriorityQueue', it => {
  it('should behave like a regular queue with a void comparator', assert => {
    const queue = new PriorityQueue((lhs, rhs) => 1),
          values = [5, 10, 2, 1];

    values.forEach(value => queue.push(value));
    values.forEach(value => assert.equal(queue.pop(), value));
  });

  it('should prioritize the items with a ascending comparator', assert => {
    const queue = new PriorityQueue((lhs, rhs) => lhs > rhs);

    [5, 10, 2, 1].forEach(value => queue.push(value));
    [1, 2, 5, 10].forEach(expected => {
      assert.equal(queue.peek(), expected);
      assert.equal(queue.pop(), expected);
    });
  });

  it('should prioritize the items with a descending comparator', assert => {
    const queue = new PriorityQueue((lhs, rhs) => lhs < rhs);

    [5, 10, 2, 1].forEach(value => queue.push(value));
    [10, 5, 2, 1].forEach(expected => {
      assert.equal(queue.peek(), expected);
      assert.equal(queue.pop(), expected);
    });
  });

  it('should prioritize items when inserted simultaneously', assert => {
    const queue = new PriorityQueue((lhs, rhs) => lhs > rhs);
    queue.push(5, 10, 2, 1);

    [1, 2, 5, 10].forEach(expected => assert.equal(queue.pop(), expected));
  });

  it('should be able to count the size of its queue', assert => {
    const queue = new PriorityQueue((lhs, rhs) => 1);

    for (let i = 0; i < 100; ++i)
      queue.push(i);

    assert.equal(queue.size(), 100);
  });
});
