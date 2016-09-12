// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Base class representing a stored entity. Usually you would use a higher level object, specific to
// the entity you're working with, as opposed to this class.
class StoredEntity {
    constructor({ modelId, position, interiorId, virtualWorld } = {}) {
        this.modelId_ = modelId;
        this.position_ = position;
        this.interiorId_ = interiorId;
        this.virtualWorld_ = virtualWorld;
    }

    // Gets the model Id associated with this entity.
    get modelId() { return this.modelId_; }

    // Gets the position at which this entity should spawn.
    get position() { return this.position_; }

    // Gets the Id of the interior to which this entity should be tied. An interior of -1 means that
    // the entity should be streamed regardless of which interior the player is in.
    get interiorId() { return this.interiorId_; }

    // Gets the Id of the virtual world to which this entity should be tied. A virtual world of -1
    // means that the entity should be streamed regardless of which virtual world the player is in.
    get virtualWorld() { return this.virtualWorld_; }
}

exports = StoredEntity;
