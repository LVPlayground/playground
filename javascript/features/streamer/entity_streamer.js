// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Base class for streamers responsible for exceeding the San Andreas: Multiplayer entity limits.
// This class is not meant to be used directly, instead, use EntityStreamer{Global,Player} or one
// of the streamers specialized for a particular type of entity.
class EntityStreamer {
    constructor({ maxVisible, streamingDistance = 300 } = {}) {
        this.streamer_ = new Streamer(maxVisible, streamingDistance);

        this.maxVisible_ = maxVisible;
        this.streamingDistance_ = streamingDistance;

        this.id_ = 0;

        this.entitiesByInstance_ = new Map();
        this.entitiesById_ = new Map();
    }

    // Gets the maximum number of entities that should be streamed through this streamer.
    get maxVisible() { return this.maxVisible_; }

    // Gets the maximum streaming distance applying to entities in this streamer.
    get streamingDistance() { return this.streamingDistance_; }

    // Gets the number of entities that have been stored in this streamer.
    get size() { return this.entitiesByInstance_.size; }

    // Adds |storedEntity| to this entity streamer. 
    add(storedEntity) {
        if (this.entitiesByInstance_.has(storedEntity))
            return;

        storedEntity.resetReferences();

        const entityId = this.id_++;

        this.entitiesByInstance_.set(storedEntity, entityId);
        this.entitiesById_.set(entityId, storedEntity);

        this.streamer_.add(
            entityId, storedEntity.position.x, storedEntity.position.y, storedEntity.position.z);
    }

    // Deletes |storedEntity| from the entity streamer.
    delete(storedEntity) {
        const entityId = this.entitiesByInstance_.get(storedEntity);
        if (entityId === undefined)
            return;

        this.entitiesByInstance_.delete(storedEntity);
        this.entitiesById_.delete(entityId);

        this.streamer_.delete(entityId);
    }

    // Asynchronously returns the |maxVisible| entities that are closest to the |player|.
    async streamForPlayer(player, visible = null) {
        visible = visible || this.maxVisible_;

        const position = player.position;

        // TODO: Select the appropriate streamer based on the player's interior Id and virtual
        // world, so that the right entities are returned for the player.

        const entityIds = await this.streamer_.stream(visible, position.x, position.y, position.z);
        const entities = [];

        entityIds.forEach(entityId =>
            entities.push(this.entitiesById_.get(entityId)));

        return entities;
    }

    // Clears all entities that are part of this entity streamer.
    clear() {
        this.streamer_.clear();

        this.entitiesByInstance_.clear();
        this.entitiesById_.clear();

        this.id_ = 0;
    }

    dispose() {
        this.streamer_.clear();
        this.streamer_ = null;
    }
}

exports = EntityStreamer;
