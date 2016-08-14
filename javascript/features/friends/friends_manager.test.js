// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FriendsManager = require('features/friends/friends_manager.js');
const MockFriendsDatabase = require('features/friends/test/mock_friends_database.js');

describe('FriendsManager', (it, beforeEach, afterEach) => {
    let gunther = null;
    let russell = null;

    // The friendsManager instance to use for the tests. Will be reset after each test.
    let friendsManager = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        russell = server.playerManager.getById(1 /* Russell */);

        friendsManager = new FriendsManager();
        friendsManager.database_ = new MockFriendsDatabase();
    });

    afterEach(() => friendsManager.dispose());

    it('should load the list of friends when a player logs in', async(assert) => {
        gunther.identify({ userId: 50 });
        russell.identify({ userId: 1337 });

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(russell.isRegistered());

        const friends = await friendsManager.getFriends(gunther);
        assert.equal(friends.online.length, 1);
        assert.equal(friends.online[0], 'Russell');

        assert.equal(friends.offline.length, 1);
        assert.equal(friends.offline[0], 'Lucy');
    });

    it('should play a sound when a friend connects to the server', async(assert) => {
        gunther.identify({ userId: 50 });

        const friends = await friendsManager.getFriends(gunther);
        assert.equal(friends.offline.length, 2);
        assert.equal(friends.offline[0], 'Lucy');
        assert.equal(friends.offline[1], 'Russell');

        assert.isNull(gunther.lastPlayedSound);

        server.playerManager.onPlayerConnect({ playerid: 100, name: 'Lucy' });

        assert.isNotNull(gunther.lastPlayedSound);
    });

    it('should remove stored data when a player disconnects', async(assert) => {
        gunther.identify();
        russell.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(russell.isRegistered());

        const friends = await friendsManager.getFriends(gunther);
        assert.isTrue(friendsManager.friends_.has(gunther));
        assert.isTrue(friendsManager.loadPromises_.has(gunther));
        assert.isTrue(friendsManager.lastActive_.hasOwnProperty(gunther.userId));
        assert.equal(friendsManager.lastActive_[gunther.userId], FriendsManager.CURRENTLY_ONLINE);

        gunther.disconnect();

        assert.isFalse(friendsManager.friends_.has(gunther));
        assert.isFalse(friendsManager.loadPromises_.has(gunther));
        assert.isTrue(friendsManager.lastActive_.hasOwnProperty(gunther.userId));
        assert.notEqual(
            friendsManager.lastActive_[gunther.userId], FriendsManager.CURRENTLY_ONLINE);
    });

    it('should by able to tell if one friended one without them being online', async(assert) => {
        gunther.identify({ userId: 1000 });

        assert.isTrue(await friendsManager.isFriendedBy(gunther, 50));

        russell.identify({ userId: 50 });

        assert.isTrue(await friendsManager.isFriendedBy(gunther, 50));
        assert.isTrue(await friendsManager.hasFriend(russell, gunther));

        await friendsManager.removeFriend(russell, 'Lucy' /* don't ask */);

        assert.isFalse(await friendsManager.isFriendedBy(gunther, 50));
        assert.isFalse(await friendsManager.hasFriend(russell, gunther));

        await friendsManager.addFriend(russell, gunther);

        assert.isTrue(await friendsManager.isFriendedBy(gunther, 50));
        assert.isTrue(await friendsManager.hasFriend(russell, gunther));

        russell.disconnect();

        assert.isTrue(await friendsManager.isFriendedBy(gunther, 50));
    })
});
