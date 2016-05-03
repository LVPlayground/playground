// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query for adding a new friend relation from one player to another.
const ADD_QUERY = `
    INSERT INTO
        users_friends
        (user_id, friend_id, friend_added, friend_active)
    VALUES
        (?, ?, NOW(), 1)`;

// Query for fetching the list of friends a player has.
const LOAD_QUERY = `
    SELECT
        users_friends.friend_id,
        users.username AS friend_name,
        UNIX_TIMESTAMP(users_mutable.last_seen) AS friend_last_seen
    FROM
        users_friends
    LEFT JOIN
        users ON users.user_id = users_friends.friend_id
    LEFT JOIN
        users_mutable ON users_mutable.user_id = users_friends.friend_id
    WHERE
        users_friends.user_id = ? AND
        users_friends.friend_active = 1`;

// Query for removing a friend from a player's list of friends.
const REMOVE_QUERY = `
    UPDATE
        users_friends
    SET
        users_friends.friend_active = 0
    WHERE
        users_friends.user_id = ? AND
        users_friends.friend_id = ?`;

// Responsible for database interactions of the friends feature. Does not contain any other logic.
class FriendsDatabase {
    constructor(database) {
        this.database_ = database;
    }

    // Loads the friends for |player| from the database. Returns a promise that will be resolved
    // with an array when their list of friends is available.
    loadFriends(player) {
        return this.database_.query(LOAD_QUERY, player.userId).then(results => {
            let friends = [];

            results.rows.forEach(row => {
                friends.push({
                    userId: row.friend_id,
                    name: row.friend_name,
                    lastSeen: row.friend_last_seen * 1000
                });
            });

            return friends;
        });
    }

    // Adds a relationship from |player| to |friend|. Returns a promise that will be resolved once
    // the relationship has been stored in the database.
    addFriend(player, friend) {
        return this.database_.query(ADD_QUERY, player.userId, friend.userId).then(
            () => null /* remove the |results| data for the caller **/);
    }

    // Removes the relationship from |player| to the friend with |friendUserId|. Returns a promise
    // that will be resolved once the relationship has been removed from the database.
    removeFriend(player, friendUserId) {
        return this.database_.query(REMOVE_QUERY, player.userId, friendUserId).then(
            () => null /* remove the |results| data for the caller **/);
    }
}

exports = FriendsDatabase;
