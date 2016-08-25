// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Economy = require('features/economy/economy.js');
const HouseManager = require('features/houses/house_manager.js');
const MockFriends = require('features/friends/test/mock_friends.js');
const MockHouseDatabase = require('features/houses/test/mock_house_database.js');
const MockLocation = require('features/location/test/mock_location.js');

describe('HouseEntranceController', (it, beforeEach, afterEach) => {
    let friendsFeature = null;  // MockFriends
    let locationFeature = null;  // MockLocation

    let manager = null;  // HouseManager
    let controller = null;  // HouseEntranceController

    afterEach(() => manager.dispose());
    beforeEach(async(assert) => {
        friendsFeature = new MockFriends();
        locationFeature = new MockLocation();

        const friends = server.featureManager.wrapInstanceForDependency(friendsFeature);
        const economy = server.featureManager.wrapInstanceForDependency(new Economy());
        const location = server.featureManager.wrapInstanceForDependency(locationFeature);

        manager = new HouseManager(economy, friends, location);
        manager.database_ = new MockHouseDatabase();

        controller = manager.entranceController_;

        // All tests will depend on the basic house data to be available.
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);
    });

    it('should allow players to purchase their first house', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // This will trigger the onPlayerEnterPickup event in the HouseEntranceController.
        gunther.position = new Vector(200, 250, 300);

        const minimumPrice =
            controller.economy_().calculateHousePrice(gunther.position, 0 /* parkingLotCount */,
                                                      0 /* interiorValue */);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.HOUSE_PICKUP_CAN_PURCHASE, minimumPrice));
    });

    it('should not allow players who own a house to purchase another one', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        // Returning any non-empty array from getHousesForPlayer() will do the trick.
        manager.getHousesForPlayer = player => [true];

        // This will trigger the onPlayerEnterPickup event in the HouseEntranceController.
        gunther.position = new Vector(200, 250, 300);

        const minimumPrice =
            controller.economy_().calculateHousePrice(gunther.position, 0 /* parkingLotCount */,
                                                      0 /* interiorValue */);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.HOUSE_PICKUP_CANNOT_PURCHASE, minimumPrice))
    });

    it('should allow players en enter a house through its portal', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        assert.isNull(controller.getCurrentHouseForPlayer(gunther));

        // This corrosponds to the location of the entry portal of one of the houses.
        gunther.position = new Vector(500, 500, 500);

        let maxticks = 10;

        // Wait some ticks to make sure that the permission check has finished.
        while (!controller.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        assert.equal(gunther.interiorId, 5);
        assert.notEqual(gunther.virtualWorld, 0);

        assert.isNotNull(controller.getCurrentHouseForPlayer(gunther));
    });

    it('should recreate the portals when the location feature reloads', async(assert) => {
        let occupiedLocationCount = 0;

        for (const location of manager.locations) {
            if (!location.isAvailable())
                ++occupiedLocationCount;
        }

        assert.equal(locationFeature.portalCount, occupiedLocationCount);

        const reloadedLocationFeature = new MockLocation();

        // Fake a reload of the Location feature that normally would be done by the Feature Manager.
        controller.recreateLocationPortals(reloadedLocationFeature);

        assert.equal(reloadedLocationFeature.portalCount, occupiedLocationCount);
    });

    it('should be able to determine whether somebody got access to a house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(russell);
        assert.isFalse(location.isAvailable());
        assert.equal(location.settings.ownerId, 42);

        // (1) Unregistered players cannot access any house.
        assert.isFalse(await controller.hasAccessToHouse(location, gunther));
        assert.isFalse(await controller.hasAccessToHouse(location, russell));

        gunther.identify({ userId: 43 });
        russell.identify({ userId: 42 });

        // (2) Players can always access their own house.
        assert.isFalse(await controller.hasAccessToHouse(location, gunther));
        assert.isTrue(await controller.hasAccessToHouse(location, russell));

        friendsFeature.addFriend(russell, gunther);

        // (3) Friends of the owners can always access their house.
        assert.isTrue(await controller.hasAccessToHouse(location, gunther));
        assert.isTrue(await controller.hasAccessToHouse(location, russell));
    });

    it('should be able to force-enter and force-exit players from a house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.isNull(controller.getCurrentHouseForPlayer(gunther));
        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        assert.doesNotThrow(() => controller.enterHouse(gunther, location));

        const interiorData = location.interior.getData();

        assert.equal(controller.getCurrentHouseForPlayer(gunther), location);
        assert.equal(gunther.interiorId, interiorData.interior);
        assert.equal(gunther.virtualWorld, VirtualWorld.forHouse(location));

        assert.doesNotThrow(() => controller.exitHouse(gunther));

        assert.isNull(controller.getCurrentHouseForPlayer(gunther));
        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);
    });

    it('should force people out of houses when the location has been removed', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.doesNotThrow(() => controller.enterHouse(gunther, location));
        assert.equal(controller.getCurrentHouseForPlayer(gunther), location);

        assert.notEqual(gunther.interiorId, 0);
        assert.notEqual(gunther.virtualWorld, 0);

        // Remove the location from the entrance controller.
        controller.removeLocation(location);

        assert.isNull(controller.getCurrentHouseForPlayer(gunther));
        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);
    });

    it('should force people out of houses when the feature gets reloaded', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.doesNotThrow(() => controller.enterHouse(gunther, location));
        assert.equal(controller.getCurrentHouseForPlayer(gunther), location);

        assert.notEqual(gunther.interiorId, 0);
        assert.notEqual(gunther.virtualWorld, 0);

        // Dispose of the controller. This should force all people out of their houses.
        controller.dispose();

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        // Override the dispose() function since we can't dispose the controller twice.
        controller.dispose = () => true;
    });
});
