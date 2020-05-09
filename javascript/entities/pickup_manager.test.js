// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PickupManager from 'entities/pickup_manager.js';
import MockPickup from 'entities/test/mock_pickup.js';

describe('PickupManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(() => manager = server.pickupManager);

    // Common observer that can be used for observing the PickupManager.
    class MyPickupObserver {
        constructor() {
            this.enteredCount = 0;
            this.leftCount = 0;
        }

        onPlayerEnterPickup(player, pickup) { ++this.enteredCount; }
        onPlayerLeavePickup(player, pickup) { ++this.leftCount; }
    }

    it('should enable creation of manager', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        assert.isNotNull(pickup);

        assert.equal(pickup.modelId, 1225);
        assert.deepEqual(pickup.position, new Vector(1, 2, 3));
    });

    it('should count the number of created manager, and dispose of them appropriately', assert => {
        manager.createPickup({ modelId: 1222, position: new Vector(1, 2, 3) });
        manager.createPickup({ modelId: 1225, position: new Vector(4, 5, 6) });
        manager.createPickup({ modelId: 1230, position: new Vector(7, 8, 9) });

        assert.equal(manager.count, 3);

        manager.dispose();

        assert.equal(manager.count, 0);
    });

    it('should unregister manager when they get disposed of', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });

        assert.equal(manager.count, 1);

        pickup.dispose();

        assert.equal(manager.count, 0);
    });

    it('should throw on disposing invalid manager', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });

        assert.equal(manager.count, 1);

        pickup.dispose();

        assert.equal(manager.count, 0);

        assert.throws(() => pickup.dispose());
        assert.throws(() => manager.didDisposePickup(pickup));
    });

    it('should allow observers to be registered', async(assert) => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const observer = new MyPickupObserver();

        // Add the observer twice to verify that it will only be added once.
        manager.addObserver(observer);
        manager.addObserver(observer);

        // Confirm that the event will only be called once.
        pickup.pickUpByPlayer(gunther);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);

        // Confirm that the player moving away will properly fire the left event after a while.
        gunther.position = new Vector(10, 20, 30);

        await server.clock.advance(10000 /* 10 seconds */);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 1);

        // Confirm that unregistering the observer will stop it from firing again.
        manager.removeObserver(observer);

        pickup.pickUpByPlayer(gunther);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 1);
    });

    it('should not fire entrance events multiple times when standing in a pickup', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const observer = new MyPickupObserver();
        manager.addObserver(observer);

        assert.equal(observer.enteredCount, 0);
        assert.equal(observer.leftCount, 0);

        for (let i = 0; i < 10; ++i)
            pickup.pickUpByPlayer(gunther);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);
    });

    it('should not fire the leave event when the player disconnects from LVP', async(assert) => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const observer = new MyPickupObserver();
        manager.addObserver(observer);

        pickup.pickUpByPlayer(gunther);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);

        gunther.disconnectForTesting();

        await server.clock.advance(10000 /* 10 seconds */);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);
    });

    it('should not fire the leave event when the pickup is destroyed', async(assert) => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.equal(manager.count, 1);

        const observer = new MyPickupObserver();
        manager.addObserver(observer);

        pickup.pickUpByPlayer(gunther);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);

        pickup.dispose();

        assert.equal(manager.count, 0);

        await server.clock.advance(10000 /* 10 seconds */);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);
    });

    it('should fire the leave event when the player moves to another pickup', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const pickup1 = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        const pickup2 = manager.createPickup({ modelId: 1225, position: new Vector(4, 5, 6) });

        const observer = new MyPickupObserver();
        manager.addObserver(observer);

        assert.equal(observer.enteredCount, 0);
        assert.equal(observer.leftCount, 0);

        pickup1.pickUpByPlayer(gunther);

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);

        pickup2.pickUpByPlayer(gunther);

        assert.equal(observer.enteredCount, 2);
        assert.equal(observer.leftCount, 1);

        await server.clock.advance(10000 /* 10 seconds */);

        assert.equal(observer.enteredCount, 2);
        assert.equal(observer.leftCount, 2);
    });

    it('should fire the leave event when the player moves away from the pickup', async(assert) => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(1, 2, 3) });
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const observer = new MyPickupObserver();
        manager.addObserver(observer);

        // Update Gunther's position to the pickup's position, this will make them enter it.
        gunther.position = pickup.position;

        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);

        await server.clock.advance(10000 /* 10 seconds */);

        // Gunther is still standing in the pickup, so nothing should have happened.
        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);

        gunther.position = new Vector(10, 20, 30);

        await server.clock.advance(10000 /* 10 seconds */);

        // Now Gunther has moved away from the pickup, so they have left it.
        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 1);
    });

    it('should fire the enter event when the player changes position', assert => {
        const pickup = manager.createPickup({ modelId: 1225, position: new Vector(100, 200, 300) });
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const observer = new MyPickupObserver();
        manager.addObserver(observer);

        assert.equal(observer.enteredCount, 0);
        assert.equal(observer.leftCount, 0);

        gunther.position = new Vector(100, 200, 0);

        // Gunther's new position is not in range of the pickup.
        assert.equal(observer.enteredCount, 0);
        assert.equal(observer.leftCount, 0);

        gunther.position = pickup.position;

        // Gunther is now in range of the pickup.
        assert.equal(observer.enteredCount, 1);
        assert.equal(observer.leftCount, 0);
    });

    it('should enable pickups to automagically respawn', async(assert) => {
        const pickup = manager.createPickup({
            modelId: 1225,
            position: new Vector(100, 200, 300),
            respawnDelay: 180
        });

        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isNotNull(pickup.id);
        assert.isTrue(pickup.isConnected());
        assert.isFalse(pickup.isRespawning());

        pickup.pickUpByPlayer(gunther);

        assert.isNull(pickup.id);
        assert.isTrue(pickup.isConnected());
        assert.isTrue(pickup.isRespawning());

        await server.clock.advance(180 * 1000);  // the respawn delay

        assert.isNotNull(pickup.id);
        assert.isTrue(pickup.isConnected());
        assert.isFalse(pickup.isRespawning());
    });
});
