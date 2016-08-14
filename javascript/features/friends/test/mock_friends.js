// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');

// This is a mocked implementation of the Friends feature that can be used for testing. Tests have
// the ability to inject fake data that should be returned by the functions.
class MockFriends extends Feature {
    constructor() {
        super();

        // Map of |player| to 
        this.mockedFriends_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the friends feature.
    // ---------------------------------------------------------------------------------------------

    // Asynchronously returns whether |player| has added |friendPlayer| as a friend. Both players
    // must be registered and logged in to their accounts.
    async hasFriend(player, friendPlayer) {
        const friends = this.mockedFriends_.get(player.userId);
        if (!friends)
            return false;

        return friends.has(friendPlayer.userId);
    }

    // Asynchronously returns whether |player| is on the list of friends of |friendUserId|. The
    // friend does not have to be online, and results will be cached.
    async isFriendedBy(player, friendUserId) {
        const friends = this.mockedFriends_.get(friendUserId);
        if (!friends)
            return false;

        return friends.has(player.userId);
    }

    // ---------------------------------------------------------------------------------------------
    // Testing API features for this module.
    // ---------------------------------------------------------------------------------------------

    // Adds |toPlayer| as a friend to the list of |fromPlayer|.
    addFriend(fromPlayer, toPlayer) {
        if (!this.mockedFriends_.has(fromPlayer.userId))
            this.mockedFriends_.set(fromPlayer.userId, new Set());

        this.mockedFriends_.get(fromPlayer.userId).add(toPlayer.userId);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.mockedFriends_.clear();
    }
}

exports = MockFriends;
