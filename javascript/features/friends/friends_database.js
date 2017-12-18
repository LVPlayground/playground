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
        users_friends.friend_active = 1 AND
        users.username IS NOT NULL`;

// Query for loading the list of friends of a specific player.
const GET_FRIENDS_QUERY = `
    SELECT
        friend_id
    FROM
        users_friends
    WHERE
        user_id = ? AND
        friend_active = 1`;

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
    // Asynchronously loads the friends for |player| from the database.
    async loadFriends(player) {
        const results = await server.database.query(LOAD_QUERY, player.userId);

        let friends = [];

        results.rows.forEach(row => {
            friends.push({
                userId: row.friend_id,
                name: row.friend_name,
                lastSeen: row.friend_last_seen * 1000
            });
        });

        return friends;
    }

    // Gets a set of the friends of |userId|.
    async getFriendsSet(userId) {
        const friends = new Set();

        const data = await server.database.query(GET_FRIENDS_QUERY, userId);
        data.rows.forEach(friendId => friends.add(friendId));

        return friends;
    }

    // Asynchronously adds a relationship from |player| to |friend|.
    async addFriend(player, friend) {
        await server.database.query(ADD_QUERY, player.userId, friend.userId);
    }

    // Asynchronously removes the relationship from |player| to the friend with |friendUserId|.
    async removeFriend(player, friendUserId) {
        await server.database.query(REMOVE_QUERY, player.userId, friendUserId);
    }
}

export default FriendsDatabase;
