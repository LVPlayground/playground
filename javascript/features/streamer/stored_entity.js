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

        // The streamer that the entity is attached to. Not publicly exposed, but can be used by
        // subclasses of the StoredEntity to interact with the attached streamer.
        this.streamer_ = null;

        // Reference counts for this stored entity.
        this.activeReferences_ = 0;
        this.totalReferences_ = 0;
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

    // ---------------------------------------------------------------------------------------------

    // Returns whether the entity is currently attached to a streamer.
    isAttached() { return this.streamer_ !== null; }

    // Attaches the entity to the given |streamer|. Will throw when it's already attached.
    attachToStreamer(streamer) {
        if (this.streamer_ !== null)
            throw new Error('This entity is already attached to a streamer.');

        this.streamer_ = streamer;
    }

    // Detaches the entity from its |streamer|. Will throw when it's not attached to the |streamer|.
    detachFromStreamer(streamer) {
        if (this.streamer_ !== streamer)
            throw new Error('This entity is not attached to the given |streamer|.');

        this.streamer_ = null;
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the number of active references to this entity.
    get activeReferences() { return this.activeReferences_; }

    // Gets the total number of references to this entity.
    get totalReferences() { return this.totalReferences_; }

    // Declares that a new reference to this entity has been added.
    declareReferenceAdded() {
        ++this.activeReferences_;
        ++this.totalReferences_;
    }

    // Declares that a reference to this entity has been deleted.
    declareReferenceDeleted() {
        --this.activeReferences_;
    }

    // Resets the reference information for this entity.
    resetReferences() {
        this.activeReferences_ = 0;
        this.totalReferences_ = 0;
    }
}

exports = StoredEntity;
