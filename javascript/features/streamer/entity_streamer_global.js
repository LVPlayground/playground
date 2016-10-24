// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamer = require('features/streamer/entity_streamer.js');
const FastPriorityQueue = require('features/streamer/fast_priority_queue.js');

// Comparator that orders stored entities in ascending order by their the total reference count. 
const TotalReferenceComparator = (lhs, rhs) => {
    if (lhs.totalReferences === rhs.totalReferences)
        return 0;

    return lhs.totalReferences > rhs.totalReferences ? 1 : -1;
};

// Implementation of the EntityStreamer base class that adheres to a global entity limit, for
// example vehicles and pickups. See EntityStreamerPlayer for an implementation that will instead
// stream entities up to the limit per player.
//
// Stored entities can be pinned, which means that the streamer will keep them alive. In order for
// this feature to work, the saturation ratio must allow for some space for non-streamable entities
// so that the slots can be shared between pinned entities and disposable entities.
class EntityStreamerGlobal extends EntityStreamer {
    constructor({ maxVisible, streamingDistance = 300, saturationRatio = 0.7, lru = true } = {}) {
        super({ maxVisible, streamingDistance });

        // The ratio of active versus disposable entities that we should try to maintain.
        this.saturationRatio_ = saturationRatio;

        // Priority queue of disposable entities, sorted in ascending order by total reference
        // count, when LRU is disabled. NULL otherwise.
        this.disposableEntities_ = lru ? new FastPriorityQueue(TotalReferenceComparator)
                                       : null;

        // Set of pinned entities that should not be automatically removed by the streamer.
        this.pinned_ = new Map();

        // Total number of entities that have been created by the streamer.
        this.activeEntities_ = 0;

        // Set of streamed entities for each of the connected players.
        this.playerEntities_ = new Map();

        // It's important that derived classes make this instance observe the Player Manager.
    }

    // Gets the saturation ratio that the streamer is intending to maintain.
    get saturationRatio() { return this.saturationRatio_; }

    // ---------------------------------------------------------------------------------------------

    // Indicates that |storedEntity| must now be created. Must be implemented by the streamer that
    // is specific to a particular kind of entity.
    createEntity(storedEntity) {
        throw new Error('EntityStreamerGlobal::createEntity() must be overridden.');
    }

    // Indicates that |storedEntity| must now be deleted. Must be implemented by the streamer that
    // is specific to a particular kind of entity.
    deleteEntity(storedEntity) {
        throw new Error('EntityStreamerGlobal::deleteEntity() must be overridden.');
    }

    // ---------------------------------------------------------------------------------------------

    // Adds |storedEntity| to this entity streamer. Returns whether the entity was added. Reference
    // counting will be skipped when the |lazy| flag has been set.
    add(storedEntity, lazy = false) {
        if (!super.add(storedEntity))
            return false;

        if (lazy)
            return true;

        const streamingDistanceSquared = this.streamingDistance * this.streamingDistance;
        for (const [player, cachedEntities] of this.playerEntities_) {
            const position = player.position;

            if (position.squaredDistanceTo(storedEntity.position) > streamingDistanceSquared)
                continue;  // the |storedEntity| is too far away for the player

            cachedEntities.add(storedEntity);

            this.addEntityReference(storedEntity);
        }

        return true;
    }

    // Pins |storedEntity| to avoid it from being destroyed until it gets unpinned. The allocated
    // slot will be taken from the disposable entity budget. It will be created if necessary. An
    // entity can be pinned for any number of |types|, which should be a Symbol.
    pin(storedEntity, type) {
        if (this.pinned_.has(storedEntity)) {
            this.pinned_.get(storedEntity).add(type);
            return;
        }

        this.pinned_.set(storedEntity, new Set([ type ]));

        // Forcefully unpin the oldest pinned entity, since we now risk overflowing the number of
        // live entities this streamer should curate. Display a warning in the console.
        if (this.pinned_.size > this.saturationRatio_ * this.maxVisible_) {
            console.log('[EntityStreamerGlobal] Forcefully unpinning the oldest pinned entity.');

            for (const pinnedEntity of this.pinned) {
                this.unpin(pinnedEntity);
                break;
            }
        }

        // Make sure that the entity has been created if it doesn't exist yet.
        if (!storedEntity.isConnected())
            this.internalCreateEntity(storedEntity);
    }

    // Returns whether the |storedEntity| has been pinned for the given |type|.
    isPinned(storedEntity, type) {
        const pins = this.pinned_.get(storedEntity);
        if (pins && !type)
            return true;  // check whether *any* pin exists for the |storedEntity|

        if (pins && pins.has(type))
            return true;  // check whether the specific pin exists for the |storedEntity|

        return false;
    }

