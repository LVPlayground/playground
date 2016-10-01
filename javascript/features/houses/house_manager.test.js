// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const createTestEnvironment = require('features/houses/test/test_environment.js');

const HouseExtension = require('features/houses/house_extension.js');
const HouseSettings = require('features/houses/house_settings.js');

describe('HouseManager', (it, beforeEach) => {
    let manager = null;
    let streamer = null;

    beforeEach(async() => ({ manager, streamer } = await createTestEnvironment()));

    const validLocation = { facingAngle: 0, interiorId: 0, position: new Vector(50, 50, 10) };

    it('should be able to load the existing houses', async(assert) => {
        assert.isAbove(manager.locationCount, 0);

        let parkingLotCount = 0;

        for (const location of manager.locations)
            parkingLotCount += location.parkingLotCount;

        assert.isAbove(parkingLotCount, 0);

        let occupiedCount = 0;

        for (const location of manager.locations) {
            if (!location.isAvailable())
                occupiedCount++;
        }

        assert.isAbove(occupiedCount, 0);
        assert.isAbove(manager.vehicleController_.count, 0);
    });

    it('should be able to create new house locations', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const locationCount = manager.locationCount;

        gunther.identify();

        await manager.createLocation(gunther, validLocation);

        assert.equal(manager.locationCount, locationCount + 1);
    });

    it('should be able to find the closest house to a player', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(200, 200, 300);

        assert.isAbove(manager.locationCount, 0);

        const closestLocation = await manager.findClosestLocation(gunther);
        assert.isNotNull(closestLocation);

        assert.equal(gunther.position.distanceTo(closestLocation.position), 50);
    });

    it('should be able to limit searches to find the closest house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(200, 200, 300);

        assert.isAbove(manager.locationCount, 0);

        const closestLocation =
            await manager.findClosestLocation(gunther, { maximumDistance: 40 });
        assert.isNull(closestLocation);
    });

    it('should be able to remove existing house locations', async(assert) => {
        const locationCount = manager.locationCount;

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        await manager.createLocation(gunther, validLocation);
        assert.equal(manager.locationCount, locationCount + 1);

        const locations = Array.from(manager.locations_);
        assert.equal(locations.length, manager.locationCount);

        const location = locations[0];

        await manager.removeLocation(location);

        assert.equal(manager.locationCount, locationCount);
    });

    it('should be able to create and remove parking lot locations', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        const location = await manager.findClosestLocation(gunther);
        assert.isNotNull(location);

        assert.equal(location.parkingLotCount, 0);

        await manager.createLocationParkingLot(gunther, location, {
            position: new Vector(500, 500, 100),
            rotation: 90,
            interiorId: 0
        });

        assert.equal(location.parkingLotCount, 1);

        const parkingLot = Array.from(location.parkingLots)[0];

        assert.isAbove(parkingLot.id, 0);
        assert.deepEqual(parkingLot.position, new Vector(500, 500, 100));
        assert.equal(parkingLot.rotation, 90);

        await manager.removeLocationParkingLot(location, parkingLot);

        assert.equal(location.parkingLotCount, 0);
    });

    it('should be able to create houses given a location', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        const location = await manager.findClosestLocation(gunther);
        assert.isTrue(location.isAvailable());
        assert.isFalse(manager.entranceController_.isLocationPickupOccupiedForTesting(location));

        await manager.createHouse(gunther, location, 1 /* interiorId */);

        assert.isFalse(location.isAvailable());
        assert.isTrue(manager.entranceController_.isLocationPickupOccupiedForTesting(location));

        assert.equal(location.settings.name, gunther.name + '\'s house');

        assert.equal(location.settings.ownerId, gunther.userId);
        assert.equal(location.settings.ownerName, gunther.name);

        assert.equal(location.interior.interiorId, 1 /* interiorId */);
        assert.isTrue(location.interior.getData().hasOwnProperty('name'));
    });

    it('should be able to remove houses from a given location', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);
        gunther.identify();

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());
        assert.isTrue(manager.entranceController_.isLocationPickupOccupiedForTesting(location));

        await manager.removeHouse(location);

        assert.isTrue(location.isAvailable());
        assert.isFalse(manager.entranceController_.isLocationPickupOccupiedForTesting(location));

        assert.isNull(location.settings);
        assert.isNull(location.interior);
    });

    it('should be able to tell which house a player is in', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        // Teleport Gunther to the entrance of his house, making him enter it.
        gunther.position = new Vector(500, 500, 500);

        let maxticks = 10;

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        assert.isNotNull(manager.getCurrentHouseForPlayer(gunther));
    });

    it('should be able to update the access level of a house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.equal(location.settings.access, HouseSettings.ACCESS_FRIENDS);

        await manager.updateHouseSetting(location, 'access', HouseSettings.ACCESS_EVERYBODY);

        assert.equal(location.settings.access, HouseSettings.ACCESS_EVERYBODY);
    });

    it('should be able to update the marker color of a house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.equal(location.settings.markerColor, 'yellow');

        await manager.updateHouseSetting(location, 'marker', 'green');

        assert.equal(location.settings.markerColor, 'green');
    });

    it('should be able to update the name of a house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.equal(location.settings.name, 'Guntherplaza');

        await manager.updateHouseSetting(location, 'name', 'Gunther Pro Palace');

        assert.equal(location.settings.name, 'Gunther Pro Palace');
    });

    it('should be able to update whether to spawn at a house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.isFalse(location.settings.isSpawn());

        await manager.updateHouseSetting(location, 'spawn', true);

        assert.isTrue(location.settings.isSpawn());

        await manager.updateHouseSetting(location, 'spawn', false);

        assert.isFalse(location.settings.isSpawn());
    });

    it('should be possible to update the welcome message for a house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.equal(location.settings.welcomeMessage, '');

        await manager.updateHouseSetting(location, 'welcome', 'hello, world!');

        assert.equal(location.settings.welcomeMessage, 'hello, world!');

        await manager.updateHouseSetting(location, 'welcome', '');

        assert.equal(location.settings.welcomeMessage, '');
    });

    it('should be able to create and remove vehicles for a house', async(assert) => {
        const serverVehicleCount = server.vehicleManager.count;

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.equal(location.parkingLotCount, 2);

        const parkingLot = Array.from(location.parkingLots)[1];
        assert.isNotNull(parkingLot);

        assert.isFalse(location.settings.vehicles.has(parkingLot));

        await manager.createVehicle(location, parkingLot, {
            modelId: 520 /* Infernus */
        });

        assert.isTrue(location.settings.vehicles.has(parkingLot));
        assert.equal(server.vehicleManager.count, serverVehicleCount + 1);

        const vehicle = location.settings.vehicles.get(parkingLot);

        assert.equal(vehicle.modelId, 520 /* Infernus */);
        assert.equal(vehicle.parkingLot, parkingLot);

        await manager.removeVehicle(location, parkingLot, vehicle);

        assert.isFalse(location.settings.vehicles.has(parkingLot));
        assert.equal(server.vehicleManager.count, serverVehicleCount);
    });

    it('should remove associated vehicles when removing the house', async(assert) => {
        const vehicleStreamer = streamer.getVehicleStreamer();
        const originalVehicleStreamerSize = vehicleStreamer.size;

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.position = new Vector(500, 500, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        assert.equal(location.parkingLotCount, 2);
        assert.equal(location.settings.vehicles.size, 1);

        await manager.removeHouse(location);

        assert.equal(vehicleStreamer.size, originalVehicleStreamerSize - 1);
    });

    it('should handle house extension instances in a sensible way', async(assert) => {
        let invocationCount = 0;

        class MyExtension extends HouseExtension {
            onQuackForTests() {
                invocationCount++;
            }
        }

        const extension = new MyExtension();

        manager.registerExtension(extension);

        assert.equal(invocationCount, 0);

        manager.invokeExtensions('onQuackForTests');
        assert.equal(invocationCount, 1);

        manager.registerExtension(extension);
        manager.registerExtension(extension);
        manager.registerExtension(extension);

        manager.invokeExtensions('onQuackForTests');
        assert.equal(invocationCount, 2);

        manager.removeExtension(extension);

        manager.invokeExtensions('onQuackForTests');
        assert.equal(invocationCount, 2);
    });

    it('should inform house extensions when houses are created and destroyed', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 5000 });

        let locationCreatedCalls = 0;
        let locationRemovedCalls = 0;

        let houseCreatedCalls = 0;
        let houseRemovedCalls = 0;

        // Create an house extension that listens to the applicable events.
        class MyExtension extends HouseExtension {
            onLocationCreated(location) {
                locationCreatedCalls++;
            }

            onHouseCreated(location) {
                houseCreatedCalls++;
            }

            onHouseRemoved(location) {
                houseRemovedCalls++;
            }

            onLocationRemoved(location) {
                locationRemovedCalls++;
            }
        }

        manager.registerExtension(new MyExtension());

        assert.equal(locationCreatedCalls, 0);
        assert.equal(locationRemovedCalls, 0);
        assert.equal(houseCreatedCalls, 0);
        assert.equal(houseRemovedCalls, 0);

        await manager.createLocation(gunther, validLocation);

        assert.equal(locationCreatedCalls, 1);
        assert.equal(locationRemovedCalls, 0);
        assert.equal(houseCreatedCalls, 0);
        assert.equal(houseRemovedCalls, 0);

        const location = await manager.findClosestLocation(gunther);

        await manager.createHouse(gunther, location, 1 /* interiorId */);

        assert.equal(locationCreatedCalls, 1);
        assert.equal(locationRemovedCalls, 0);
        assert.equal(houseCreatedCalls, 1);
        assert.equal(houseRemovedCalls, 0);

        await manager.removeHouse(location);

        assert.equal(locationCreatedCalls, 1);
        assert.equal(locationRemovedCalls, 0);
        assert.equal(houseCreatedCalls, 1);
        assert.equal(houseRemovedCalls, 1);

        await manager.removeLocation(location);

        assert.equal(locationCreatedCalls, 1);
        assert.equal(locationRemovedCalls, 1);
        assert.equal(houseCreatedCalls, 1);
        assert.equal(houseRemovedCalls, 1);
    });
});
