// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { VirtualWorldBlock } from 'entities/virtual_world_block.js';

// Id of the Virtual World that represents the main world.
const MainVirtualWorld = 0;

// The Virtual World manager is responsible for management of the virtual worlds in existence on the
// server. There is no concept of a "Virtual World" object, so they're represented by Ids, but
// assignment of such Ids needs to be coordinated.
export class VirtualWorldManager {
    constructor() {
        this.allocated_ = 1 /* the main world */;

        this.mainWorld_ = 0;
        this.playerWorlds_ = this.allocateBlock(1000 /* max players */);
    }

    // Gets the Virtual World Id used to represent the main world.
    get mainWorld() { return MainVirtualWorld; }

    // Gets the Virtual World Id that is private to the |player|.
    worldForPlayer(player) { return this.playerWorlds_.begin + player.id; }

    // Allocates a block of |size| virtual worlds, and returns the VirtualWorldBlock instance that
    // is used to represent the block.
    allocateBlock(size) {
        const begin = this.allocated_;
        const end = this.allocated_ + size;

        this.allocated_ += size;

        return new VirtualWorldBlock(this, begin, end);
    }

    // Called when the |block| has been disposed. Will free up the range of virtual worlds to new
    // block allocations that fit within the size.
    didDisposeBlock(block) {
        // TODO(Russell): While it's nice if we release blocks again, do we really need to? There
        //                are 2 billion virtual worlds, and implementing this would cause a lot of
        //                complexity to deal with defragmentation and stuff.
    }

    dispose() {}
}
