// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Circular read-only buffer, where all the values are set at time of construction, and will be
// returned in repeating order upon calls to `next()`. Useful where deterministic values have to be
// vended in a known sequence.
export class CircularReadOnlyBuffer {
    values_ = null;
    index_ = null;

    constructor(...values) {
        if (!values.length)
            throw new Error(`A circular buffer needs to have at least one entry.`);

        this.values_ = values;
        this.index_ = 0;
    }

    next() {
        if (this.index_ === this.values_.length)
            this.index_ = 0;
        
        return this.values_[this.index_++];
    }
}
