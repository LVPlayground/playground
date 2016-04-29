// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Gang = require('features/gangs/gang.js');
const GangCommands = require('features/gangs/gang_commands.js');
const GangDatabase = require('features/gangs/gang_database.js');
const GangManager = require('features/gangs/gang_manager.js');
const MockGangDatabase = require('features/gangs/test/mock_gang_database.js');
const MockServer = require('test/mock_server.js');

describe('GangManager', (it, beforeEach, afterEach) => {
    // The GangManager instance to use for the tests. Will be reset after each test.
    let gangManager = null;
    let gangCommands = null;

    MockServer.bindTo(beforeEach, afterEach,
        () => {
            gangManager = new GangManager(null /* database */);
            gangManager.database_ = new MockGangDatabase();

            gangCommands = new GangCommands(gangManager);

        }, () => {
            gangCommands.dispose();
            gangManager.dispose();
        });

    // Utility function to create a gang with the given information.
    function createGang({ tag = 'HKO', name = 'Hello Kitty Online', color = null } = {}) {
        const gangId = Math.floor(Math.random() * 1000000);

        gangManager.gangs_[gangId] = new Gang({
            id: gangId,
            tag: tag,
            name: name,
            goal: 'Testing Gang',
            color: color
        });

        return gangManager.gangs_[gangId];
    }

    // Utility function for adding a given player to a given gang.
    function addPlayerToGang(player, gang) {
        gangManager.gangPlayers_.set(player, gang);
        gang.addPlayer(player);
    }

    // Be sure to remove the LEVEL_ADMINISTRATOR overrides elsewhere when removing this.
    it('should only be available to administrators', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        assert.isNotNull(player);

        assert.equal(player.level, Player.LEVEL_PLAYER);

        assert.isTrue(player.issueCommand('/pgang'));

        assert.equal(player.messages.length, 1);
        assert.isTrue(player.messages[0].includes('only available to administrators'));

        player.clearMessages();

        assert.isTrue(player.issueCommand('/pgangs'));

        assert.equal(player.messages.length, 1);
        assert.isTrue(player.messages[0].includes('only available to administrators'));
    });

    it('should allow players to create a new gang', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        assert.isNotNull(player);

        player.level = Player.LEVEL_ADMINISTRATOR;

        // (1) An error should be presented when the player is not registered.
        assert.isTrue(player.issueCommand('/pgang create'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANGS_NOT_REGISTERED);

        player.identify();
        player.clearMessages();

        // (2) An error should be presented when the player is already part of a gang.
        addPlayerToGang(player, createGang());

        assert.isTrue(player.issueCommand('/pgang create'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANGS_ALREADY_SET);

        player.clearMessages();

        // (3) Follow the actual dialog flow when creating a gang.

        // TODO(Russell): Implement this.
    });

    it('should be able to display information about the gang command', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        assert.isNotNull(player);

        player.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(player.issueCommand('/pgang'));
        assert.isAboveOrEqual(player.messages.length, 1);
    });

    it('should be able to list the local gangs on the server', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        assert.isNotNull(player);

        player.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(player.issueCommand('/pgangs'));

        assert.equal(player.messages.length, 2);
        assert.equal(player.messages[0], Message.GANGS_NONE_ONLINE);
        assert.equal(player.messages[1], Message.GANGS_BEST_ADV);

        player.clearMessages();

        const gangColor = Color.fromRGB(255, 13, 255);
        createGang({ color: gangColor });

        assert.equal(gangManager.gangs.length, 1);

        assert.isTrue(player.issueCommand('/pgangs'));

        assert.equal(player.messages.length, 2);
        assert.isTrue(player.messages[0].includes(gangColor.toHexRGB()));
        assert.isTrue(player.messages[0].includes('HKO'));
        assert.isTrue(player.messages[0].includes('Hello Kitty Online'));
        assert.equal(player.messages[1], Message.GANGS_BEST_ADV);
    });
});
