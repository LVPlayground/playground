// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockGameObject } from 'entities/test/mock_game_object.js';
import ObjectManager from 'entities/object_manager.js';

describe('ObjectManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new ObjectManager(MockGameObject /* objectConstructor */));
    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should maintain a count of the number of created objects', assert => {
        const position = new Vector(0, 0, 0);
        const rotation = new Vector(0, 0, 0);

        assert.equal(manager.count, 0);

        for (let i = 0; i < 10; ++i)
            manager.createObject({ modelId: 1225, position, rotation });

        assert.equal(manager.count, 10);
    });

    it('should release references when an object gets disposed of', assert => {
        const object = manager.createObject({ modelId: 1225, position: new Vector(0, 0, 0),
                                              rotation: new Vector(0, 0, 0) });

        assert.isTrue(object.isConnected());
        assert.equal(manager.count, 1);

        object.dispose();

        assert.isFalse(object.isConnected());
        assert.equal(manager.count, 0);
    });

    it('should dispose of all objects when the manager gets disposed of', assert => {
        const object = manager.createObject({ modelId: 1225, position: new Vector(0, 0, 0),
                                              rotation: new Vector(0, 0, 0) });

        assert.isTrue(object.isConnected());
        assert.equal(manager.count, 1);

        manager.dispose();
        manager = null;

        assert.isFalse(object.isConnected());
    });

    it('should create objects with the given settings', assert => {
        const object = manager.createObject({
            modelId: 1225,
            position: new Vector(1, 1, 1),
            rotation: new Vector(2, 2, 2),
            interiorId: 7,
            virtualWorld: 42
        });

        assert.isNotNull(object.id);
        assert.equal(object.modelId, 1225);
        assert.deepEqual(object.position, new Vector(1, 1, 1));
        assert.deepEqual(object.rotation, new Vector(2, 2, 2));
        assert.equal(object.drawDistance, 0);
        assert.equal(object.streamDistance, 300);
        assert.equal(object.virtualWorlds[0], 42);
        assert.equal(object.interiors[0], 7);

        const defaultObject = manager.createObject({ modelId: 1225, position: new Vector(0, 0, 0),
                                                     rotation: new Vector(0, 0, 0) });

        assert.equal(defaultObject.virtualWorlds[0], -1);
        assert.equal(defaultObject.interiors[0], -1);
    });
});
