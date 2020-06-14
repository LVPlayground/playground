// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a range of Virtual Worlds. Ids can be acquired and released through its interface,
// although the block can be released in its entirety as well by disposing it.
export class VirtualWorldBlock {
    constructor(manager, begin, end) {
        this.manager_ = manager;

        this.begin_ = begin;
        this.end_ = end;

        this.released_ = [];
        this.next_ = begin;
    }

    // Gets the first Virtual World that's part of this block.
    get begin() { return this.begin_; }

    // Gets the final Virtual World that's part of this block.
    get end() { return this.end_ - 1; }

    // Gets the size of this block in total number of virtual worlds.
    get size() { return this.end_ - this.begin_; }

    // Returns whether the |virtualWorld| is part of this range.
    isValid(virtualWorld) {
        return virtualWorld >= this.begin_ && virtualWorld < this.end_;
    }

    // Acquires a unique Virtual World. It will not be handed out again until the world either gets
    // released, or the entire block gets disposed of.
    allocate() {
        if (this.released_.length)
            return this.released_.shift();

        if (this.next_ === this.end_)
            throw new Error('The block of virtual worlds has been entirely consumed.');

        return this.next_++;
    }

    // Releases the |virtualWorld| for future usage. Will throw an exception if the |virtualWorld|
    // is not valid for the range owned by this block.
    release(virtualWorld) {
        if (virtualWorld < this.begin_ || virtualWorld >= this.end_)
            throw new Error('The virtual world #' + virtualWorld + ' is out of bounds.');

        this.released_.push(virtualWorld);
    }

    // Disposes the entire block of virtual worlds.
    dispose() {
        this.manager_.didDisposeBlock();
        this.manager_ = null;
    }
}
