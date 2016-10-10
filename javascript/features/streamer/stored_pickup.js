// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredEntity = require('features/streamer/stored_entity.js');

// Details about a stored pickup. This contains all the necessary information in order to create
// the pickup, on demand, within the pickup streamer.
class StoredPickup extends StoredEntity {
    constructor({ modelId, type, position, virtualWorld, respawnDelay = -1, enterFn = null,
                  leaveFn = null } = {}) {
        super({ modelId, position, interiorId: 0 /* ignored */, virtualWorld });

        this.type_ = type;
        this.respawnDelay_ = respawnDelay;

        this.enterFn_ = enterFn;
        this.leaveFn_ = leaveFn;
    }

    // Gets the type of pickup that this should be spawned as.
    get type() { return this.type_; }

    // Gets the respawn delay of this pickup, in seconds.
    get respawnDelay() { return this.respawnDelay_; }

    // Gets the function that is to be executed when a player enters this pickup.
    get enterFn() { return this.enterFn_; }

    // Gets the function that is to be executed when a player leaves this pickup.
    get leaveFn() { return this.leaveFn_; }
}

exports = StoredPickup;
