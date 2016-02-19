// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implementation of a simple yet fast priority queue. A |comparator| must be given in the class'
// constructor that will be used for ordering on insertion. 
class PriorityQueue {
  constructor(comparator) {
    this.comparator_ = comparator;
    this.items_ = [];
  }

  // Pushes |items| in the priority queue.
  push(...items) {
    items.forEach(item => {
      this.items_.push(item);
      this.prioritize();
    });
  }

  // Returns the top-most item from the priority queue, or NULL if the queue is empty.
  peek() {
    return this.items_[0];
  }

  // Removes the top-most item from the priority queue. Returns the previously top-most item from
  // the queue, or NULL in case the queue is empty.
  pop() {
    return this.items_.shift();
  }

  // Returns the number of items that have been added to this queue.
  size() {
    return this.items_.length;
  }

  // Prioritizes the newly added element appropriately per the comparator that applies to this
  // priority queue. This uses an algorithm of logarithmic complexity.
  prioritize() {
    let index = this.items_.length - 1;
    while (index >= 1) {
      const candidateIndex = Math.floor((index - 1) / 2);
      if (this.comparator_(this.items_[index], this.items_[candidateIndex]) > 0)
        break;

      const temp = this.items_[index];
      this.items_[index] = this.items_[candidateIndex];
      this.items_[candidateIndex] = temp;

      index = candidateIndex;
    }
  }
};

exports = PriorityQueue;
