// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Gang from 'features/gangs/gang.js';
import GangDatabase from 'features/gangs/gang_database.js';
import Gangs from 'features/gangs/gangs.js';
import MockGangDatabase from 'features/gangs/test/mock_gang_database.js';

describe('GangManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        server.featureManager.registerFeaturesForTests({
            gangs: Gangs
        });

        const gangs = server.featureManager.loadFeature('gangs');

        manager = gangs.manager_;
        gunther = server.playerManager.getById(0 /* Gunther */);
    });

    it('should be able to announce something to gang members', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.isNull(manager.gangForPlayer(gunther));

        await gunther.identify({ userId: MockGangDatabase.HKO_LEADER_USER_ID,
                                 gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        await Promise.resolve();

        const gang = manager.gangForPlayer(gunther);
        assert.isNotNull(gang);

        manager.announceToGang(gang, russell, 'Hello, members!');

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.GANG_ANNOUNCE_INTERNAL, 'Hello, members!'));

        assert.isFalse(gang.hasPlayer(russell));
        assert.isNull(manager.gangForPlayer(russell));
        assert.equal(russell.messages.length, 0);
    });

    it('should create a gang and make the player its leader', async(assert) => {
        await gunther.identify({ userId: MockGangDatabase.CC_LEADER_USER_ID });

        const gang = await manager.createGangForPlayer(gunther, 'CC', 'name', 'goal');

        assert.equal(gang.id, MockGangDatabase.CC_GANG_ID);
        assert.equal(gang.tag, 'CC');
        assert.equal(gang.name, 'name');
        assert.equal(gang.goal, 'goal');

        assert.isTrue(gang.hasPlayer(gunther));

        assert.equal(gang.memberCount, 1);
    });

    it('should refuse to create a gang when it causes ambiguity', async(assert) => {
        await gunther.identify({ userId: MockGangDatabase.CC_LEADER_USER_ID });

        return manager.createGangForPlayer(gunther, 'HKO', 'name', 'goal').then(
            () => assert.unexpectedResolution(),
            () => true /* the promise rejected due to ambiguity */);

    });

    it('should be able to purchase additional encryption time for the gang', async(assert) => {
        await gunther.identify({ userId: MockGangDatabase.CC_LEADER_USER_ID });

        const gang = await manager.createGangForPlayer(gunther, 'CC', 'name', 'goal');
        assert.isNotNull(gang);

        assert.isTrue(gang.hasPlayer(gunther));
        assert.equal(gang.getPlayerRole(gunther), Gang.ROLE_LEADER);

        assert.equal(gang.chatEncryptionExpiry, 0);

        await manager.updateChatEncryption(gang, gunther, 3600 /* an hour */);
        assert.closeTo(
            gang.chatEncryptionExpiry, (server.clock.currentTime() / 1000) + 3600, 5); // 1 hour

        await manager.updateChatEncryption(gang, gunther, 7200 /* two hours */);
        assert.closeTo(
            gang.chatEncryptionExpiry, (server.clock.currentTime() / 1000) + 10800, 5); // 3 hours
    });

    it('should be able to update member preferences in regards to gang color', async(assert) => {
        assert.isNull(manager.gangForPlayer(gunther));

        await gunther.identify({ userId: MockGangDatabase.HKO_LEADER_USER_ID,
                                 gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        await Promise.resolve();

        const gang = manager.gangForPlayer(gunther);

        assert.isTrue(gang.hasPlayer(gunther));
        assert.isTrue(gang.usesGangColor(gunther));
        assert.isNotNull(gunther.gangColor);

        await manager.updateColorPreference(gang, gunther, false);

        assert.isFalse(gang.usesGangColor(gunther));
    });

    it('should respect member color preferences when they connect to the server', async(assert) => {
        assert.isNull(manager.gangForPlayer(gunther));

        await gunther.identify({ userId: MockGangDatabase.HKO_MEMBER_USER_ID,
                                 gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        await Promise.resolve();

        const gang = manager.gangForPlayer(gunther);

        assert.isNotNull(gang);

        assert.isFalse(gang.usesGangColor(gunther));
    });

    it('should be able to update member preferences in regards to gang skin', async(assert) => {
        assert.isNull(manager.gangForPlayer(gunther));

        await gunther.identify({ userId: MockGangDatabase.HKO_MEMBER_USER_ID,
                                 gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        await Promise.resolve();

        const gang = manager.gangForPlayer(gunther);

        assert.isTrue(gang.hasPlayer(gunther));
        assert.isTrue(gang.usesGangSkin(gunther));
        gunther.skinId = 144;

        await manager.updateSkinPreference(gang, gunther, false);

        assert.isFalse(gang.usesGangSkin(gunther));
        assert.equal(gunther.skinId, 144);
    });

    it('should load and unload gang data on connectivity events', async(assert) => {
        assert.isNull(manager.gangForPlayer(gunther));

        await gunther.identify({ userId: MockGangDatabase.HKO_LEADER_USER_ID,
                                 gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        await Promise.resolve();

        const gang = manager.gangForPlayer(gunther);

        assert.isNotNull(gang);
        assert.equal(gang.tag, 'HKO');

        assert.isTrue(gang.hasPlayer(gunther));

        assert.isTrue(gang.usesGangColor(gunther));
        assert.isNotNull(gunther.gangColor);

        gunther.disconnectForTesting();

        assert.isFalse(gang.hasPlayer(gunther));
        assert.isNull(manager.gangForPlayer(gunther));
    });

    it('should issue events to attached observers when membership changes', async(assert) => {
        assert.isNull(manager.gangForPlayer(gunther));

        await gunther.identify();

        let connectedCount = 0;
        let joinedUserCount = 0;
        let leftUserCount = 0;

        class MyObserver {
            onGangMemberConnected(userId, gangId) {
                connectedCount++;
            }

            onUserJoinGang(userId, gangId) {
                joinedUserCount++;
            }

            onUserLeaveGang(userId, gangId) {
                leftUserCount++;
            }
        }

        const observer = new MyObserver();

        // Events should be issued when a player joins or leaves a gang.
        manager.addObserver(observer);

        assert.equal(connectedCount, 0);
        assert.equal(joinedUserCount, 0);
        assert.equal(leftUserCount, 0);

        const gang = await manager.createGangForPlayer(gunther, 'CC', 'name', 'goal');
        assert.isNotNull(manager.gangForPlayer(gunther));

        assert.equal(connectedCount, 0);
        assert.equal(joinedUserCount, 1);
        assert.equal(leftUserCount, 0);

        await gunther.identify({ userId: MockGangDatabase.HKO_LEADER_USER_ID,
                                 gangId: MockGangDatabase.HKO_GANG_ID });

        // The database result will be loaded through a promise, continue the test asynchronously.
        await Promise.resolve();

        assert.equal(connectedCount, 1);
        assert.equal(joinedUserCount, 1);
        assert.equal(leftUserCount, 0);

        await manager.removePlayerFromGang(gunther, manager.gangForPlayer(gunther));
        assert.isNull(manager.gangForPlayer(gunther));

        assert.equal(connectedCount, 1);
        assert.equal(joinedUserCount, 1);
        assert.equal(leftUserCount, 1);

        // Events should no longer be issued after an observer has been removed.
        manager.removeObserver(observer);

        await manager.createGangForPlayer(gunther, 'CC', 'name', 'goal');
        assert.isNotNull(manager.gangForPlayer(gunther));

        assert.equal(connectedCount, 1);
        assert.equal(joinedUserCount, 1);
        assert.equal(leftUserCount, 1);
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
