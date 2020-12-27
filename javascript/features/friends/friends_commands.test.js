// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('FriendsCommands', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    // The Friends class instances to use for the tests. Will be reset after each test.
    let friendsManager = null;
    let friendsCommands = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        russell = server.playerManager.getById(1 /* Russell */);

        const feature = server.featureManager.loadFeature('friends');

        friendsManager = feature.manager_;
        friendsCommands = feature.commands_;
    });

    it('should show an error when adding a friend as an unregistered player', async(assert) => {
        assert.isFalse(gunther.account.isRegistered());

        assert.isTrue(await gunther.issueCommand('/friends add ' + russell.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_NOT_REGISTERED);
    });

    it('should show an error when adding an unregistered player as a friend', async(assert) => {
        await gunther.identify();

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(await gunther.issueCommand('/friends add ' + russell.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.FRIENDS_ERROR_FRIEND_NOT_REGISTERED, russell.name));
    });

    it('should show an error when adding oneself as a friend', async(assert) => {
        await gunther.identify();

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(await gunther.issueCommand('/friends add ' + gunther.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_ADD_SELF);
    });

    it('should allow players to add others as their friends', async(assert) => {
        await gunther.identify();
        await russell.identify();

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(russell.account.isRegistered());

        assert.isTrue(await gunther.issueCommand('/friends add ' + russell.id));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.FRIENDS_ADDED, russell.name));

        const friends = await friendsManager.getFriends(gunther);

        assert.equal(friends.online.length, 1);
        assert.equal(friends.online[0], russell.name);
        assert.equal(friends.offline.length, 0);
    });

    it('should show an error when listing friends as an unregistered player', async(assert) => {
        assert.isFalse(gunther.account.isRegistered());

        assert.isTrue(await gunther.issueCommand('/friends'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_NOT_REGISTERED);
    });

    it('should list friends of the current player when there are none', async(assert) => {
        await gunther.identify();

        assert.isTrue(gunther.account.isRegistered());

        const friends = await friendsManager.getFriends(gunther);
        assert.equal(friends.online.length, 0);
        assert.equal(friends.offline.length, 0);

        assert.isTrue(await gunther.issueCommand('/friends'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.FRIENDS_EMPTY);
    });

    it('should list friends of the current player when they have some', async(assert) => {
        const lucy = server.playerManager.getById(2 /* Lucy */);

        await gunther.identify();
        await russell.identify();
        await lucy.identify();

        await Promise.all([ friendsManager.addFriend(gunther, russell),
                            friendsManager.addFriend(gunther, lucy) ]);

        const friends = await friendsManager.getFriends(gunther);
        assert.equal(friends.online.length, 2);
        assert.equal(friends.offline.length, 0);

        assert.isTrue(await gunther.issueCommand('/friends'));

        assert.equal(gunther.messages.length, 3);
        assert.equal(gunther.messages[0], Message.FRIENDS_HEADER);
        assert.isTrue(gunther.messages[1].includes(russell.name));
        assert.isTrue(gunther.messages[1].includes(lucy.name));
    });

    it('should not allow players to list friends of another player', async(assert) => {
        await gunther.identify();
        await russell.identify();

        await friendsManager.addFriend(russell, gunther);

        assert.isTrue(gunther.account.isRegistered());
        assert.isFalse(gunther.isAdministrator());

        assert.isTrue(await gunther.issueCommand('/friends ' + russell.id));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.FRIENDS_EMPTY);
    });

    it('should list friends of another player as an admin when they have none', async(assert) => {
        const lucy = server.playerManager.getById(2 /* Lucy */);

        await gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify();
        await lucy.identify();

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(gunther.isAdministrator());
        assert.isTrue(russell.account.isRegistered());

        await friendsManager.addFriend(gunther, lucy);

        const friends = await friendsManager.getFriends(gunther);
        assert.equal(friends.online.length, 1);
        assert.equal(friends.offline.length, 0);

        assert.isTrue(await gunther.issueCommand('/friends ' + russell.id));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.FRIENDS_EMPTY);
    });

    it('should list friends of another player as an admin when they have some', async(assert) => {
        const lucy = server.playerManager.getById(2 /* Lucy */);

        await gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify();
        await lucy.identify();

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(gunther.isAdministrator());
        assert.isTrue(russell.account.isRegistered());

        await friendsManager.addFriend(russell, lucy);

        assert.isTrue(await gunther.issueCommand('/friends ' + russell.id))

        assert.equal(gunther.messages.length, 3);
        assert.equal(gunther.messages[0], Message.FRIENDS_HEADER);
        assert.isTrue(gunther.messages[1].includes(lucy.name));
    });

    it('should show an error removing friends as an unregistered player', async(assert) => {
        assert.isFalse(gunther.account.isRegistered());

        assert.isTrue(await gunther.issueCommand('/friends remove ' + russell.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_NOT_REGISTERED);
    });

    it('should enable removing friends by name who are online on the server', async(assert) => {
        await gunther.identify();
        await russell.identify();

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(russell.account.isRegistered());

        await friendsManager.addFriend(gunther, russell);

        const friends = await friendsManager.getFriends(gunther);
        assert.equal(friends.online.length, 1);
        assert.equal(friends.online[0], russell.name);
        assert.equal(friends.offline.length, 0);

        assert.isTrue(await gunther.issueCommand('/friends remove ' + russell.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.FRIENDS_REMOVED, russell.name));

        const updatedFriends = await friendsManager.getFriends(gunther);
        assert.equal(updatedFriends.online.length, 0);
        assert.equal(updatedFriends.offline.length, 0);
    });

    it('should enable removing friends by id who are online on the server', async(assert) => {
        await gunther.identify();
        await russell.identify();

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(russell.account.isRegistered());

        await friendsManager.addFriend(gunther, russell);

        const friends = await friendsManager.getFriends(gunther);
        assert.equal(friends.online.length, 1);
        assert.equal(friends.online[0], russell.name);
        assert.equal(friends.offline.length, 0);

        assert.isTrue(await gunther.issueCommand('/friends remove ' + russell.id));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.FRIENDS_REMOVED, russell.name));

        const updatedFriends = await friendsManager.getFriends(gunther);
        assert.equal(updatedFriends.online.length, 0);
        assert.equal(updatedFriends.offline.length, 0);
    });

    it('should enable removing friends by name who are not online on the server', async(assert) => {
        await gunther.identify();
        await russell.identify({ userId: 1337 });

        assert.isTrue(gunther.account.isRegistered());
        assert.isTrue(russell.account.isRegistered());

        await friendsManager.addFriend(gunther, russell);

        const onlineFriends = await friendsManager.getFriends(gunther);
        assert.equal(onlineFriends.online.length, 1);
        assert.equal(onlineFriends.online[0], russell.name);
        assert.equal(onlineFriends.offline.length, 0);

        russell.disconnectForTesting();

        assert.isFalse(russell.isConnected());

        const offlineFriends = await friendsManager.getFriends(gunther);
        assert.equal(offlineFriends.online.length, 0);
        assert.equal(offlineFriends.offline.length, 1);
        assert.equal(offlineFriends.offline[0], russell.name);

        assert.isTrue(await gunther.issueCommand('/friends remove ' + russell.name.toLowerCase()));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.FRIENDS_REMOVED, russell.name));

        const updatedFriends = await friendsManager.getFriends(gunther);
        assert.equal(updatedFriends.online.length, 0);
        assert.equal(updatedFriends.offline.length, 0);
    });
});
