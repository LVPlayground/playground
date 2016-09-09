// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const createTestEnvironment = require('features/houses/test/test_environment.js');

const HouseExtension = require('features/houses/house_extension.js');
const HouseSettings = require('features/houses/house_settings.js');
const MockLocation = require('features/location/test/mock_location.js');

describe('HouseEntranceController', (it, beforeEach) => {
    let friendsFeature = null;  // MockFriends
    let locationFeature = null;  // MockLocation

    let manager = null;  // HouseManager
    let controller = null;  // HouseEntranceController

    beforeEach(async(assert) => {
        ({ manager } = await createTestEnvironment());

        friendsFeature = server.featureManager.getFeatureForTests('friends');
        locationFeature = server.featureManager.getFeatureForTests('location');

        controller = manager.entranceController_;
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

        // (2) Russell can always access his own house.
        assert.isTrue(await controller.hasAccessToHouse(location, russell));

        // Access level: HouseSettings.ACCESS_EVERYBODY
        {
            location.settings.access = HouseSettings.ACCESS_EVERYBODY;

            assert.isTrue(await controller.hasAccessToHouse(location, gunther));
        }

        // Access level: HouseSettings.ACCESS_FRIENDS_AND_GANG
        {
            location.settings.access = HouseSettings.ACCESS_FRIENDS_AND_GANG;

            assert.isFalse(await controller.hasAccessToHouse(location, gunther));

            location.settings.ownerGangId = 1337;
            gunther.gangId = 1337;

            assert.isTrue(await controller.hasAccessToHouse(location, gunther));

            location.settings.ownerGangId = null;

            assert.isFalse(await controller.hasAccessToHouse(location, gunther));

            gunther.gangId = null;
        }

        // Access level: HouseSettings.ACCESS_FRIENDS
        {
            location.settings.access = HouseSettings.ACCESS_FRIENDS;

            assert.isFalse(await controller.hasAccessToHouse(location, gunther));
            friendsFeature.addFriend(russell, gunther);
            assert.isTrue(await controller.hasAccessToHouse(location, gunther));
            friendsFeature.removeFriend(russell, gunther);
            assert.isFalse(await controller.hasAccessToHouse(location, gunther));
        }

        // Access level: HouseSettings.ACCESS_PERSONAL
        {
            location.settings.access = HouseSettings.ACCESS_PERSONAL;

            assert.isFalse(await controller.hasAccessToHouse(location, gunther));

            // Being friends with the owner does not matter.
            friendsFeature.addFriend(russell, gunther);

            assert.isFalse(await controller.hasAccessToHouse(location, gunther));

            // Being in the same gang as the owner does not matter.
            location.settings.ownerGangId = 1337;
            gunther.gangId = 1337;

            assert.isFalse(await controller.hasAccessToHouse(location, gunther));
        }
    });

    it('should update house owner gang data when they join or leave a gang', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify({ userId: 42 });

        russell.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(russell);
        assert.isFalse(location.isAvailable());

        assert.equal(location.settings.ownerId, 42);
        assert.equal(location.settings.ownerGangId, null);

        controller.onUserJoinGang(russell.userId, 1501);

        assert.equal(location.settings.ownerGangId, 1501);

        controller.onUserLeaveGang(russell.userId, 1501);

        assert.equal(location.settings.ownerGangId, null);
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

    it('should inform extensions about players entering and leaving houses', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const currentLocation = await manager.findClosestLocation(gunther);
        assert.isFalse(currentLocation.isAvailable());

        let enteredHouse = false;
        let leftHouse = false;

        // Create an house extension that listens to the applicable events.
        class MyExtension extends HouseExtension {
            onPlayerEnterHouse(player, location) {
                assert.equal(player, gunther);
                assert.equal(location, currentLocation);

                enteredHouse = true;
            }

            onPlayerLeaveHouse(player, location) {
                assert.equal(player, gunther);
                assert.equal(location, currentLocation);

                leftHouse = true;
            }
        }

        manager.registerExtension(new MyExtension());

        assert.isFalse(enteredHouse);
        assert.isFalse(leftHouse);

        assert.doesNotThrow(() => controller.enterHouse(gunther, currentLocation));

        assert.isTrue(enteredHouse);
        assert.isFalse(leftHouse);

        assert.doesNotThrow(() => controller.exitHouse(gunther));

        assert.isTrue(enteredHouse);
        assert.isTrue(leftHouse);
    });
});
