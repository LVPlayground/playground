// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FriendsCommands = require('features/friends/friends_commands.js');
const FriendsManager = require('features/friends/friends_manager.js');
const MockFriendsDatabase = require('features/friends/test/mock_friends_database.js');
const MockServer = require('test/mock_server.js');

describe('FriendsCommands', (it, beforeEach, afterEach) => {
    let gunther = null;
    let russell = null;

    // The Friends class instances to use for the tests. Will be reset after each test.
    let friendsManager = null;
    let friendsCommands = null;

    MockServer.bindTo(beforeEach, afterEach,
        () => {
            gunther = server.playerManager.getById(0 /* Gunther */);
            russell = server.playerManager.getById(1 /* Russell */);

            friendsManager = new FriendsManager(null /* database */);
            friendsManager.database_ = new MockFriendsDatabase();

            friendsCommands = new FriendsCommands(friendsManager);

        }, () => {
            friendsCommands.dispose();
            friendsManager.dispose();
        });

    it('should show an error when adding a friend as an unregistered player', assert => {
        assert.isFalse(gunther.isRegistered());

        assert.isTrue(gunther.issueCommand('/friends add ' + russell.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_NOT_REGISTERED);
    });

    it('should show an error when adding an unregistered player as a friend', assert => {
        gunther.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(gunther.issueCommand('/friends add ' + russell.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.FRIENDS_ERROR_FRIEND_NOT_REGISTERED, russell.name));
    });

    it('should show an error when adding oneself as a friend', assert => {
        gunther.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(gunther.issueCommand('/friends add ' + gunther.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_ADD_SELF);
    });

    it('should allow players to add others as their friends', assert => {
        gunther.identify();
        russell.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(russell.isRegistered());

        assert.isTrue(gunther.issueCommand('/friends add ' + russell.id));

        return friendsCommands.addPromiseForTesting_.then(() => {
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.format(Message.FRIENDS_ADDED, russell.name));

            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 1);
            assert.equal(friends.online[0], russell.name);
            assert.equal(friends.offline.length, 0);
        });
    });

    it('should show an error when listing friends as an unregistered player', assert => {
        assert.isFalse(gunther.isRegistered());

        assert.isTrue(gunther.issueCommand('/friends'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_NOT_REGISTERED);
    });

    it('should list friends of the current player when there are none', assert => {
        gunther.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(gunther.issueCommand('/friends'));

        return friendsManager.getFriends(gunther).then(friends => {
            assert.equal(friends.online.length, 0);
            assert.equal(friends.offline.length, 0);

            return friendsCommands.listPromiseForTesting_;

        }).then(() => {
            assert.equal(gunther.messages.length, 2);
            assert.equal(gunther.messages[0], Message.FRIENDS_EMPTY);
        });
    });

    it('should list friends of the current player when they have some', assert => {
        const lucy = server.playerManager.getById(2 /* Lucy */);

        gunther.identify();
        russell.identify();
        lucy.identify();

        return Promise.all([
            friendsManager.addFriend(gunther, russell),
            friendsManager.addFriend(gunther, lucy)
        ]).then(() => {
            assert.isTrue(gunther.issueCommand('/friends'));

            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 2);
            assert.equal(friends.offline.length, 0);

            return friendsCommands.listPromiseForTesting_;

        }).then(() => {
            assert.equal(gunther.messages.length, 3);
            assert.equal(gunther.messages[0], Message.FRIENDS_HEADER);
            assert.isTrue(gunther.messages[1].includes(russell.name));
            assert.isTrue(gunther.messages[1].includes(lucy.name));
        });
    });

    it('should ignore the command when listing friends of another player as a player', assert => {
        gunther.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isFalse(gunther.isAdministrator());

        assert.isTrue(gunther.issueCommand('/friends ' + russell.id));

        assert.equal(gunther.messages.length, 0);
    });

    it('should list friends of another player as an administrator when they have none', assert => {
        const lucy = server.playerManager.getById(2 /* Lucy */);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        russell.identify();
        lucy.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(gunther.isAdministrator());
        assert.isTrue(russell.isRegistered());

        return friendsManager.addFriend(gunther, lucy).then(() => {
            assert.isTrue(gunther.issueCommand('/friends ' + russell.id));

            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 1);
            assert.equal(friends.offline.length, 0);

            return friendsCommands.listPromiseForTesting_;

        }).then(() => {
            assert.equal(gunther.messages.length, 2);
            assert.equal(gunther.messages[0], Message.FRIENDS_EMPTY);
        });
    });

    it('should list friends of another player as an administrator when they have some', assert => {
        const lucy = server.playerManager.getById(2 /* Lucy */);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        russell.identify();
        lucy.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(gunther.isAdministrator());
        assert.isTrue(russell.isRegistered());

        return friendsManager.addFriend(russell, lucy).then(() => {
            assert.isTrue(gunther.issueCommand('/friends ' + russell.id));

            return friendsManager.getFriends(gunther);

        }).then(() => {
            assert.equal(gunther.messages.length, 3);
            assert.equal(gunther.messages[0], Message.FRIENDS_HEADER);
            assert.isTrue(gunther.messages[1].includes(lucy.name));
        });
    });

    it('should show an error removing friends as an unregistered player', assert => {
        assert.isFalse(gunther.isRegistered());

        assert.isTrue(gunther.issueCommand('/friends remove ' + russell.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.FRIENDS_ERROR_NOT_REGISTERED);
    });

    it('should enable removing friends by name who are online on the server', assert => {
        gunther.identify();
        russell.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(russell.isRegistered());

        return friendsManager.addFriend(gunther, russell).then(() => {
            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 1);
            assert.equal(friends.online[0], russell.name);
            assert.equal(friends.offline.length, 0);

            assert.isTrue(gunther.issueCommand('/friends remove ' + russell.name));
            return friendsCommands.removePromiseForTesting_;

        }).then(() => {
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.FRIENDS_REMOVED, russell.name));

            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 0);
            assert.equal(friends.offline.length, 0);
        });
    });

    it('should enable removing friends by id who are online on the server', assert => {
        gunther.identify();
        russell.identify();

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(russell.isRegistered());

        return friendsManager.addFriend(gunther, russell).then(() => {
            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 1);
            assert.equal(friends.online[0], russell.name);
            assert.equal(friends.offline.length, 0);

            assert.isTrue(gunther.issueCommand('/friends remove ' + russell.id));
            return friendsCommands.removePromiseForTesting_;

        }).then(() => {
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.FRIENDS_REMOVED, russell.name));

            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 0);
            assert.equal(friends.offline.length, 0);
        });
    });

    it('should enable removing friends by name who are not online on the server', assert => {
        gunther.identify();
        russell.identify({ userId: 1337 });

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(russell.isRegistered());

        return friendsManager.addFriend(gunther, russell).then(() => {
            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 1);
            assert.equal(friends.online[0], russell.name);
            assert.equal(friends.offline.length, 0);

            russell.disconnect();

            assert.isFalse(russell.isConnected());
            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 0);
            assert.equal(friends.offline.length, 1);
            assert.equal(friends.offline[0], russell.name);

            assert.isTrue(gunther.issueCommand('/friends remove ' + russell.name.toLowerCase()));
            return friendsCommands.removePromiseForTesting_;

        }).then(() => {
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.FRIENDS_REMOVED, russell.name));

            return friendsManager.getFriends(gunther);

        }).then(friends => {
            assert.equal(friends.online.length, 0);
            assert.equal(friends.offline.length, 0);
        });
    });
});
