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

        assert.isTrue(await gunther.issueCommand('/houses'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
            Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS,
                           playerLevelToString(Player.LEVEL_MANAGEMENT, true /* plural */)));

        gunther.clearMessages();
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/houses'));
        assert.equal(gunther.messages.length, 4);
        assert.equal(gunther.messages[0], Message.HOUSES_HEADER);
    });

    it('should allow for creation of house locations', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;

        gunther.respondToDialog({ response: 1 /* Yes, confirm creation of the house */ });

        assert.equal(manager.locationCount, 0);

        assert.isTrue(await gunther.issueCommand('/houses create'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(
            gunther.messages[0].includes(
                Message.format(Message.HOUSES_ANNOUNCE_CREATED, gunther.name, gunther.id)));

        assert.equal(manager.locationCount, 1);
    });

    it('should clean up after itself', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/houses'));

        commands.dispose();
        commands = null;

        assert.isFalse(await gunther.issueCommand('/houses'));
    });
});
