// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PickupStreamer from 'features/streamer/pickup_streamer.js';
import StoredPickup from 'features/streamer/stored_pickup.js';

describe('PickupStreamer', it => {
    function createStoredPickup({ position, respawnDelay = -1, enterFn = null,
                                  leaveFn = null } = {}) {
        return new StoredPickup({
            modelId: 1242 /* armour */,
            type: Pickup.TYPE_PERSISTENT,
            virtualWorld: -1,

            position, respawnDelay, enterFn, leaveFn
        });
    }

    it('should create the appropriate vehicle on the server', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(2000, 2000, 2000);

        const originalPickupCount = server.pickupManager.count;

        const streamer = new PickupStreamer();
        const storedPickup = createStoredPickup({ position: new Vector(1000, 1000, 1000) });

        assert.doesNotThrow(() => streamer.add(storedPickup));
        assert.isNull(storedPickup.liveEntity);

        gunther.position = storedPickup.position.translate({ z: 2 });
        await streamer.stream();

        assert.isNotNull(storedPickup.liveEntity);
        assert.equal(server.pickupManager.count, originalPickupCount + 1);

        const pickup = storedPickup.liveEntity;
        assert.isTrue(pickup.isConnected());

        assert.equal(pickup.modelId, storedPickup.modelId);
        assert.equal(pickup.position, storedPickup.position);
        assert.equal(pickup.type, storedPickup.type);
        assert.equal(pickup.virtualWorld, storedPickup.virtualWorld);

        streamer.dispose();

        assert.equal(server.pickupManager.count, originalPickupCount);
        assert.isFalse(pickup.isConnected());
    });

    it('should fire the appropriate events when player interact with pickups', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(2000, 2000, 2000);

        let enterCount = 0;
        let leaveCount = 0;

        const streamer = new PickupStreamer();
        const storedPickup = createStoredPickup({
            position: new Vector(2010, 2010, 2010),
            enterFn: (player, pickup) => {
                assert.equal(player, gunther);
                assert.equal(pickup, storedPickup.liveEntity);

                ++enterCount;
            },

            leaveFn: (player, pickup) => {
                assert.equal(player, gunther);
                assert.equal(pickup, storedPickup.liveEntity);

                ++leaveCount;
            }
        });

        assert.doesNotThrow(() => streamer.add(storedPickup));
        assert.isNotNull(storedPickup.liveEntity);

        assert.equal(enterCount, 0);
        assert.equal(leaveCount, 0);

        gunther.position = storedPickup.position;

        assert.equal(enterCount, 1);
        assert.equal(leaveCount, 0);

        gunther.position = storedPickup.position.translate({ x: 10, y: 10 });

        await server.clock.advance(1000);  // pickup update frequency

        assert.equal(enterCount, 1);
        assert.equal(leaveCount, 1);
    });

    it('should honor pickup respawn delays', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(2000, 2000, 2000);

        const streamer = new PickupStreamer();
        const storedPickup = createStoredPickup({
            position: new Vector(2010, 2010, 2010),
            respawnDelay: 180
        });

        assert.doesNotThrow(() => streamer.add(storedPickup));
        assert.isNotNull(storedPickup.liveEntity);

        const pickup = storedPickup.liveEntity;

        assert.isNotNull(pickup.id);
        assert.isTrue(pickup.isConnected());
        assert.isFalse(pickup.isRespawning());

        pickup.pickUpByPlayer(gunther);

        assert.isNull(pickup.id);
        assert.isTrue(pickup.isConnected());
        assert.isTrue(pickup.isRespawning());

        await server.clock.advance(180 * 1000);  // 3 minutes

        assert.isNotNull(pickup.id);
        assert.isTrue(pickup.isConnected());
        assert.isFalse(pickup.isRespawning());
    });
});
