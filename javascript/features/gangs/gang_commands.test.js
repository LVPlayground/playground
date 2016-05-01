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
    function addPlayerToGang(player, gang, role) {
        gangManager.gangPlayers_.set(player, gang);
        gang.addPlayer(player, role);
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

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

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

    it('should not allow invitations when the player is not in a gang', assert => {
        player.identify();

        assert.isTrue(player.issueCommand('/pgang invite Russell'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_NOT_IN_GANG);
    });

    it('should not allow invitations when the player is not a manager or up', assert => {
        player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        assert.isTrue(player.issueCommand('/pgang invite Russell'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_INVITE_NO_MANAGER);
    });

    it('should not allow invitations to unregistered players', assert => {
        player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);

        assert.isTrue(player.issueCommand('/pgang invite Russell'));
        assert.equal(player.messages.length, 1);
        assert.equal(
            player.messages[0], Message.format(Message.GANG_INVITE_NOT_REGISTERED, 'Russell'));
    });

    it('should not allow players to join a gang uninvited', assert => {
        assert.isTrue(player.issueCommand('/pgang join'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_JOIN_NO_INVITATION);
    });

    it('should not allow players who are part of a gang to accept an invitation', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const russellGang = createGang();

        russell.level = Player.LEVEL_ADMINISTRATOR;

        player.identify();
        russell.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);
        addPlayerToGang(russell, russellGang, Gang.ROLE_MEMBER);

        assert.isTrue(player.issueCommand('/pgang invite Russell'));
        assert.equal(russell.messages.length, 1);
        assert.equal(player.messages.length, 1);
        assert.equal(
            player.messages[0], Message.format(Message.GANG_DID_INVITE, russell.name, russell.id));

        russell.clearMessages();

        assert.isTrue(russell.issueCommand('/pgang join'));
        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0], Message.format(Message.GANG_JOIN_IN_GANG, russellGang.name));
    });

    it('should allow registered players not in a gang to accept an invitation', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        player.identify();
        russell.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MANAGER);

        assert.isTrue(player.issueCommand('/pgang invite Russell'));
        assert.isAboveOrEqual(russell.messages.length, 1);
        assert.isAboveOrEqual(player.messages.length, 1);

        russell.clearMessages();

        assert.isTrue(russell.issueCommand('/pgang join'));

        return gangCommands.joinPromiseForTesting_.then(() => {
            const gang = gangManager.gangForPlayer(russell);

            assert.isNotNull(gang);
            assert.isTrue(gang.hasPlayer(russell));
            assert.isTrue(gang.hasPlayer(player));

            assert.isAboveOrEqual(russell.messages.length, 1);
            assert.equal(russell.messages[0], Message.format(Message.GANG_DID_JOIN, gang.name));
        });
    });

    it('should not allow players to leave a gang if they aren\'t in one', assert => {
        assert.isTrue(player.issueCommand('/pgang leave'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_NOT_IN_GANG);
    });

    it('should allow players to leave the gang as members', assert => {
        player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        const gang = gangManager.gangForPlayer(player);
        assert.isNotNull(gang);

        assert.isTrue(player.issueCommand('/pgang leave'));

        player.respondToDialog({ response: 1 /* Yes */ });

        return gangCommands.leavePromiseForTesting_.then(() => {
            assert.isNull(gangManager.gangForPlayer(player));
            assert.isFalse(gang.hasPlayer(player));
        });
    });

    it('should allow players to abort leaving their gang if they change their mind', assert => {
        player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_MEMBER);

        const gang = gangManager.gangForPlayer(player);
        assert.isNotNull(gang);

        assert.isTrue(player.issueCommand('/pgang leave'));

        player.respondToDialog({ response: 0 /* No */ });

        return gangCommands.leavePromiseForTesting_.then(() => {
            assert.strictEqual(gangManager.gangForPlayer(player), gang);
        });
    });

    it('should allow leaders to leave their gang if they are the only member', assert => {
        player.identify();

        addPlayerToGang(player, createGang(), Gang.ROLE_LEADER);

        const gang = gangManager.gangForPlayer(player);
        assert.isNotNull(gang);

        assert.isTrue(player.issueCommand('/pgang leave'));

        player.respondToDialog({ response: 1 /* Yes */ });

        return gangCommands.leavePromiseForTesting_.then(() => {
            assert.isNull(gangManager.gangForPlayer(player));
            assert.isFalse(gang.hasPlayer(player));
        });
    });

    it('should allow leaders to leave their gang after confirming succession', assert => {
        player.identify();

        addPlayerToGang(player, createGang({ tag: 'CC' }), Gang.ROLE_LEADER);

        const gang = gangManager.gangForPlayer(player);
        assert.isNotNull(gang);

        assert.isTrue(player.issueCommand('/pgang leave'));

        player.respondToDialog({ response: 1 /* Yes */ });

        return gangCommands.leavePromiseForTesting_.then(() => {
            assert.isTrue(player.lastDialog.includes('MrNextLeader'));
            assert.isTrue(player.lastDialog.includes('Manager'));

            assert.isNull(gangManager.gangForPlayer(player));
            assert.isFalse(gang.hasPlayer(player));
        });
    });

    it('should allow leaders to cancel leaving their gang', assert => {
        player.identify();

        addPlayerToGang(player, createGang({ tag: 'CC' }), Gang.ROLE_LEADER);

        const gang = gangManager.gangForPlayer(player);
        assert.isNotNull(gang);

        assert.isTrue(player.issueCommand('/pgang leave'));

        player.respondToDialog({ response: 0 /* No */ });

        return gangCommands.leavePromiseForTesting_.then(() => {
            assert.strictEqual(gangManager.gangForPlayer(player), gang);
        });
    });

    it('should enable players to list the members of their gang', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);
        const gang = createGang({ tag: 'CC' });

        player.identify();
        russell.identify({ userId: 1337 });

        addPlayerToGang(player, gang, Gang.ROLE_LEADER);
        addPlayerToGang(russell, gang, Gang.ROLE_MEMBER);

        assert.isTrue(player.issueCommand('/pgang members'));

        return gangCommands.membersPromiseForTesting_.then(() => {
            assert.equal(player.messages.length, 3);

            assert.isTrue(player.messages[0].includes(gang.tag));
            assert.isTrue(player.messages[0].includes(gang.name));

            assert.isTrue(player.messages[1].includes(player.name));
            assert.isTrue(player.messages[1].includes('Id:')); /* Gunther is |player| */

            assert.isTrue(player.messages[2].includes(russell.name));
            assert.isTrue(player.messages[2].includes('Id:')); /* Russell is |russell| */
        });
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
