// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamer = require('features/streamer/entity_streamer.js');
const StoredEntity = require('features/streamer/stored_entity.js');

describe('EntityStreamer', it => {
    // Fills the |streamer| with |edge|*|edge| entities. The created entities will be ten units
    // apart, starting at position zero. An array of StoredEntities will be returned.
    function fillStreamer(streamer, edge) {
        const entities = [];

        for (let x = 0; x < edge; ++x) {
            for (let y = 0; y < edge; ++y) {
                entities.push(new StoredEntity({
                    modelId: 1,
                    position: new Vector(x * 10, y * 10, 0),
                    interiorId: -1,
                    virtualWorld: -1
                }));
            }
        }

        entities.forEach(entity => streamer.add(entity));

        return entities;
    }

    // Returns the |count| |entities| closest to |position|, in a stable order.
    function sortByDistance(position, entities, count = null) {
        count = count || entities.length;

        const cachedDistances = new WeakMap();
        const cacheDistance = entity => {
            const distance = entity.position.squaredDistanceTo(position);
            cachedDistances.set(entity, distance);

            return distance;
        };

        const comparator = (lhs, rhs) => {
            const lhsDistance = cachedDistances.get(lhs) || cacheDistance(lhs);
            const rhsDistance = cachedDistances.get(rhs) || cacheDistance(rhs);

            if (lhsDistance === rhsDistance) {
                if (lhs.position.x === rhs.position.x) {
                    if (lhs.position.y === rhs.position.y)
                        return 0;

                    return lhs.position.y > rhs.position.y ? 1 : -1;
                }

                return lhs.position.x > rhs.position.x ? 1 : -1;
            }

            return lhsDistance > rhsDistance ? 1 : -1;
        };

        return Array.from(entities).sort(comparator).slice(0, count);
    }

    it('should store the maximum entities and streaming distance on the instance', assert => {
        const streamer = new EntityStreamer({ maxVisible: 1337, streamingDistance: 9001 });

        assert.equal(streamer.maxVisible, 1337);
        assert.equal(streamer.streamingDistance, 9001);
    });

    it('should accurately count the number of entities on the streamer', assert => {
        const streamer = new EntityStreamer({ maxVisible: 10 });
        const entities = fillStreamer(streamer, 10 /* 100 entities */);

        assert.equal(streamer.size, entities.length);
    });

    it('should be safe to add an entity multiple times', assert => {
        const streamer = new EntityStreamer({ maxVisible: 10 });
        const [ entity ] = fillStreamer(streamer, 1 /* 1 entity */);

        assert.equal(streamer.size, 1);

        assert.isFalse(streamer.add(entity));
        assert.isFalse(streamer.add(entity));
        assert.isFalse(streamer.add(entity));

        assert.equal(streamer.size, 1);
    });

    it('should be safe to remove an entity multiple times', assert => {
        const streamer = new EntityStreamer({ maxVisible: 10 });
        const entities = fillStreamer(streamer, 2 /* 4 entities */);

        assert.equal(streamer.size, entities.length);

        assert.isTrue(streamer.delete(entities[0]));
        assert.isFalse(streamer.delete(entities[0]));
        assert.isFalse(streamer.delete(entities[0]));

        assert.equal(streamer.size, entities.length - 1);
    });

    it('should reset entity reference counts when its being added', assert => {
        const streamer = new EntityStreamer({ maxVisible: 10 });
        const entity = new StoredEntity({
            modelId: 1,
            position: new Vector(50, 50, 0),
            interiorId: 1,
            virtualWorld: 0
        });

        assert.equal(entity.activeReferences, 0);
        assert.equal(entity.totalReferences, 0);

        for (let i = 0; i < 10; ++i)
            entity.declareReferenceAdded();

        assert.equal(entity.activeReferences, 10);
        assert.equal(entity.totalReferences, 10);

        entity.declareReferenceDeleted();

        assert.equal(entity.activeReferences, 9);
        assert.equal(entity.totalReferences, 10);

        assert.isTrue(streamer.add(entity));

        assert.equal(entity.activeReferences, 0);
        assert.equal(entity.totalReferences, 0);
    });

    it('should throw when attaching or detaching an entity from the invalid streamer', assert => {
        const streamer1 = new EntityStreamer({ maxVisible: 10 });
        const streamer2 = new EntityStreamer({ maxVisible: 10 });

        const entity = new StoredEntity({
            modelId: 1,
            position: new Vector(50, 50, 0),
            interiorId: 1,
            virtualWorld: 0
        });

        assert.isFalse(entity.isAttached());
        assert.throws(() => entity.detachFromStreamer(streamer1));
        assert.throws(() => entity.detachFromStreamer(streamer2));

        entity.attachToStreamer(streamer2);

        assert.throws(() => entity.attachToStreamer(streamer1));

        assert.isTrue(entity.isAttached());
        assert.throws(() => entity.detachFromStreamer(streamer1));
        assert.doesNotThrow(() => entity.detachFromStreamer(streamer2));
        assert.isFalse(entity.isAttached());
    });

    it('should attach and detach entities accordingly', assert => {
        const streamer = new EntityStreamer({ maxVisible: 10 });
        const entity = new StoredEntity({
            modelId: 1,
            position: new Vector(50, 50, 0),
            interiorId: 1,
            virtualWorld: 0
        });

        assert.isFalse(entity.isAttached());

        assert.isTrue(streamer.add(entity));
        assert.isTrue(entity.isAttached());

        assert.isTrue(streamer.delete(entity));
        assert.isFalse(entity.isAttached());
    });

    it('should allow for different visibility parameters', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const streamer = new EntityStreamer({ maxVisible: 10 });
        const entities = fillStreamer(streamer, 10 /* 100 entities */);

        assert.equal((await streamer.streamForPlayer(gunther)).size, 10);
        assert.equal((await streamer.streamForPlayer(gunther, 5 /* visible */)).size, 5);
    });

    it('should be able to find the entities closest to the player', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const streamer = new EntityStreamer({ maxVisible: 10 });
        const entities = fillStreamer(streamer, 10 /* 100 entities */);

        gunther.position = new Vector(52, 48, 0);

        const closestEntities = sortByDistance(gunther.position, entities, 10);
        const streamedEntities =
            sortByDistance(gunther.position, await streamer.streamForPlayer(gunther));

        assert.deepEqual(closestEntities, streamedEntities);
    });

    it('should be able to delete entities from the streamer', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const streamer = new EntityStreamer({ maxVisible: 10, streamingDistance: 5 });
        const entities = fillStreamer(streamer, 10 /* 100 entities */);

        const randomEntity = entities[Math.floor(Math.random() * entities.length)];

        gunther.position = randomEntity.position;

        // (1) Stream while |randomEntity| still exists in the streamer.
        {
            const streamedEntities = await streamer.streamForPlayer(gunther);

            assert.equal(streamedEntities.size, 1);
            assert.equal(Array.from(streamedEntities)[0], randomEntity);
        }

        assert.isTrue(streamer.delete(randomEntity));
        assert.equal(streamer.size, entities.length - 1);

        // (2) Stream now that the |randomEntity| has been removed from the streamer.
        {
            const streamedEntities = await streamer.streamForPlayer(gunther);

            assert.equal(streamedEntities.size, 0);
        }
    });

    it('should be possible to clear the streamer', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(50, 50, 0);

        const streamer = new EntityStreamer({ maxVisible: 10 });
        const entities = fillStreamer(streamer, 10 /* 100 entities */);

        assert.isAbove((await streamer.streamForPlayer(gunther)).size, 0);

        streamer.clear();

        assert.equal(streamer.size, 0);
        assert.equal((await streamer.streamForPlayer(gunther)).size, 0);
    });
});
