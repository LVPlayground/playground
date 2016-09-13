// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const StoredEntity = require('features/streamer/stored_entity.js');

describe('EntityStreamerGlobal', it => {
    // Implementation of the EntityStreamerGlobal interface that just stores the instances.
    class MyEntityStreamer extends EntityStreamerGlobal {
        constructor({ maxVisible = 5, streamingDistance = 300, saturationRatio = 0.7 } = {}) {
            super({ maxVisible, streamingDistance, saturationRatio });
            this.activeEntities_ = new Set();
        }

        get activeEntityCount() { return this.activeEntities_.size; }
        get activeEntities() { return Array.from(this.activeEntities_.values()); }

        createEntity(storedEntity) { this.activeEntities_.add(storedEntity); }
        deleteEntity(storedEntity) { this.activeEntities_.delete(storedEntity); }
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
            assert.equal(streamer.activeEntityCount, 0);

            gunther.position = nearPosition;

            await streamer.stream();

            assert.equal(entity.activeReferences, 1);
            assert.equal(entity.totalReferences, iteration + 1);
            assert.equal(streamer.activeEntityCount, 1);

            gunther.position = farPosition;

            await streamer.stream();
        }

        assert.equal(entity.activeReferences, 0);
        assert.equal(entity.totalReferences, 10);
        assert.equal(streamer.activeEntityCount, 0);
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

    it('should be able to display the vehicles closest to all players', async(assert) => {
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
});
