// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const createTestEnvironment = require('features/houses/test/test_environment.js');

// Zero-based index of the Pickup Settings menu in the `/house settings` options.
const SETTINGS_MENU_INDEX = 3;

describe('Pickups', (it, beforeEach) => {
    let gunther = null;
    let location = null;
    let manager = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        ({ manager } = await createTestEnvironment());

        // The `/house settings` command is only available when the player is in a house.
        manager.forceEnterHouse(
            gunther, await manager.findClosestLocation(gunther, { ignoreAvailable: true }));

        location = manager.getCurrentHouseForPlayer(gunther);

        assert.isNotNull(location);
        assert.isFalse(location.isAvailable());

        gunther.clearMessages();
    });

    it('should enable players to purchase and sell health pickups', async(assert) => {
        const originalPickupCount = server.pickupManager.count;

        assert.isFalse(location.interior.features.has('health'));

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Purchase a Health Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes pls */ })).then(
            () => gunther.respondToDialog({ response: 1 /* I got it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.interior.features.has('health'));

        assert.equal(server.pickupManager.count, originalPickupCount + 1);

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Delete a Health Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes pls */ })).then(
            () => gunther.respondToDialog({ response: 1 /* I got it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(location.interior.features.has('health'));

        assert.equal(server.pickupManager.count, originalPickupCount);
    });

    it('should enable players to purchase and sell armour pickups', async(assert) => {
        const originalPickupCount = server.pickupManager.count;

        assert.isFalse(location.interior.features.has('armour'));

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Purchase an Armour Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes pls */ })).then(
            () => gunther.respondToDialog({ response: 1 /* I got it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.interior.features.has('armour'));

        assert.equal(server.pickupManager.count, originalPickupCount + 1);

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Delete an Armour Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes pls */ })).then(
            () => gunther.respondToDialog({ response: 1 /* I got it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(location.interior.features.has('armour'));

        assert.equal(server.pickupManager.count, originalPickupCount);
    });

    it('should restore the health of the player when entering a health pickup', async(assert) => {
        let healthPickup = null;

        server.pickupManager.addObserver(new class {
            onPlayerEnterPickup(player, pickup) {
                assert.equal(player, gunther);

                healthPickup = pickup;
            }
        });

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Purchase a Health Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes pls */ })).then(
            () => gunther.respondToDialog({ response: 1 /* I got it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.interior.features.has('health'));
        assert.equal(gunther.messages.length, 0);

        gunther.health = 50;
        gunther.position = location.interior.features.get('health');

        assert.isNotNull(healthPickup);
        assert.equal(healthPickup.modelId, 1240);

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_PICKUP_HEALTH_RESTORED);

        assert.equal(gunther.health, 100);

        assert.isTrue(healthPickup.isRespawning());
    });

    it('should restore the armour of the player when entering a armour pickup', async(assert) => {
        let armourPickup = null;

        server.pickupManager.addObserver(new class {
            onPlayerEnterPickup(player, pickup) {
                assert.equal(player, gunther);

                armourPickup = pickup;
            }
        });

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Purchase an Armour Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes pls */ })).then(
            () => gunther.respondToDialog({ response: 1 /* I got it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.interior.features.has('armour'));
        assert.equal(gunther.messages.length, 0);

        gunther.armour = 50;
        gunther.position = location.interior.features.get('armour');

        assert.isNotNull(armourPickup);
        assert.equal(armourPickup.modelId, 1242);

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_PICKUP_ARMOUR_RESTORED);

        assert.equal(gunther.armour, 100);

        assert.isTrue(armourPickup.isRespawning());
    });

    it('should recreate all pickups when the streamer reloads', async(assert) => {
        const originalPickupCount = server.pickupManager.count;

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Purchase an Armour Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes pls */ })).then(
            () => gunther.respondToDialog({ response: 1 /* I got it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.interior.features.has('armour'));

        assert.equal(server.pickupManager.count, originalPickupCount + 1);

        server.featureManager.liveReload('streamer');

        assert.equal(server.pickupManager.count, originalPickupCount + 1);
    });
});
