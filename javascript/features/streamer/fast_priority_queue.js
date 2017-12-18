// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PriorityQueue from 'base/priority_queue.js';

// Implementation of a priority queue that can tell whether a certain entity exists in the priority
// queue in O(1) time, at the cost of O(2n) storage. Entries may only be added once.
class FastPriorityQueue {
    constructor(comparator) {
        if (typeof comparator !== 'function')
            throw new Error('The comparator passed to a FastPriorityQueue must be a function.');

        this.comparator_ = comparator;

        this.values_ = new Set();
        this.sortedValues_ = [];
    }

    // Gets the number of values stored in this priority queue.
    get size() { return this.sortedValues_.length; }

    // Pushes |values| in the priority queue. A binary search will be used to identify the location
    // in the queue to insert the value.
    push(...values) {
        values.forEach(value => {
            let insertionIndex = 0;
            let boundary = this.sortedValues_.length;

            while (insertionIndex < boundary) {
                const candidateIndex = (insertionIndex + boundary) >>> 1;
                if (this.comparator_(value, this.sortedValues_[candidateIndex]) < 0)
                    insertionIndex = candidateIndex + 1;
                else
                    boundary = candidateIndex;
            }

            this.sortedValues_.splice(insertionIndex, 0, value);
            this.values_.add(value);
        });
    }

    // Returns whether the |value| is included in this priority queue.
    has(value) { return this.values_.has(value); }

    // Removes the top-most value from the priority queue. Returns the previously top-most value
    // from the queue, or NULL in case the queue is empty.
    pop() {
        if (!this.sortedValues_.length)
            throw new Error('You cannot pop from an empty priority queue.');

        return this.sortedValues_.pop();
    }

    // Deletes the |value| from the list of values. Has a complexity of O(n). Returns whether the
    // value(s) have been removed from the priority queue.
    delete(value) {
        if (!this.values_.has(value))
            return false;

        this.values_.delete(value);

        for (let index = 0; index < this.sortedValues_.length; ++index) {
            if (this.sortedValues_[index] !== value)
                continue;

            this.sortedValues_.splice(index, 1 /* count */);
            return true;
        }

        return false;
    }

    // Clears all values stored in the priority queue.
    clear() {
        this.values_.clear();
        this.sortedValues_ = [];
    }
}

export default FastPriorityQueue;
