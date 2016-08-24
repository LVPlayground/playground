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

return;  // disabled

    it('should be able to determine whether somebody got access to a house', async(assert) => {
        await manager.loadHousesFromDatabase();

        const gunther = server.playerManager.getById(0 /* Gunther */);

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(russell);
        assert.isFalse(location.isAvailable());
        assert.equal(location.settings.ownerId, 42);

        // (1) Unregistered players cannot access any house.
        assert.isFalse(await controller.hasAccessToHouse(gunther, location));
        assert.isFalse(await controller.hasAccessToHouse(russell, location));

        gunther.identify({ userId: 43 });
        russell.identify({ userId: 42 });

        // (2) Players can always access their own house.
        assert.isFalse(await controller.hasAccessToHouse(gunther, location));
        assert.isTrue(await controller.hasAccessToHouse(russell, location));

        friendsFeature.addFriend(russell, gunther);

        // (3) Friends of the owners can always access their house.
        assert.isTrue(await controller.hasAccessToHouse(gunther, location));
        assert.isTrue(await controller.hasAccessToHouse(russell, location));
    });
});
