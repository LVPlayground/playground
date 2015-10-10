// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A priority queue is a container type that keeps its entries sorted in order of relative priority.
// This implementation takes an external comperator and offers the ability to enqueue, peek and
// dequeue entries. Additionally, existing entries can be filtered using a predicate.
class PriorityQueue {
  constructor(comperator) {
    this.comperator = comperator;
    this.entries = [];
  }

  // Enqueues |entry| in the priority queue.
  enqueue(entry) {
    this.entries.push(entry);
    this.bubble(this.entries.length - 1);
  }

  // Removes the element with the highest priority. Throws if the priority queue is empty.
  dequeue() {
    if (!this.entries.length)
      throw new Error('Cannot dequeue from an empty PriorityQueue.')

    this.entries.shift();
  }

  // Returns the entry with the highest priority. Throws if the priority queue is empty.
  peek() {
    if (!this.entries.length)
      throw new Error('Cannot peek in an empty PriorityQueue.');

    return this.entries[0];
  }

  // Filters items in m the priority queue for which |predicate| returns false. This method will
  // iterate over all entries in the queue, and therefore has O(n) performance.
  filter(predicate) {
    this.entries = this.entries.filter(predicate);
  }

  // Returns the number of entries currently in this priority queue.
  size() {
    return this.entries.length;
  }

  // Logarithmically bubbles the element at |index| up to the position where it should be. Used
  // to find the position within the queue for newly added elements.
  bubble(index) {
    while (index >= 1) {
      let candidateIndex = index >> 1;
      if (this.compare(index, candidateIndex) > 0)
        break;

      this.swap(index, candidateIndex);
      index = candidateIndex;
    }
  }

  // Compares the entries at indices |lhs| and |rhs| with each other.
  compare(lhs, rhs) {
    return this.comperator(this.entries[lhs], this.entries[rhs]);
  }

  // Swaps the entries at indices |lhs| and |rhs| with each other.
  swap(lhs, rhs) {
    let temp = this.entries[lhs];
    this.entries[lhs] = this.entries[rhs];
    this.entries[rhs] = temp;
  }

};

exports = PriorityQueue;
