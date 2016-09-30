// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const StoredEntity = require('features/streamer/stored_entity.js');

describe('EntityStreamerGlobal', it => {
    // Implementation of the EntityStreamerGlobal interface that just stores the instances.
    class MyEntityStreamer extends EntityStreamerGlobal {
        constructor({ maxVisible = 5, streamingDistance = 300, saturationRatio = 0.7,
                      lru = true } = {}) {
            super({ maxVisible, streamingDistance, saturationRatio, lru });
            this.entities_ = new Set();
        }

        get activeEntityCount() { return this.entities_.size; }
        get activeEntities() { return Array.from(this.entities_.values()); }

        createEntity(storedEntity) {
            if (this.entities_.has(storedEntity))
                throw new Error('Attempting to create an entity that already exists.');

            this.entities_.add(storedEntity);
        }

        deleteEntity(storedEntity) {
            if (!this.entities_.has(storedEntity))
                throw new Error('Attempting to delete an entity that does not exist.');

            this.entities_.delete(storedEntity);
        }
    }

    // Creates a new StoredEntity instance filled with random information.
    function createRandomEntity({ min, max } = {}) {
        return new StoredEntity({
            modelId: 1,
            position: new Vector(Math.floor(Math.random() * (max - min)) + min,
                                 Math.floor(Math.random() * (max - min)) + min, 0),
            interiorId: -1,
            virtualWorld: -1
        });
    }

    it('should track status for the players connected to the server', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const streamer = new MyEntityStreamer();

        const originalPlayerCount = server.playerManager.count;

        assert.equal(streamer.playerEntitySetCount, server.playerManager.count);

        gunther.disconnect();
        
        assert.equal(streamer.playerEntitySetCount, server.playerManager.count);
        assert.equal(streamer.playerEntitySetCount, originalPlayerCount - 1);

        server.playerManager.onPlayerConnect({ playerid: 51, name: 'TEF' });

        assert.equal(streamer.playerEntitySetCount, server.playerManager.count);
        assert.equal(streamer.playerEntitySetCount, originalPlayerCount);
    });

    it('should honor the lazy flag when adding new entities to the streamer', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const streamer = new MyEntityStreamer();

        const entity = createRandomEntity({ min: 0, max: 100 });

        gunther.position = entity.position;

        assert.equal(streamer.activeEntityCount, 0);
        streamer.add(entity, false /* lazy */);
        assert.equal(streamer.activeEntityCount, 1);

        streamer.delete(entity);

        assert.equal(streamer.activeEntityCount, 0);
        streamer.add(entity, true /* lazy */);
        assert.equal(streamer.activeEntityCount, 0);
    });

    it('should maintain reference count on the entities whilst streaming', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const streamer = new MyEntityStreamer();

        const entity = createRandomEntity({ min: 2000, max: 2100 });
        streamer.add(entity);

        const nearPosition = entity.position.translate({ x: 5, y: 5 });
        const farPosition =
            entity.position.translate({ x: streamer.streamingDistance + 1,
                                        y: streamer.streamingDistance + 1 });

        for (let iteration = 0; iteration < 10; ++iteration) {
            assert.equal(entity.activeReferences, 0);
            assert.equal(entity.totalReferences, iteration);

            gunther.position = nearPosition;

            await streamer.stream();

            assert.equal(entity.activeReferences, 1);
            assert.equal(entity.totalReferences, iteration + 1);

            gunther.position = farPosition;

            await streamer.stream();
        }

        assert.equal(entity.activeReferences, 0);
        assert.equal(entity.totalReferences, 10);
    });

    it('should aim to maintain the entity saturation ratio', async(assert) => {
        const playerCount = server.playerManager.count;

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(2050, 2050, 0);

        const streamer = new MyEntityStreamer({ maxVisible: 100, saturationRatio: 0.7 });

        for (let entity = 0; entity < 100; ++entity)
            streamer.add(createRandomEntity({ min: 2000, max: 2100 }), true /* lazy */);

        assert.equal(streamer.activeEntityCount, 0);

        await streamer.stream();

        // The expected entity count is ([maxVisible=100] * [saturation=.7]) / [playerCount=3]) = 23
        const visibilityPerPlayer =
            Math.floor((streamer.maxVisible * streamer.saturationRatio) / playerCount);

        assert.equal(streamer.activeEntityCount, visibilityPerPlayer);
    });

    it('should be able to display the entities closest to all players', async(assert) => {
        const playerCount = server.playerManager.count;
        const streamer = new MyEntityStreamer({ maxVisible: 100 });

        server.playerManager.forEach(player => {
            const positionOffset = 1000 * player.id;

            player.position = new Vector(positionOffset + 50, positionOffset + 50, 0);

            for (let entity = 0; entity < 100; ++entity) {
                streamer.add(createRandomEntity({ min: positionOffset, max: positionOffset + 100 }),
                                                true /* lazy */);
            }
        });

        assert.equal(streamer.activeEntityCount, 0);

        await streamer.stream();

        // The expected entity count is ([maxVisible=100] * [saturation=.7]) / [playerCount=3]) = 23
        // multiplied by the number of in-game players.
        const visibilityPerPlayer =
            Math.floor((streamer.maxVisible * streamer.saturationRatio) / playerCount);

        assert.equal(streamer.activeEntityCount, visibilityPerPlayer * playerCount);
    });

    it('should maintain a lru list of disposable entities', async(assert) => {
        const playerCount = server.playerManager.count;

        const gunther = server.playerManager.getById(0 /* Gunther */);
        const streamer = new MyEntityStreamer();

        // Create 101 entities, in which one is separated far away from the others.
        const entity = createRandomEntity({ min: 2000, max: 2100 });
        streamer.add(entity);

        for (let i = 0; i < 100; ++i)
            streamer.add(createRandomEntity({ min: 3000, max: 3100 }));

        const visibilityPerPlayer =
            Math.floor((streamer.maxVisible * streamer.saturationRatio) / playerCount);

        // Position |gunther| near the |entity|.
        gunther.position = entity.position;

        assert.equal(streamer.activeEntityCount, 0);
        await streamer.stream();
        assert.equal(streamer.activeEntityCount, 1);
        
        // Move |gunther| out of scope of the |entity|, which should not delete it.
        gunther.position = new Vector(3050, 3050, 0);

        await streamer.stream();

        assert.equal(streamer.activeEntityCount, visibilityPerPlayer + 1 /* |entity| */);
        assert.equal(entity.activeReferences, 0);
    });

    it('should be able to pin and unpin entities', async(assert) => {
        const streamer = new MyEntityStreamer();
        const entity = new StoredEntity({
            modelId: 1,
            position: new Vector(5000, 5500, 6000),
            interiorId: -1,
            virtualWorld: -1
        });

        streamer.add(entity);

        assert.equal(streamer.activeEntityCount, 0);
        await streamer.stream();
        assert.equal(streamer.activeEntityCount, 0);

        streamer.pin(entity);

        assert.equal(streamer.activeEntityCount, 1);
        assert.equal(entity.activeReferences, 0);
        assert.equal(entity.totalReferences, 0);

        streamer.unpin(entity);

        assert.equal(streamer.activeEntityCount, 0);
        assert.equal(entity.activeReferences, 0);
        assert.equal(entity.totalReferences, 0);
    });

    it('should not delete entity when unpinning them whilst it has references', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const streamer = new MyEntityStreamer({ lru: false });
        const entity = new StoredEntity({
            modelId: 1,
            position: new Vector(5000, 5500, 6000),
            interiorId: -1,
            virtualWorld: -1
        });

        streamer.add(entity);
        streamer.pin(entity);

        assert.equal(streamer.activeEntityCount, 1);
        assert.equal(entity.activeReferences, 0);

        gunther.position = entity.position.translate({ x: 5, y: -5 });
        
        await streamer.stream();

        assert.equal(streamer.activeEntityCount, 1);
        assert.equal(entity.activeReferences, 1);

        streamer.unpin(entity);

        assert.equal(streamer.activeEntityCount, 1);
        assert.equal(entity.activeReferences, 1);

        gunther.position = new Vector(0, 0, 0);

        await streamer.stream();

        assert.equal(streamer.activeEntityCount, 0);
        assert.equal(entity.activeReferences, 0);
    });

    it('should never reach the entity limit, even with lots of player movement', async(assert) => {
        // Make sure that 50 players are connected to the server.
        for (let playerId = 0; playerId < 50; ++playerId) {
            if (server.playerManager.getById(playerId) !== null)
                continue;

            server.playerManager.onPlayerConnect({ playerid: playerId, name: 'Player' + playerId });
        }

        assert.equal(server.playerManager.count, 50);

        const streamer = new MyEntityStreamer({ maxVisible: 500 });

        // Now create a thousand entities in a 500x500 grid.
        for (let i = 0; i < 1000; ++i)
            streamer.add(createRandomEntity({ min: 0, max: 500 }), true /* lazy */);

        // Optimise the streamer now that the entities have been added.
        streamer.optimise();

        assert.equal(streamer.activeEntityCount, 0);

        // Utility function to create a random coordinate in range of [0, 500].
        const randomCoord = () => Math.floor(Math.random() * 500);

        // For 30 iterations, teleport the players to random positions within that grid and do a
        // full stream that will rearrange the created entities. This mimics the worst-case load of
        // streaming a thousand entities to 50 players over the course of half a minute.
        for (let iteration = 0; iteration < 30; ++iteration) {
            server.playerManager.forEach(player =>
                player.position = new Vector(randomCoord(), randomCoord(), 0));

            await streamer.stream();
        }

        // By this time (3000 kNN searches), it's pretty much a certainty that all entities have
        // been referred to at least once. That means that the streamer will have maxed out.
        assert.isAbove(streamer.activeEntityCount, 498);
    });

    it('should be able to stream 75,000 entities for 100 players, 10 times', async(assert) => {
        const ENTITY_COUNT = 75000;
        const PLAYER_COUNT = 100;

        // Maximum time, in milliseconds, that streaming should take for this test to be quiet.
        const MAX_STREAM_TIME_MS = 125;

        // Make sure that |PLAYER_COUNT| players are connected to the server.
        for (let playerId = 0; playerId < PLAYER_COUNT; ++playerId) {
            if (server.playerManager.getById(playerId) !== null)
                continue;

            server.playerManager.onPlayerConnect({ playerid: playerId, name: 'Player' + playerId });
        }

        const streamer = new MyEntityStreamer({ maxVisible: 1000, streamingDistance: 300 });

        // Now create |ENTITY_COUNT| entities on a grid that's slightly smaller than the size of San
        // Andreas. That counters the distribution bias a little bit.
        for (let i = 0; i < ENTITY_COUNT; ++i)
            streamer.add(createRandomEntity({ min: 0, max: 4500 }), true /* lazy */);

        // Optimise the streamer now that the entities have been added.
        streamer.optimise();

        // Utility function to create a random coordinate in range of [0, 4500].
        const randomCoord = () => Math.floor(Math.random() * 4500);

        let totalTime = 0;
        for (let iteration = 0; iteration < 10; ++iteration) {
            // Position all 50 players at random positions on the smaller map.
            server.playerManager.forEach(player =>
                player.position = new Vector(randomCoord(), randomCoord(), 0));

            // Now run the performance test...
            const startTime = highResolutionTime();
            await streamer.stream();
            const endTime = highResolutionTime();

            totalTime += endTime - startTime;
        }

        const time = Math.round(totalTime * 100) / 100;

        if (time < MAX_STREAM_TIME_MS)
            return;

        // Output the result to the console, because that's the only sensible thing we can do.
        console.log('[EntityStreamerGlobal] Streamed ' + ENTITY_COUNT + ' entities ten times for ' +
                    PLAYER_COUNT + ' players in ' + time + ' ms.');

    });
});
