// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FriendsManager = require('features/friends/friends_manager.js');
const MockFriendsDatabase = require('features/friends/test/mock_friends_database.js');
const MockServer = require('test/mock_server.js');

describe('FriendsManager', (it, beforeEach, afterEach) => {
    let player = null;

    // The friendsManager instance to use for the tests. Will be reset after each test.
    let friendsManager = null;

    MockServer.bindTo(beforeEach, afterEach,
        () => {
            player = server.playerManager.getById(0 /* Gunther */);

            friendsManager = new FriendsManager(null /* database */);
            friendsManager.database_ = new MockFriendsDatabase();

        }, () => {
            friendsManager.dispose();
        });

    it('should fly', assert => {

    });
});
