// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let PriorityQueue = require('base/priority_queue.js');

describe('PriorityQueue', it => {
  it('should use the comperator', assert => {
    let queue = new PriorityQueue((lhs, rhs) => lhs > rhs ? 1 : -1);
    queue.enqueue(15, 10, 20);

    assert.equal(queue.peek(), 10);
    queue.dequeue();

    assert.equal(queue.peek(), 15);
    queue.dequeue();

    assert.equal(queue.peek(), 20);

    let reverseQueue = new PriorityQueue((lhs, rhs) => lhs > rhs ? -1 : 1);
    reverseQueue.enqueue(15, 10, 20);

    assert.equal(reverseQueue.peek(), 20);
    reverseQueue.dequeue();

    assert.equal(reverseQueue.peek(), 15);
    reverseQueue.dequeue();

    assert.equal(reverseQueue.peek(), 10);
  });

  it('should be able to filter', assert => {
    let queue = new PriorityQueue((lhs, rhs) => lhs > rhs ? 1 : -1);
    queue.enqueue(1, 2, 3, 4, 5, 6, 7);

    assert.equal(queue.size(), 7);

    // Remove all the odd numbers from the |queue| using a filter predicate.
    queue.filter(entry => entry % 2 == 0);
    assert.equal(queue.size(), 3);

    for (let expected of [2, 4, 6]) {
      assert.equal(queue.peek(), expected);
      queue.dequeue();
    }
  });

  it('should have the expected size', assert => {
    let queue = new PriorityQueue((lhs, rhs) => 0);
    assert.equal(queue.size(), 0);

    queue.enqueue(15);
    queue.enqueue(10);
    queue.enqueue(5);

    assert.equal(queue.size(), 3);

    queue.dequeue();
    queue.dequeue();

    assert.equal(queue.size(), 1);

    queue.dequeue();

    assert.equal(queue.size(), 0);
    assert.throws(() => queue.dequeue());
  });

  it('should be able to peek', assert => {
    let queue = new PriorityQueue((lhs, rhs) => 0);
    assert.throws(() => queue.peek());

    queue.enqueue(20);

    queue.enqueue(15);
    assert.equal(queue.peek(), 15);
    assert.equal(queue.size(), 2);

    queue.dequeue();
    assert.equal(queue.peek(), 20);
  });
});
