// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockGameObject } from 'entities/test/mock_game_object.js';
import { ObjectManager } from 'entities/object_manager.js';

describe('ObjectManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = server.objectManager);

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
        manager = new ObjectManager(/* objectConstructor= */ MockGameObject);

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

    it('should enable a promisified object moving implementation', async (assert) => {
        const object = manager.createObject({
            modelId: 1225,
            position: new Vector(1, 1, 1),
            rotation: new Vector(2, 2, 2),
            interiorId: 7,
            virtualWorld: 42
        });

        const movePromise = object.moveTo(new Vector(100, 100, 100), 12);

        manager.onObjectMoved({
            objectid: object.id,
        });

        await movePromise;
    });

    it('should enable a promisified object editing implementation', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        const object = manager.createObject({
            modelId: 1225,
            position: new Vector(1, 1, 1),
            rotation: new Vector(2, 2, 2),
            interiorId: 7,
            virtualWorld: 42
        });

        // (1) Normal editing flow
        const normalEditPromise = object.edit(gunther);

        manager.onObjectEdited({
            objectid: object.id,
            playerid: gunther.id,
            response: 1,  // EDIT_RESPONSE_FINAL
            x: 10,
            y: 20,
            z: 30,
            rx: 5,
            ry: 15,
            rz: 25,
        });

        const normalResult = await normalEditPromise;

        assert.isNotNull(normalResult);
        assert.deepEqual(normalResult.position, new Vector(10, 20, 30));
        assert.deepEqual(normalResult.rotation, new Vector(5, 15, 25));

        // (2) Cancelled editing flow
        const cancelledEditPromise = object.edit(gunther);

        manager.onObjectEdited({
            objectid: object.id,
            playerid: gunther.id,
            response: 0,  // EDIT_RESPONSE_CANCEL
            x: 0,
            y: 0,
            z: 0,
            rx: 0,
            ry: 0,
            rz: 0,
        });

        const cancelledResult = await cancelledEditPromise;

        assert.isNull(cancelledResult);

        // (3) Disconnecting editing flow
        const disconnectingEditPromise = object.edit(gunther);

        gunther.disconnectForTesting();

        const disconnectingResult = await disconnectingEditPromise;

        assert.isNull(disconnectingResult);
    });
});
