// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Economy = require('features/economy/economy.js');
const HouseCommands = require('features/houses/house_commands.js');
const HouseManager = require('features/houses/house_manager.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockHouseDatabase = require('features/houses/test/mock_house_database.js');

describe('HouseCommands', (it, beforeEach, afterEach) => {
    let commands = null;
    let manager = null;

    beforeEach(() => {
        manager = new HouseManager();
        manager.database_ = new MockHouseDatabase();

        commands = new HouseCommands(manager, new MockAnnounce(), new Economy());
    });

    afterEach(() => {
        if (commands)
            commands.dispose();

        manager.dispose();
    });

    it('should only be available for Management members', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/house'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
            Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS,
                           playerLevelToString(Player.LEVEL_MANAGEMENT, true /* plural */)));

        gunther.clearMessages();
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/house'));
        assert.equal(gunther.messages.length, 4);
        assert.equal(gunther.messages[0], Message.HOUSE_HEADER);
    });

    it('should allow for creation of house locations', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;

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
        gunther.level = Player.LEVEL_MANAGEMENT;
        gunther.position = new Vector(2000, 1567, 15);  // on the pirate ship

        gunther.respondToDialog({ response: 0 /* Accept that the house cannot be created */ });

        assert.isTrue(await gunther.issueCommand('/house create'));

        assert.equal(gunther.messages.length, 0);
        assert.equal(gunther.lastDialog, Message.HOUSE_CREATE_RESIDENTIAL_EXCLUSION_ZONE);
    })

    it('should issue an error when trying to modify a non-existing house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();

        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/house modify'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.HOUSE_MODIFY_NONE_NEAR);
    });

    it('should display an identity beam when modifying a nearby house', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const objectCount = server.objectManager.count;

        await manager.loadHousesFromDatabase();

        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest house

        assert.isTrue(gunther.issueCommand('/house modify'));
        await manager.findClosestLocation(gunther);

        assert.equal(gunther.messages.length, 0);

        assert.equal(server.objectManager.count, objectCount + 2);

        await server.clock.advance(180000);  // forward the clock to test the auto-expire function

        assert.equal(server.objectManager.count, objectCount);
    });

    it('should enable administrators to remove house locations', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        await manager.loadHousesFromDatabase();

        assert.equal(manager.locationCount, 3);

        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;
        gunther.position = new Vector(200, 240, 300);  // 10 units from the nearest house

        gunther.respondToDialog({ listitem: 0 /* Delete the location */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Yes, really get rid of it */ }));

        assert.isTrue(await gunther.issueCommand('/house modify'));

        assert.equal(manager.locationCount, 2);
    });

    it('should clean up after itself', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/house'));

        commands.dispose();
        commands = null;

        assert.isFalse(await gunther.issueCommand('/house'));
    });
});
