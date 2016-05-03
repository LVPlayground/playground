// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mock implementation of the friends database functions. Has identical public methods to the
// actual FriendsDatabase class, but is intended to be used for testing.
class MockFriendsDatabase {
    loadFriends(player) {
        return Promise.resolve([]);
    }

    addFriend(player, friend) {
        return Promise.resolve(null);
    }

    removeFriend(player, friendUserId) {
        return Promise.resolve(null);
    }
}

exports = MockFriendsDatabase;
