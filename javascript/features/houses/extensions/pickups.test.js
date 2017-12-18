// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import createTestEnvironment from 'features/houses/test/test_environment.js';

import PlayerMoneyBridge from 'features/houses/utils/player_money_bridge.js';

// Zero-based index of the Pickup Settings menu in the `/house settings` options.
const SETTINGS_MENU_INDEX = 3;

describe('Pickups', (it, beforeEach, afterEach) => {
    let gunther = null;
    let location = null;
    let manager = null;
    let russell = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        russell = server.playerManager.getById(1 /* Russell */);
        russell.identify({ userId: 12356 });

        // Give Gunther 25 million dollars to spend on house pickups.
        PlayerMoneyBridge.setMockedBalanceForTests(25000000);

        ({ manager } = await createTestEnvironment());

        // The `/house settings` command is only available when the player is in a house.
        manager.forceEnterHouse(
            gunther, await manager.findClosestLocation(gunther, { ignoreAvailable: true }));

        location = manager.getCurrentHouseForPlayer(gunther);

        assert.isNotNull(location);
        assert.isFalse(location.isAvailable());

        assert.isNotNull(location.settings.owner);
        assert.equal(location.settings.owner, gunther);

        gunther.clearMessages();
    });

    afterEach(() => PlayerMoneyBridge.setMockedBalanceForTests(null));

    it('should not enable pickups purchases if they have insufficient balance', async(assert) => {
        PlayerMoneyBridge.setMockedBalanceForTests(0 /* no more monies */);

        assert.isFalse(location.interior.features.has('health'));

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Purchase a Health Pickup */ })).then(
            () => gunther.respondToDialog({ response: 1 /* How much money do I need?!! */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(location.interior.features.has('health'));
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

        assert.equal(gunther.health, 100);
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_PICKUP_HEALTH_RESTORED_SELF);

        assert.isTrue(healthPickup.isRespawning());
        assert.isTrue(healthPickup.isConnected());

        gunther.clearMessages();

        await server.clock.advance(3 * 60 * 1000);  // the respawn delay of the pickups

        assert.isFalse(healthPickup.isRespawning());
        assert.isTrue(healthPickup.isConnected());

        russell.health = 50;
        russell.position = location.interior.features.get('health');

        assert.equal(russell.health, 100);
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
                     Message.format(Message.HOUSE_PICKUP_HEALTH_RESTORED, gunther.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.HOUSE_PICKUP_HEALTH_USED, russell.name, russell.id));

        assert.isTrue(healthPickup.isRespawning());
        assert.isTrue(healthPickup.isConnected());
    });

    it('should restore the armour of the player when entering a armour pickup', async(assert) => {
        let armourPickup = null;

        server.pickupManager.addObserver(new class {
            onPlayerEnterPickup(player, pickup) {
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

        assert.equal(gunther.armour, 100);
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_PICKUP_ARMOUR_RESTORED_SELF);

        assert.isTrue(armourPickup.isRespawning());
        assert.isTrue(armourPickup.isConnected());

        gunther.clearMessages();

        await server.clock.advance(3 * 60 * 1000);  // the respawn delay of the pickups

        assert.isFalse(armourPickup.isRespawning());
        assert.isTrue(armourPickup.isConnected());

        russell.armour = 50;
        russell.position = location.interior.features.get('armour');

        assert.equal(russell.armour, 100);
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
                     Message.format(Message.HOUSE_PICKUP_ARMOUR_RESTORED, gunther.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.HOUSE_PICKUP_ARMOUR_USED, russell.name, russell.id));

        assert.isTrue(armourPickup.isRespawning());
        assert.isTrue(armourPickup.isConnected());
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

        assert.isTrue(await server.featureManager.liveReload('streamer'));

        assert.equal(server.pickupManager.count, originalPickupCount + 1);
    });
});
