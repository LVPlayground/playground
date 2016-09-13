// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamer = require('features/streamer/entity_streamer.js');

// Implementation of the EntityStreamer base class that adheres to a global entity limit, for
// example vehicles and pickups. See EntityStreamerPlayer for an implementation that will instead
// stream entities up to the limit per player.
class EntityStreamerGlobal extends EntityStreamer {
    constructor({ maxVisible, streamingDistance = 300, saturationRatio = 0.7 } = {}) {
        super({ maxVisible, streamingDistance });

        // The ratio of active versus disposable entities that we should try to maintain.
        this.saturationRatio_ = saturationRatio;

        // Set of streamed entities for each of the connected players.
        this.playerEntities_ = new Map();

        // Observe the player manager for connecting and disconnecting players.
        server.playerManager.addObserver(this, true /* replayHistory */);
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
    // counting will be skipped when |lazy| is set to TRUE.
    add(storedEntity, lazy = false) {
        if (!super.add(storedEntity))
            return false;

        if (!lazy) {
            const streamingDistanceSquared = this.streamingDistance * this.streamingDistance;
            for (const [player, cachedEntities] of this.playerEntities_) {
                const position = player.position;

                if (position.squaredDistanceTo(storedEntity.position) > streamingDistanceSquared)
                    continue;  // the |storedEntity| is too far away for the player

                cachedEntities.add(storedEntity);

                this.addEntityReference(storedEntity);
            }
        }

        return true;
    }

    // Removes |storedEntity| from this entity streamer. Returns whether the entity was removed.
    // Will release all references to the entity.
    delete(storedEntity) {
        if (!super.delete(storedEntity))
            return false;

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

    // Called when a reference to |entity| has been added. The |entity| may have to be created if
    // this is the first active reference to it.
    addEntityReference(entity) {
        if (!entity.activeReferences) {
            // TODO: Implement a LRU list for disposable entities.

            this.createEntity(entity);
        }

        entity.declareReferenceAdded();
    }

    // Called when a reference to |entity| has been removed. The |entity| may have to be moved to
    // the LRU list, or potentially even removed altogether, if this was the last active reference.
    deleteEntityReference(entity, lru = true) {
        entity.declareReferenceDeleted();

        if (entity.activeReferences)
            return;  // the entity is in scope for other players, let it be

        // TODO: Implement a LRU list for disposable entities.

        this.deleteEntity(entity);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has connected to the server.
    onPlayerConnect(player) {
        this.playerEntities_.set(player, new Set());
    }

    // Called when the |player| has disconnected from the server.
    onPlayerDisconnect(player) {
        const cachedEntities = this.playerEntities_.get(player);
        cachedEntities.forEach(entity =>
            this.deleteEntityReference(entity));

        this.playerEntities_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------
    // Information exposed for testing purposes.

    // Gets the number of player entity sets stored within this streamer.
    get playerEntitySetCount() { return this.playerEntities_.size; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.playerEntities_.clear();
        this.playerEntities_ = null;

        super.dispose();
    }
}

exports = EntityStreamerGlobal;
