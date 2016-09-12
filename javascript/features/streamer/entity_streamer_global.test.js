// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const StoredEntity = require('features/streamer/stored_entity.js');

describe('EntityStreamerGlobal', it => {
    // Implementation of the EntityStreamerGlobal interface that just stores the instances.
    class MyEntityStreamer extends EntityStreamerGlobal {
        constructor({ maxVisible = 100, streamingDistance = 300, saturationRatio = 0.7 } = {}) {
            super({ maxVisible, streamingDistance, saturationRatio });
            this.activeEntities_ = new Set();
        }

        get activeEntityCount() { return this.activeEntities_.size; }
        get activeEntities() { return this.activeEntities_.values(); }

        createEntity(storedEntity) { this.activeEntities_.add(storedEntity); }
        deleteEntity(storedEntity) { this.activeEntities_.delete(storedEntity); }
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

    it('should stream all the entities', async(assert) => {
        const streamer = new MyEntityStreamer();

        await streamer.stream();

    })
});
