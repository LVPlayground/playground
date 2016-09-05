// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Economy = require('features/economy/economy.js');
const HouseCommands = require('features/houses/house_commands.js');
const HouseManager = require('features/houses/house_manager.js');
const HouseSettings = require('features/houses/house_settings.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockFriends = require('features/friends/test/mock_friends.js');
const MockGangs = require('features/gangs/test/mock_gangs.js');
const MockHouseDatabase = require('features/houses/test/mock_house_database.js');
const MockLocation = require('features/location/test/mock_location.js');
const MockPlayground = require('features/playground/test/mock_playground.js');
const ParkingLotCreator = require('features/houses/utils/parking_lot_creator.js');
const PlayerMoneyBridge = require('features/houses/utils/player_money_bridge.js');

describe('HouseCommands', (it, beforeEach, afterEach) => {
    let access = null;
    let commands = null;
    let location = null;
    let manager = null;
    let maxticks = null;

    beforeEach(assert => {
        const announce = server.featureManager.wrapInstanceForDependency(new MockAnnounce());
        const friends = server.featureManager.wrapInstanceForDependency(new MockFriends());
        const gangs = server.featureManager.wrapInstanceForDependency(new MockGangs());
        const economy = server.featureManager.wrapInstanceForDependency(new Economy());
        const playground = server.featureManager.wrapInstanceForDependency(new MockPlayground());

        location = server.featureManager.wrapInstanceForDependency(new MockLocation());

        access = playground().access;

        manager = new HouseManager(economy, friends, gangs, location);
        manager.database_ = new MockHouseDatabase();

        commands = new HouseCommands(manager, announce, economy, location, playground);

        // Reducing the command's requirement to players is only necessary until we ship.
        assert.equal(access.getCommandLevel('house'), Player.LEVEL_ADMINISTRATOR);
        access.setCommandLevel('house', Player.LEVEL_PLAYER);

        maxticks = 10;
    });

    afterEach(() => {
        if (commands)
            commands.dispose();

        manager.dispose();
    });

    it('should allow for creation of house locations', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        gunther.respondToDialog({ response: 1 /* Yes, confirm creation of the house */ });

        assert.equal(manager.locationCount, 0);

        assert.isTrue(await gunther.issueCommand('/house create'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(
            gunther.messages[0].includes(
                Message.format(Message.HOUSE_ANNOUNCE_CREATED, gunther.name, gunther.id)));

        assert.equal(manager.locationCount, 1);
    });

    it('should prevent houses from being created in residential exclusion zones', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(2000, 1567, 15);  // on the pirate ship

        gunther.respondToDialog({ response: 1 /* Accept that the house cannot be created */ });

        assert.isTrue(await gunther.issueCommand('/house create'));

        assert.equal(gunther.messages.length, 0);
        assert.equal(gunther.lastDialog, Message.HOUSE_CREATE_RESIDENTIAL_EXCLUSION_ZONE);
    });

    it('should enable management members to override such restrictions', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;
        gunther.position = new Vector(2000, 1567, 15);  // on the pirate ship

        gunther.respondToDialog({ response: 0 /* Override the location restrictions */ }).then(
            () => gunther.respondToDialog({ response: 1 /* yes */})).then(
            () => gunther.respondToDialog({ response: 1 /* yes */}));

        assert.isTrue(await gunther.issueCommand('/house create'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(manager.locationCount, 1);
    });

    it('should issue an error when trying to modify a non-existing house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(await gunther.issueCommand('/house modify'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_MODIFY_NONE_NEAR);
    });

    it('should display an identity beam when modifying a nearby house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const objectCount = server.objectManager.count;

        await manager.loadHousesFromDatabase();

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest location

        assert.isTrue(gunther.issueCommand('/house modify'));
        await manager.findClosestLocation(gunther);

        assert.equal(gunther.messages.length, 0);

        assert.equal(server.objectManager.count, objectCount + 2);

        await server.clock.advance(180000);  // forward the clock to test the auto-expire function

        assert.equal(server.objectManager.count, objectCount);
    });

    it('should enable administrators to remove house locations', async(assert) => {
        await manager.loadHousesFromDatabase();

        const gunther = server.playerManager.getById(0 /* Gunther */);
        const locationCount = manager.locationCount;
        
        assert.isAbove(locationCount, 0);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest location

        gunther.respondToDialog({ listitem: 2 /* Delete the location */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Yes, really get rid of it */ }));

        assert.isTrue(await gunther.issueCommand('/house modify'));

        assert.equal(manager.locationCount, locationCount - 1);
    });

    it('should enable administrators to conveniently evict the current owner', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        const locationCount = manager.locationCount;

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(505, 505, 500);

        const location = await manager.findClosestLocation(gunther);
        assert.isFalse(location.isAvailable());

        gunther.respondToDialog({ listitem: 2 /* Evict the current owner */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Yes, I really want to */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house modify'));

        assert.isTrue(location.isAvailable());

        assert.equal(manager.locationCount, locationCount);
    });

    it('should enable administrators to add a parking lot', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest location

        gunther.respondToDialog({ listitem: 0 /* Add a parking lot */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        const location = await manager.findClosestLocation(gunther);
        assert.equal(location.parkingLotCount, 0);

        const commandPromise = gunther.issueCommand('/house modify');

        // Extend the ParkingLotCreator class so that we can fake the Gunther being in a vehicle.
        commands.parkingLotCreator_ = new class extends ParkingLotCreator {
            getCurrentVehiclePosition(player) {
                return location.position.translate({ x: 10, y: 10 });
            }
            getCurrentVehicleRotation(player) {
                return 90;
            }
        };

        while (!commands.parkingLotCreator_.isSelecting(gunther))
            await Promise.resolve();

        commands.parkingLotCreator_.confirmSelection(gunther);

        assert.isTrue(await commandPromise);

        assert.equal(location.parkingLotCount, 1);

        const parkingLot = Array.from(location.parkingLots)[0];
        assert.isAbove(parkingLot.id, 0);
        assert.deepEqual(parkingLot.position, location.position.translate({ x: 10, y: 10 }));
        assert.equal(parkingLot.rotation, 90);
    });

    it('should cancel adding a parking lot when using `/house cancel`', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest location

        gunther.respondToDialog({ listitem: 0 /* Add a parking lot */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        const commandPromise = gunther.issueCommand('/house modify');

        while (!commands.parkingLotCreator_.isSelecting(gunther))
            await Promise.resolve();

        assert.isTrue(await gunther.issueCommand('/house cancel'));
        assert.isTrue(await commandPromise);
    });

    it('should fail when trying to remove parking lots when there are none', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest location

        gunther.respondToDialog({ listitem: 1 /* Remove a parking lot */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house modify'));
        assert.isFalse(commands.parkingLotRemover_.isSelecting(gunther));
    });

    it('should be able to remove parking lots from a location', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest location

        const location = await manager.findClosestLocation(gunther);
        assert.equal(location.parkingLotCount, 0);

        // Create a faked parking lot for this location so that it can be removed.
        await manager.createLocationParkingLot(gunther, location, {
            position: location.position.translate({ x: 10 }),
            rotation: 90,
            interiorId: 0
        });

        assert.equal(location.parkingLotCount, 1);

        gunther.respondToDialog({ listitem: 1 /* Remove a parking lot */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        const commandPromise = gunther.issueCommand('/house modify');

        while (!commands.parkingLotRemover_.isSelecting(gunther))
            await Promise.resolve();

        assert.isTrue(await gunther.issueCommand('/house remove 0'));
        assert.isTrue(await commandPromise);

        assert.equal(location.parkingLotCount, 0);
    });

    it('should cancel removing a parking lot when using `/house cancel`', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest location

        const location = await manager.findClosestLocation(gunther);

        await manager.createLocationParkingLot(gunther, location, {
            position: new Vector(220, 250, 300),
            rotation: 90,
            interiorId: 0
        });

        assert.equal(location.parkingLotCount, 1);

        gunther.respondToDialog({ listitem: 1 /* Remove a parking lot */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        const commandPromise = gunther.issueCommand('/house modify');

        while (!commands.parkingLotRemover_.isSelecting(gunther))
            await Promise.resolve();

        assert.isTrue(await gunther.issueCommand('/house cancel'));
        assert.isTrue(await commandPromise);

        assert.equal(location.parkingLotCount, 1);
    });

    it('should not allow buying a house when the player is not standing in one', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify();

        assert.isTrue(await gunther.issueCommand('/house buy'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_BUY_NO_LOCATION);

        assert.isTrue((await manager.findClosestLocation(gunther)).isAvailable());
    });

    it('should not allow buying a house when the player already has one', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify();
        gunther.position = new Vector(200, 250, 300);  // on the nearest location pickup

        const maximumHouseCount = manager.getMaximumHouseCountForPlayer(gunther);

        manager.getHousesForPlayer = player => new Array(maximumHouseCount);

        assert.isTrue(await gunther.issueCommand('/house buy'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[1], Message.HOUSE_BUY_NO_MULTIPLE);

        assert.isTrue((await manager.findClosestLocation(gunther)).isAvailable());
    });

    it('should not allow buying a house when the balance is not sufficient', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.identify({ userId: 501 });
        gunther.position = new Vector(200, 250, 300);  // on the nearest location pickup

        assert.isTrue(await gunther.issueCommand('/house buy'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[1], Message.format(Message.HOUSE_BUY_NOT_ENOUGH_MONEY, 50000))

        assert.isTrue((await manager.findClosestLocation(gunther)).isAvailable());
    });

    it('should allow buying a house when all the stars finally align', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 501 });

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        gunther.position = new Vector(200, 250, 300);  // on the nearest location pickup

        PlayerMoneyBridge.setMockedBalanceForTests(100000);

        gunther.respondToDialog({ response: 0 /* Yes, I get it */ });

        assert.isTrue(await gunther.issueCommand('/house buy'));

        assert.equal(gunther.messages.length, 1);

        assert.isFalse((await manager.findClosestLocation(gunther)).isAvailable());
        assert.equal(await PlayerMoneyBridge.getBalanceForPlayer(gunther), 50000);

        PlayerMoneyBridge.setMockedBalanceForTests(null);
    });

    it('should not allow `/house goto` to be used by unregistered players', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/house goto'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_GOTO_UNREGISTERED);
    });

    it('should display a warning if the player does not own any houses', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 1338 });

        assert.isTrue(await gunther.issueCommand('/house goto'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_GOTO_NONE_FOUND);
    });

    it('should immediately list houses owned by the player', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        await manager.loadHousesFromDatabase();

        const houses = manager.getHousesForPlayer(gunther);
        assert.equal(houses.length, 1);

        // Select the first house from the list.
        gunther.respondToDialog({ listitem: 0 /* Select the first house owned by Gunther */ });

        assert.isTrue(await gunther.issueCommand('/house goto'));
        assert.equal(gunther.messages.length, 0);

        assert.equal(manager.getCurrentHouseForPlayer(gunther), houses[0]);
        assert.notEqual(gunther.virtualWorld, server.virtualWorldManager.mainWorld);
    });

    it('should not enable players to teleport when they might abuse it', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        await manager.loadHousesFromDatabase();

        location().toggleInteriorAbuser(gunther, true);

        assert.isTrue(await gunther.issueCommand('/house goto'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_GOTO_TELEPORT_BLOCKED)
    });

    it('should enable administrators to list houses owned by another player', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify({ userId: 1338 });
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await manager.loadHousesFromDatabase();

        const houses = manager.getHousesForUser(42 /* Gunther */);
        assert.equal(houses.length, 1);

        // (1) Try to get the houses owned by |gunther| before he has logged in.
        assert.isTrue(await russell.issueCommand('/house goto ' + gunther.id));
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.HOUSE_GOTO_NONE_FOUND);

        gunther.identify({ userId: 42 });
        russell.clearMessages();

        // (2) Try to get the houses owned by |gunther| now that he has logged in.
        gunther.respondToDialog({ listitem: 0 /* first owned house */ });

        assert.isTrue(await gunther.issueCommand('/house goto ' + gunther.id));
        assert.equal(gunther.messages.length, 0);

        assert.equal(manager.getCurrentHouseForPlayer(gunther), houses[0]);
        assert.notEqual(gunther.virtualWorld, server.virtualWorldManager.mainWorld);
    });

    it('should display an overview of existing houses to administrators', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify({ userId: 1338 });
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await manager.loadHousesFromDatabase();

        const houses = manager.getHousesForUser(42 /* Gunther */);
        assert.equal(houses.length, 1);

        // Select Gunther from the list of house owners (he's not logged in), then teleport to the
        // first house listed in the subsequent dialog.
        russell.respondToDialog({ listitem: 0 /* Gunther's houses */ }).then(
            () => russell.respondToDialog({ listitem: 0 /* first owned house */ }));

        assert.isTrue(await russell.issueCommand('/house goto'));
        assert.equal(russell.messages.length, 0);

        assert.equal(manager.getCurrentHouseForPlayer(russell), houses[0]);
        assert.notEqual(russell.virtualWorld, server.virtualWorldManager.mainWorld);
    });

    it('should be possible to filter owned houses by name', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify({ userId: 1338 });
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await manager.loadHousesFromDatabase();

        const houses = manager.getHousesForUser(42 /* Gunther */);
        assert.equal(houses.length, 1);

        // (1) Filtering by a non-existing owner's name should yield an error message.
        assert.isTrue(await russell.issueCommand('/house goto TEF'));
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.HOUSE_GOTO_INVALID_FILTER, 'TEF'));

        russell.clearMessages();

        // (2) Filtering by an existing owner's name yielding one result should fast-track.
        russell.respondToDialog({ listitem: 0 /* first owned house */ });

        assert.isTrue(await russell.issueCommand('/house goto UNTHE'));  /* Gunther */
        assert.equal(russell.messages.length, 0);

        assert.equal(manager.getCurrentHouseForPlayer(russell), houses[0]);
        assert.notEqual(russell.virtualWorld, server.virtualWorldManager.mainWorld);
    });

    it('should do the necessary checks when changing house settings', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_SETTINGS_OUTSIDE);

        gunther.clearMessages();
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        assert.isNotNull(manager.getCurrentHouseForPlayer(gunther));

        gunther.clearMessages();

        // Change the owner of the house to another player.
        manager.getCurrentHouseForPlayer(gunther).settings.ownerId_ = 5000;

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_SETTINGS_NOT_OWNER);
    });

    it('should allow house name to be updated', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        const location = manager.getCurrentHouseForPlayer(gunther);
        assert.isNotNull(location);

        assert.isFalse(location.isAvailable());
        assert.equal(location.settings.name, 'Guntherplaza');

        gunther.respondToDialog({ listitem: 0 /* Change the house's name */}).then(
            () => gunther.respondToDialog({ inputtext: 'Gunther Pro Palace' })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(location.settings.name, 'Gunther Pro Palace');
    });

    it('should allow house access levels to be updated', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        const location = manager.getCurrentHouseForPlayer(gunther);
        assert.isNotNull(location);

        assert.isFalse(location.isAvailable());
        assert.equal(location.settings.access, HouseSettings.ACCESS_FRIENDS);

        gunther.respondToDialog({ listitem: 1 /* Change the house's access level */}).then(
            () => gunther.respondToDialog({ listitem: 0 /* Everybody */  })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(location.settings.access, HouseSettings.ACCESS_EVERYBODY);
    });

    it('should allow house spawn settings to be updated', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        const location = manager.getCurrentHouseForPlayer(gunther);
        assert.isNotNull(location);

        assert.isFalse(location.isAvailable());
        assert.isFalse(location.settings.isSpawn());

        gunther.respondToDialog({ listitem: 2 /* Set spawn position at this house */}).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.settings.isSpawn());

        gunther.respondToDialog({ listitem: 2 /* Set spawn position at this house */}).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(location.settings.isSpawn());
    });

    it('should give players a warning when their house has no parking lots', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        const location = manager.getCurrentHouseForPlayer(gunther);
        assert.isNotNull(location);

        assert.isAbove(location.parkingLotCount, 0);

        for (const parkingLot of location.parkingLots)
            await manager.removeLocationParkingLot(location, parkingLot);

        assert.equal(location.parkingLotCount, 0);

        gunther.respondToDialog({ listitem: 3 /* Manage my vehicles */}).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(gunther.lastDialog, Message.HOUSE_SETTINGS_NO_PARKING_LOTS);
    });

    it('should enable players to purchase vehicles for their house', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        const location = manager.getCurrentHouseForPlayer(gunther);
        assert.isNotNull(location);

        const parkingLots = Array.from(location.parkingLots);
        assert.equal(parkingLots.length, 2);

        const parkingLot = parkingLots[0];
        assert.isTrue(location.settings.vehicles.has(parkingLot));

        gunther.respondToDialog({ listitem: 3 /* Manage my vehicles */}).then(
            () => gunther.respondToDialog({ listitem: 0 /* First vehicle in the list */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yes, remove the vehicle */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(location.settings.vehicles.has(parkingLot));
    });

    it('should enable players to sell one of their vehicles', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        const location = manager.getCurrentHouseForPlayer(gunther);
        assert.isNotNull(location);

        const parkingLots = Array.from(location.parkingLots);
        assert.equal(parkingLots.length, 2);

        const parkingLot = parkingLots[1];
        assert.isFalse(location.settings.vehicles.has(parkingLot));

        gunther.respondToDialog({ listitem: 3 /* Manage my vehicles */}).then(
            () => gunther.respondToDialog({ listitem: 1 /* Second vehicle in the list */ })).then(
            () => gunther.respondToDialog({ listitem: 8 /* Purchase an Infernus */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.settings.vehicles.has(parkingLot));

        const vehicle = location.settings.vehicles.get(parkingLot);
        assert.equal(vehicle.modelId, 411 /* Infernus */);
    });

    it('should enable players to sell the houses they own', async(assert) => {
        await manager.loadHousesFromDatabase();
        assert.isAbove(manager.locationCount, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });
        gunther.position = new Vector(500, 500, 500);  // on the nearest occupied portal

        // Wait some ticks to make sure that the permission check has finished.
        while (!manager.getCurrentHouseForPlayer(gunther) && maxticks --> 0)
            await Promise.resolve();

        const location = manager.getCurrentHouseForPlayer(gunther);
        assert.isNotNull(location);

        assert.isFalse(location.isAvailable());

        gunther.respondToDialog({ listitem: 4 /* Sell this house */}).then(
            () => gunther.respondToDialog({ response: 1 /* Yes, I really want to */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.isAvailable());
    });

    it('should clean up after itself', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/house'));

        commands.dispose();
        commands = null;

        assert.isFalse(await gunther.issueCommand('/house'));
    });
});
