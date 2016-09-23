// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const Scheduler = require('features/streamer/scheduler.js');
const StoredEntity = require('features/streamer/stored_entity.js');

describe('Scheduler', (it, beforeEach, afterEach) => {
    let scheduler = null;

    beforeEach(() => scheduler = new Scheduler());
    afterEach(() => {
        if (scheduler)
            scheduler.dispose();
    });

    it('should not attempt to stream empty streamers', async(assert) => {
        let streamCounter = 0;

        class MyStreamer extends EntityStreamerGlobal {
            async stream() {
                streamCounter++;
            }
        }

        scheduler.addStreamer(new MyStreamer({ maxVisible: 10 }));

        assert.equal(scheduler.counter, 0);
        assert.equal(streamCounter, 0);

        scheduler.start();  // asynchronous, will stop when being disposed of

        // Make sure that we trigger the streaming check ten more times.
        for (let i = 0; i < 10; ++i)
            await server.clock.advance(1000);  // one second

        assert.equal(scheduler.counter, 11);
        assert.equal(streamCounter, 0);
    });

    it('should attempt to stream non-empty streamers', async(assert) => {
        let streamCounter = 0;

        class MyStreamer extends EntityStreamerGlobal {
            async stream() {
                streamCounter++;
            }

            createEntity(storedEntity) {}
            deleteEntity(storedEntity) {}
        }

        const streamer = new MyStreamer({ maxVisible: 10 });
        scheduler.addStreamer(streamer);

        assert.equal(scheduler.counter, 0);
        assert.equal(streamCounter, 0);

        scheduler.start();  // asynchronous, will stop when being disposed of

        // Make sure that we trigger the streaming check ten more times.
        for (let i = 0; i < 10; ++i)
            await server.clock.advance(1000);  // one second

        assert.equal(scheduler.counter, 11);
        assert.equal(streamCounter, 0);

        // Now add an entity to the streamer, which should trigger the scheduler.
        streamer.add(new StoredEntity({
            modelId: 1,
            position: new Vector(0, 0, 0),
            interiorId: -1,
            virtualWorld: -1
        }));

        // Trigger the streaming check another time.
        await server.clock.advance(1000);

        assert.equal(scheduler.counter, 12);
        assert.equal(streamCounter, 1);

        // Clear the entities from the streamer so that it gets ignored again.
        streamer.clear();

        await Promise.resolve();
        await server.clock.advance(1000);

        assert.equal(scheduler.counter, 13);
        assert.equal(streamCounter, 1);
    });

    it('should stop ticking after the scheduler has been disposed of', async(assert) => {
        assert.equal(scheduler.counter, 0);

        scheduler.start(); // asynchronous, will stop when being disposed of

        // Make sure that we trigger the streaming check ten more times.
        for (let i = 0; i < 10; ++i)
            await server.clock.advance(1000);  // one second

        assert.equal(scheduler.counter, 11);

        scheduler.dispose();

        // Attempt to trigger the streaming check ten more times.
        for (let i = 0; i < 10; ++i)
            await server.clock.advance(1000);  // one second

        assert.equal(scheduler.counter, 11);

        scheduler = null;
    });
});
