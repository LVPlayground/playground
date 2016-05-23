// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FriendsDatabase = require('features/friends/friends_database.js');

// Manager for the friends feature responsible for the mid-level logic of the feature, including
// making sure that a player's friends are loaded when they log in to the server.
class FriendsManager {
    constructor(database) {
        this.database_ = new FriendsDatabase(database);

        this.friends_ = new Map();
        this.lastActive_ = {};
        this.loadPromises_ = new Map();

        server.playerManager.addObserver(this);
    }

    // Returns a promise that will be resolved when data for the |player| has been loaded.
    async waitUntilPlayerDataLoaded(player) { return this.loadPromises_.get(player); }

    // Adds |friendPlayer| as a friend of |player|. Returns a promise that will be resolved when the
    // relationship has been created in the database.
    async addFriend(player, friendPlayer) {
        if (await this.hasFriend(player, friendPlayer))
            return;  // nothing to do, the relation already exists

        await this.database_.addFriend(player, friendPlayer);

        let friends = this.friends_.get(player);
        if (!friends)
            return;  // the player has disconnected from the server since

        friends.push({
            userId: friendPlayer.userId,
            name: friendPlayer.name,
            lastSeen: Date.now()
        });
    }

    // Returns a promise that will be resolved with a boolean indicating whether |player| has added
    // |friendPlayer| as a friend. Both players must be registered and logged in to their accounts.
    async hasFriend(player, friendPlayer) {
        if (!player.isRegistered() || !friendPlayer.isRegistered())
            return false;

        await this.waitUntilPlayerDataLoaded(player);
        for (const friend of this.friends_.get(player)) {
            if (friend.userId === friendPlayer.userId)
                return true;
        }

        return false;
    }

    // Returns a promise that will be resolved with the list of friends of |player|. The friends
    // will be categorized in two groups: those who are online and those who are offline.
    async getFriends(player) {
        if (!player.isRegistered())
            return { online: [], offline: [] };

        await this.waitUntilPlayerDataLoaded(player);

        let friends = this.friends_.get(player);
        friends.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

        // Function for determining if |friend| is currently online.
        const isOnline = friend =>
            this.lastActive_[friend.userId] == FriendsManager.CURRENTLY_ONLINE;

        return {
            online: friends.filter(friend => isOnline(friend)).map(friend => friend.name),
            offline: friends.filter(friend => !isOnline(friend)).map(friend => friend.name)
        };
    }

    // Removes |friendName| as a friend of |player|, which does not have to be their complete name.
    // Returns a promise that will be resolved with the removed player's name when the relationship
    // has been removed from both the local state and the database.
    async removeFriend(player, friendName) {
        if (!player.isRegistered())
            throw new Error('The |player| must be registered.');

        await this.waitUntilPlayerDataLoaded(player);

        const lowerCaseName = friendName.toLowerCase();

        let removeNickname = null;
        let removeUserId = null;

        for (let friend of this.friends_.get(player)) {
            if (!friend.name.toLowerCase().includes(lowerCaseName))
                continue;

            if (removeNickname !== null && removeUserId != friend.userId)
                throw new Error('More than one friend matches the given name: ' + friendName);

            removeNickname = friend.name;
            removeUserId = friend.userId;
        }

        if (removeUserId === null)
            throw new Error('No friends match the given name: ' + friendName);

        // Remove the friend from the cached list of friends.
        this.friends_.set(player, this.friends_.get(player).filter(friend => {
            return removeUserId != friend.userId;
        }));

        await this.database_.removeFriend(player, removeUserId);

        return removeNickname;
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
        this.lastActive_[player.userId] = FriendsManager.CURRENTLY_ONLINE;

        this.loadPromises_.set(player, this.database_.loadFriends(player).then(friends => {
            this.friends_.set(player, friends);
            return null;
        }));
    }

    // Called when a player disconnects from Las Venturas Playground. Clears their friend list.
    onPlayerDisconnect(player, reason) {
        this.friends_.delete(player);
        this.loadPromises_.delete(player);

        if (player.isRegistered())
            this.lastActive_[player.userId] = Date.now();
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
}

// Value for indicating that a player is currently online on Las Venturas Playground.
FriendsManager.CURRENTLY_ONLINE = Number.MAX_SAFE_INTEGER;

exports = FriendsManager;
