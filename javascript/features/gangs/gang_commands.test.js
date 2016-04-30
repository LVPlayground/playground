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
    let player = null;

    // The GangManager instance to use for the tests. Will be reset after each test.
    let gangManager = null;
    let gangCommands = null;

    MockServer.bindTo(beforeEach, afterEach,
        () => {
            player = server.playerManager.getById(0 /* Gunther */);
            player.level = Player.LEVEL_ADMINISTRATOR;

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

    // Utility function for removing a player from a given gang.
    function removePlayerFromGang(player, gang) {
        gangManager.gangPlayers_.delete(player);
        gang.removePlayer(player);
    }

    // Be sure to remove the LEVEL_ADMINISTRATOR overrides elsewhere when removing this.
    it('should only be available to administrators', assert => {
        assert.equal(player.level, Player.LEVEL_ADMINISTRATOR);

        player.level = Player.LEVEL_PLAYER;

        assert.isTrue(player.issueCommand('/pgang'));

        assert.equal(player.messages.length, 1);
        assert.isTrue(player.messages[0].includes('only available to administrators'));

        player.clearMessages();

        assert.isTrue(player.issueCommand('/pgangs'));

        assert.equal(player.messages.length, 1);
        assert.isTrue(player.messages[0].includes('only available to administrators'));
    });

    it('should only allow registered players to create a gang', assert => {
        assert.isTrue(player.issueCommand('/pgang create'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANGS_NOT_REGISTERED);
    });

    it('should not allow players already part of a gang to create a new one', assert => {
        player.identify();

        addPlayerToGang(player, createGang());

        assert.isTrue(player.issueCommand('/pgang create'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANGS_ALREADY_SET);
    });

    it('should not allow players to create a gang that already exists', assert => {
        player.identify();

        assert.isTrue(player.issueCommand('/pgang create'));
        assert.equal(player.messages.length, 0);

        // Three questions will be asked: the name, tag and goal of the gang.
        player.respondToDialog({ inputtext: 'Homely Kitchen Olives' }).then(() =>
            player.respondToDialog({ inputtext: 'HKO' })).then(() =>
            player.respondToDialog({ inputtext: 'Eating Italian food' })).then(() =>
            player.respondToDialog({ response: 0 }));

        return gangCommands.createdPromiseForTesting_.then(() => {
            assert.isNull(gangManager.gangForPlayer(player));
            assert.equal(player.lastDialog, 'The gang is too similar to [HKO] Hello Kitty Online');
        });
    });

    it('should allow players to create a new gang', assert => {
        player.identify();

        assert.isTrue(player.issueCommand('/pgang create'));
        assert.equal(player.messages.length, 0);

        // Three questions will be asked: the name, tag and goal of the gang.
        player.respondToDialog({ inputtext: 'Creative Creatures' }).then(() =>
            player.respondToDialog({ inputtext: 'CC' })).then(() =>
            player.respondToDialog({ inputtext: 'Creating my own gang' }));

        return gangCommands.createdPromiseForTesting_.then(() => {
            const gang = gangManager.gangForPlayer(player);

            assert.isNotNull(gang);
            assert.equal(gang.tag, 'CC');
            assert.equal(gang.name, 'Creative Creatures');
            assert.equal(gang.goal, 'Creating my own gang');

            assert.isTrue(gang.hasPlayer(player));
        })
    });

    it('should be able to display information about the gang command', assert => {
        assert.isTrue(player.issueCommand('/pgang'));
        assert.isAboveOrEqual(player.messages.length, 1);
    });

    it('should be able to list the local gangs on the server', assert => {
        assert.isTrue(player.issueCommand('/pgangs'));

        assert.equal(player.messages.length, 3);
        assert.equal(player.messages[1], Message.GANGS_NONE_ONLINE);

        player.clearMessages();

        const gangColor = Color.fromRGB(255, 13, 255);
        createGang({ color: gangColor });

        assert.equal(gangManager.gangs.length, 1);

        assert.isTrue(player.issueCommand('/pgangs'));

        assert.equal(player.messages.length, 3);
        assert.isTrue(player.messages[1].includes(gangColor.toHexRGB()));
        assert.isTrue(player.messages[1].includes('HKO'));
        assert.isTrue(player.messages[1].includes('Hello Kitty Online'));
    });
});
