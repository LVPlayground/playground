// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mock implementation of the friends database functions. Has identical public methods to the
// actual FriendsDatabase class, but is intended to be used for testing.
class MockFriendsDatabase {
    async loadFriends(player) {
        if (player.account.userId != 50)
            return [];

        return [
            { userId: 1000, name: 'Lucy', lastSeen: Date.now() },
            { userId: 1337, name: 'Russell', lastSeen: Date.now() }
        ];
    }

    async getFriendsSet(userId) {
        if (userId == 50)
            return new Set([ 1000 ]);

        return new Set();
    }

    async addFriend(player, friend) {}

    async removeFriend(player, friendUserId) {}
}

export default MockFriendsDatabase;
