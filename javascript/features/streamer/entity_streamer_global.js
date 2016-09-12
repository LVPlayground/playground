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

        // The ratio of active versus disposable vehicles that we should try to maintain.
        this.saturationRatio_ = saturationRatio;

        // Set of streamed entities for each of the connected players.
        this.playerEntities_ = new Map();

        // Observe the player manager for connecting and disconnecting players.
        server.playerManager.addObserver(this, true /* replayHistory */);
    }

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

    // Does a complete streaming iteration for all connected players. This is asynchronous due to
    // the use of promises, which will be resolved through microtasks.
    async stream() {
        if (!this.playerEntities_.size)
            return;  // there are no players connected to the server

        const visiblePerPlayer =
            Math.floor((this.maxVisible * this.saturationRatio_) / this.playerEntities_.size);

        for (const player of server.playerManager) {
            const cachedEntities = this.playerEntities_.get(player);
            const closestEntities = await this.streamForPlayer(player, visiblePerPlayer);

            cachedEntities.forEach(entity => {
                if (closestEntities.has(entity))
                    return;  // the entity is still in scope for the player

                // TODO: |entity| is now out of scope
            });

            closestEntities.forEach(entity => {
                if (cachedEntities.has(entity))
                    return;  // the entity is still in scope for the player

                // TODO: |entity| is now in scope
            });

            this.playerEntities_.set(player, closestEntities);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has connected to the server.
    onPlayerConnect(player) {
        this.playerEntities_.set(player, new Set());
    }

    // Called when the |player| has disconnected from the server.
    onPlayerDisconnect(player) {
        // TODO: Properly clean up references to the vehicles that were streamed in because the
        // |player| had them in scope, which now isn't the case anymore.

        this.playerEntities_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

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
