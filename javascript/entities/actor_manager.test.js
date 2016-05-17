// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ActorManager = require('entities/actor_manager.js');
const MockActor = require('test/mock_actor.js');
const Vector = require('base/vector.js');

describe('ActorManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new ActorManager(MockActor /* actorConstructor */));
    afterEach(() => manager.dispose());

    it('should enable creation of actors', assert => {
        const actor = manager.createActor({ modelId: 121,
                                            position: new Vector(1, 2, 3),
                                            rotation: 187 });

        assert.isNotNull(actor);

        assert.equal(actor.modelId, 121);
        assert.deepEqual(actor.position, new Vector(1, 2, 3));
        assert.equal(actor.rotation, 187);
    });

    it('should count the number of created actors, and dispose of them appropriately', assert => {
        manager.createActor({ modelId: 121, position: new Vector(0, 0, 0), rotation: 180 });
        manager.createActor({ modelId: 122, position: new Vector(1, 1, 1), rotation: 270 });
        manager.createActor({ modelId: 123, position: new Vector(2, 2, 2), rotation: 360 });

        assert.equal(manager.count, 3);

        manager.dispose();
        assert.equal(manager.count, 0);
    });

    it('should unregister actors when they get disposed of', assert => {
        const actor =
            manager.createActor({ modelId: 121, position: new Vector(0, 0, 0), rotation: 180 });

        assert.equal(manager.count, 1);

        actor.dispose();
        assert.equal(manager.count, 0);
    });

    it('should throw on disposing invalid actors', assert => {
        const actor =
            manager.createActor({ modelId: 121, position: new Vector(0, 0, 0), rotation: 180 });

        assert.equal(manager.count, 1);

        actor.dispose();
        assert.equal(manager.count, 0);

        assert.throws(() => actor.dispose());
        assert.throws(() => manager.didDisposeActor(actor));
    });
});
