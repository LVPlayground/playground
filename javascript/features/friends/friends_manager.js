// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FriendsDatabase } from 'features/friends/friends_database.js';
import { MockFriendsDatabase } from 'features/friends/mock_friends_database.js';

// Manager for the friends feature responsible for the mid-level logic of the feature, including
// making sure that a player's friends are loaded when they log in to the server.
export class FriendsManager {
    // Constant to represent that a friend is currently online.
    static kCurrentlyOnline = Number.MAX_SAFE_INTEGER;

    constructor() {
        this.database_ = server.isTest() ? new MockFriendsDatabase()
                                         : new FriendsDatabase();

        this.friends_ = new Map();
        this.lastActive_ = {};
        this.loadPromises_ = new Map();
        this.userIds_ = new WeakMap();

        // Cached data from a userId to the list of friends of that userId.
        this.friendsCache_ = new Map();

        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    // Returns a promise that will be resolved when data for the |player| has been loaded.
    waitUntilPlayerDataLoaded(player) { return this.loadPromises_.get(player); }

    // Asynchronously adds |friendPlayer| as a friend of |player|.
    async addFriend(player, friendPlayer) {
        if (await this.hasFriend(player, friendPlayer))
            return;  // nothing to do, the relation already exists

        await this.database_.addFriend(player, friendPlayer);

        if (this.friendsCache_.has(player.account.userId))
            this.friendsCache_.get(player.account.userId).add(friendPlayer.account.userId);

        let friends = this.friends_.get(player);
        if (!friends)
            return;  // the player has disconnected from the server since

        friends.push({
            userId: friendPlayer.account.userId,
            name: friendPlayer.name,
            lastSeen: Date.now()
        });
    }

    // Asynchronously returns whether |player| has added |friendPlayer| as a friend. Both players
    // must be registered and logged in to their accounts.
    async hasFriend(player, friendPlayer) {
        if (!player.account.isRegistered() || !friendPlayer.account.isRegistered())
            return false;

        await this.waitUntilPlayerDataLoaded(player);
        for (const friend of this.friends_.get(player)) {
            if (friend.userId === friendPlayer.account.userId)
                return true;
        }

        return false;
    }

    // Asynchronously returns whether |player| is on the list of friends of |friendUserId|. The
    // friend does not have to be online, and results will be cached.
    async isFriendedBy(player, friendUserId) {
        if (!this.friendsCache_.has(friendUserId))
            this.friendsCache_.set(friendUserId, await this.database_.getFriendsSet(friendUserId));

        return this.friendsCache_.get(friendUserId).has(player.account.userId);
    }

    // Asynchronously returns the list of friends of |player|.
    async getFriends(player) {
        if (!player.account.isRegistered())
            return { online: [], offline: [] };

        await this.waitUntilPlayerDataLoaded(player);

        let friends = this.friends_.get(player);
        friends.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

        // Function for determining if |friend| is currently online.
        const isOnline = friend =>
            this.lastActive_[friend.userId] == FriendsManager.kCurrentlyOnline;

        return {
            online: friends.filter(friend => isOnline(friend)).map(friend => friend.name),
            offline: friends.filter(friend => !isOnline(friend)).map(friend => friend.name)
        };
    }

    // Asynchronously removes |friendName| as a friend of |player|, which does not have to be their
    // complete nickname. The |player| must be registered and logged in to their account.
    async removeFriend(player, friendName) {
        if (!player.account.isRegistered())
            throw new Error('The |player| must be registered.');

        await this.waitUntilPlayerDataLoaded(player);

        const lowerCaseName = friendName.toLowerCase();

        let removeNickname = null;
        let removeUserId = null;

        for (let friend of this.friends_.get(player)) {
            if (!friend.name.toLowerCase().includes(lowerCaseName))
                continue;

            if (removeNickname !== null && removeUserId != friend.userId) {
                return { success: false,
                         message: 'More than one friend matches the given name: ' + friendName };
            }

            removeNickname = friend.name;
            removeUserId = friend.userId;
        }

        if (removeUserId === null)
            return { success: false, message: 'No friends match the given name: ' + friendName };

        // Remove the friend from the cached list of friends.
        this.friends_.set(player, this.friends_.get(player).filter(friend => {
            return removeUserId != friend.userId;
        }));

        await this.database_.removeFriend(player, removeUserId);

        if (this.friendsCache_.has(player.account.userId))
            this.friendsCache_.get(player.account.userId).delete(removeUserId);

        return { success: true, nickname: removeNickname }
    }

    // Called when a player connects to Las Venturas Playground. Players that added them to their
    // friend list will hear a sound informing them of their connection. Note that there are cases
    // where this could go wrong, for example when someone uses a registered name that's not theirs.
    onPlayerConnect(player) {
        for (const [onlinePlayer, friends] of this.friends_) {
            friends.find(friend => {
                if (friend.name !== player.name)
                    return false;

                onlinePlayer.playSound(1083 /* SOUND_ROULETTE_ADD_CASH */);
                return true;
            });
        }
    }

    // Called when a player logs in to their account. Will start loading their friends.
    onPlayerLogin(player) {
        this.lastActive_[player.account.userId] = FriendsManager.kCurrentlyOnline;
        this.userIds_.set(player, player.account.userId);

        this.loadPromises_.set(player, this.database_.loadFriends(player).then(friends => {
            this.friends_.set(player, friends);
            return null;
        }));
    }

    // Called when a player disconnects from Las Venturas Playground. Clears their friend list.
    onPlayerDisconnect(player) {
        this.friends_.delete(player);
        this.loadPromises_.delete(player);

        const userId = this.userIds_.get(player);
        if (userId) {
            this.lastActive_[userId] = Date.now();
            this.userIds_.delete(player);
        }
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
}
