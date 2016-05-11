// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implementation of a simple yet fast priority queue. A |comparator| must be given when
// constructing the priority queue that will be used for ordering items.
class PriorityQueue {
    constructor(comparator) {
        if (typeof comparator !== 'function')
            throw new Error('The comparator passed to a PriorityQueue must be a function.');

        this.comparator_ = comparator;
        this.values_ = [];
    }

    // Returns whether the priority queue is empty.
    isEmpty() { return !this.values_.length; }

    // Gets the number of values stored in this priority queue.
    get sizeNew() { return this.values_.length; }

    // Pushes |values| in the priority queue. A binary search will be used to identify the location
    // in the queue to insert the value.
    push(...values) {
        values.forEach(value => {
            let insertionIndex = 0;
            let boundary = this.values_.length;

            while (insertionIndex < boundary) {
                const candidateIndex = (insertionIndex + boundary) >>> 1;
                if (this.comparator_(value, this.values_[candidateIndex]) < 0)
                    insertionIndex = candidateIndex + 1;
                else
                    boundary = candidateIndex;
            }

            this.values_.splice(insertionIndex, 0, value);
        });
    }

    // Returns the top-most value from the priority queue, or NULL if the queue is empty.
    peek() {
        const length = this.values_.length;
        if (!length)
            throw new Error('You cannot peek from an empty priority queue.');

        return this.values_[length - 1];
    }

    // Removes the top-most value from the priority queue. Returns the previously top-most value
    // from the queue, or NULL in case the queue is empty.
    pop() {
        if (!this.values_.length)
            throw new Error('You cannot pop from an empty priority queue.');

        return this.values_.pop();
    }

    // Returns the number of values that have been added to this queue.
    size() {
        return this.values_.length;
    }

    // Deletes the |value| from the list of values. Has a complexity of O(n). Returns whether the
    // value(s) have been removed from the priority queue.
    delete(value) {
        for (let index = 0; index < this.values_.length; ++index) {
            if (this.values_[index] !== value)
                continue;

            let count = 1;
            for (; index + count < this.values_.length; ++count) {
                if (this.values_[index + count] !== value)
                    break;
            }

            this.values_.splice(index, count);
            return true;
        }

        return false;
    }
}

exports = PriorityQueue;