    // Unpins the |storedEntity| to free it up for being being destroyed. It will be destroyed if
    // there are no live references to the entity anymore, and all pins have been removed.
    unpin(storedEntity, type) {
        const pins = this.pinned_.get(storedEntity);
        if (!pins || !pins.has(type))
            return;  // the vehicle is not pinned for the |type|

        pins.delete(type);

        if (pins.size)
            return;  // other pins are still keeping this vehicle alive

        this.pinned_.delete(storedEntity);

        // Only delete the |storedEntity| if there are no further references to it.
        if (storedEntity.activeReferences)
            return;

        storedEntity.setLiveEntity(null);

        this.activeEntities_--;
        this.deleteEntity(storedEntity);
    }

    // Removes |storedEntity| from this entity streamer. Returns whether the entity was removed.
    // Will release all references to the entity.
    delete(storedEntity) {
        if (!super.delete(storedEntity))
            return false;

        this.pinned_.delete(storedEntity);

        // TODO: This could be much more efficient if we maintained an entity => players set.
        for (const [player, cachedEntities] of this.playerEntities_) {
            if (!cachedEntities.has(storedEntity))
                continue;

            cachedEntities.delete(storedEntity);

            this.deleteEntityReference(storedEntity, false /* lru */);
        }

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Does a complete streaming iteration for all connected players. This is asynchronous due to
    // the use of promises, which will be resolved through microtasks.
    async stream() {
        if (!this.playerEntities_.size)
            return;  // there are no players connected to the server

        const visiblePerPlayer =
            Math.floor((this.maxVisible * this.saturationRatio_) / this.playerEntities_.size);

        for (const [player, cachedEntities] of this.playerEntities_) {
            const closestEntities = await this.streamForPlayer(player, visiblePerPlayer);

            cachedEntities.forEach(entity => {
                if (closestEntities.has(entity))
                    return;  // the entity is still in scope for the player

                this.deleteEntityReference(entity);
            });

            closestEntities.forEach(entity => {
                if (cachedEntities.has(entity))
                    return;  // the entity is still in scope for the player

                this.addEntityReference(entity);
            });

            this.playerEntities_.set(player, closestEntities);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a reference to |storedEntity| has been added. The |storedEntity| may have to be
    // created when this is the first active reference to it.
    addEntityReference(storedEntity) {
        if (!storedEntity.activeReferences && !this.pinned_.has(storedEntity))
            this.internalCreateEntity(storedEntity);

        storedEntity.declareReferenceAdded();
    }

    // Creates the |storedEntity|. Makes sure that a slot can be allocated for the entity prior to
    // actually creating the entity, to make sure we don't exceed the entity limit.
    internalCreateEntity(storedEntity) {
        // If the limit of active entities has been reached, which should only be possible when
        // a LRU is being used by the streamer, delete the least referred to entity.
        if (this.activeEntities_ === this.maxVisible) {
            if (!this.disposableEntities_ || !this.disposableEntities_.size)
                throw new Error('Reached the entity limit without anything to dispose.');

            const disposableEntity = this.disposableEntities_.pop();
            disposableEntity.setLiveEntity(null);
            
            this.deleteEntity(disposableEntity);
            this.activeEntities_--;
            
        }

        // Remove the |storedEntity| from the disposable entities if it's listed there. Create the
        // entity using the actual entity streamer when that's not the case.
        if (!this.disposableEntities_ || !this.disposableEntities_.delete(storedEntity)) {
            storedEntity.setLiveEntity(this.createEntity(storedEntity));
            this.activeEntities_++;
        }
    }

    // Called when a reference to |storedEntity| has been removed. The |storedEntity| may have to be
    // moved to the LRU list, or even be removed altogether, if this was the last active reference.
    deleteEntityReference(storedEntity, lru = true) {
        storedEntity.declareReferenceDeleted();

        if (storedEntity.activeReferences)
            return;  // the entity is in scope for other players, let it be

        if (lru && this.pinned_.has(storedEntity))
            return;  // the entity has been pinned, so shouldn't be deleted

        // Add the |storedEntity| to the disposable entity queue instead of destroying it if we can.
        if (lru && this.disposableEntities_) {
            this.disposableEntities_.push(storedEntity);
            return;
        }

        storedEntity.setLiveEntity(null);
        
        this.deleteEntity(storedEntity);
        this.activeEntities_--;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has connected to the server.
    onPlayerConnect(player) {
        this.playerEntities_.set(player, new Set());
    }

    // Called when the |player| has disconnected from the server.
    onPlayerDisconnect(player) {
        const cachedEntities = this.playerEntities_.get(player);
        cachedEntities.forEach(storedEntity =>
            this.deleteEntityReference(storedEntity));

        this.playerEntities_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------
    // Information exposed for testing purposes.

    // Gets the number of player entity sets stored within this streamer.
    get playerEntitySetCount() { return this.playerEntities_.size; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.pinned_.clear();
        this.pinned_ = null;

        this.disposableEntities_.clear();
        this.disposableEntities_ = null;

        this.playerEntities_.clear();
        this.playerEntities_ = null;

        super.dispose();
    }
}

exports = EntityStreamerGlobal;
