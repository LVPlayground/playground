// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Gang = require('features/gangs/gang.js');
const GangDatabase = require('features/gangs/gang_database.js');
const GangManager = require('features/gangs/gang_manager.js');
const MockGangDatabase = require('features/gangs/test/mock_gang_database.js');
const MockServer = require('test/mock_server.js');

describe('GangManager', (it, beforeEach, afterEach) => {
    // The GangManager instance to use for the tests. Will be reset after each test.
    let gangManager = null;

    MockServer.bindTo(beforeEach, afterEach,
        () => {
            gangManager = new GangManager(null /* database */);
            gangManager.database_ = new MockGangDatabase();

        }, () => gangManager.dispose());

    it('should be able to announce something to gang members', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.isNull(gangManager.gangForPlayer(gunther));

        gunther.identify({ userId: MockGangDatabase.HKO_LEADER_USER_ID,
                           gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        return Promise.resolve().then(() => {
            const gang = gangManager.gangForPlayer(gunther);
            assert.isNotNull(gang);

            gangManager.announceToGang(gang, russell, 'Hello, members!');

            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0],
                         Message.format(Message.GANG_ANNOUNCE_INTERNAL, 'Hello, members!'));

            assert.isFalse(gang.hasPlayer(russell));
            assert.isNull(gangManager.gangForPlayer(russell));
            assert.equal(russell.messages.length, 0);
        });
    });

    it('should create a gang and make the player its leader', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        assert.isNotNull(player);

        player.identify({ userId: MockGangDatabase.CC_LEADER_USER_ID });

        return gangManager.createGangForPlayer(player, 'CC', 'name', 'goal').then(gang => {
            assert.equal(gang.id, MockGangDatabase.CC_GANG_ID);
            assert.equal(gang.tag, 'CC');
            assert.equal(gang.name, 'name');
            assert.equal(gang.goal, 'goal');

            assert.isTrue(gang.hasPlayer(player));

            assert.equal(gang.memberCount, 1);
        });
    });

    it('should refuse to create a gang when it causes ambiguity', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        assert.isNotNull(player);

        player.identify({ userId: MockGangDatabase.CC_LEADER_USER_ID });

        return gangManager.createGangForPlayer(player, 'HKO', 'name', 'goal').then(
            () => assert.unexpectedResolution(),
            () => true /* the promise rejected due to ambiguity */);

    });

    it('should load and unload gang data on connectivity events', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        assert.isNotNull(player);

        assert.isNull(gangManager.gangForPlayer(player));

        player.identify({ userId: MockGangDatabase.HKO_LEADER_USER_ID,
                          gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        return Promise.resolve().then(() => {
            const gang = gangManager.gangForPlayer(player);

            assert.isNotNull(gang);
            assert.equal(gang.tag, 'HKO');

            assert.isTrue(gang.hasPlayer(player));

            player.disconnect();

            assert.isFalse(gang.hasPlayer(player));
            assert.isNull(gangManager.gangForPlayer(player));
        });
    });

    it('should be able to convert to and from member roles', assert => {
        assert.equal(GangDatabase.toRoleValue('Leader'), Gang.ROLE_LEADER);
        assert.equal(GangDatabase.toRoleValue('Manager'), Gang.ROLE_MANAGER);
        assert.equal(GangDatabase.toRoleValue('Member'), Gang.ROLE_MEMBER);

        assert.throws(() => GangDatabase.toRoleValue('Glorious Leader'));

        assert.equal(GangDatabase.toRoleString(Gang.ROLE_LEADER), 'Leader');
        assert.equal(GangDatabase.toRoleString(Gang.ROLE_MANAGER), 'Manager');
        assert.equal(GangDatabase.toRoleString(Gang.ROLE_MEMBER), 'Member');

        assert.throws(() => GangDatabase.toRoleString(42 /* Glorious Leader?? */));
    });
});
