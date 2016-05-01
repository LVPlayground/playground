// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// MySQL query for adding a new friend relation from one player to another.
const ADD_QUERY = `
  INSERT INTO
    users_friends
    (user_id, friend_id, friend_added, friend_active)
  VALUES
    (?, ?, NOW(), 1)`;

// MySQL query for fetching the list of friends a player has.
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

const REMOVE_QUERY = `
  UPDATE
    users_friends
  SET
    users_friends.friend_active = 0
  WHERE
    users_friends.user_id = ? AND
    users_friends.friend_id = ?`;

// Manager and database interactions for the friends feature. Acts as a backend for both the public
// API and the commands exposed as part of this feature.
//
// An object of last active times is being maintained by this class, containing a map from nicknames
// to either |CurrentlyOnline| or a timestamp representing their most recent disconnection time.
class FriendsManager {
  constructor(database) {
    this.database_ = database;

    this.friends_ = {};
    this.lastActive_ = {};
    this.loadPromises_ = {};

    server.playerManager.addObserver(this);
  }

  // Called when a player connects to Las Venturas Playground. Players that added them to their
  // friend list will hear a sound informing them of their connection. Note that there are cases
  // where this could go wrong, for example when someone uses a registered name that's not theirs.
  onPlayerConnect(player) {
    const playerName = player.name;
    Object.keys(this.friends_).forEach(playerId => {
      if (!this.friends_[playerId].find(friend => friend.name == playerName))
        return;

      const targetPlayer = server.playerManager.getById(playerId);
      if (targetPlayer)
        targetPlayer.playSound(1083 /* SOUND_ROULETTE_ADD_CASH */);
    });
  }

  // Called when a player disconnects from Las Venturas Playground. Clears their friend list.
  onPlayerDisconnect(player, reason) {
    if (this.friends_.hasOwnProperty(player.id))
      delete this.friends_[player.id];
    if (this.loadPromises_.hasOwnProperty(player.id))
      delete this.loadPromises_[player.id];

    if (player.isRegistered())
      this.lastActive_[player.userId] = Date.now();
  }

  // Called when a player logs in to their account. Will start loading their friends.
  onPlayerLogin(player, userId) {
    this.lastActive_[userId] = FriendsManager.CURRENTLY_ONLINE;
    this.loadPromises_[player.id] = this.database_.query(LOAD_QUERY, userId).then(results => {
      let friends = [];

      results.rows.forEach(row => {
        friends.push({
          userId: row.friend_id,
          name: row.friend_name,
          lastSeen: row.friend_last_seen * 1000
        });
      });

      this.friends_[player.id] = friends;
      return null;
    });
  }

  // Adds |friendPlayer| as a friend of |player|. Returns a promise that will be resolved when the
  // relationship has been created in the database.
  addFriend(player, friendPlayer) {
    return this.hasFriend(player, friendPlayer).then(exists => {
      if (exists)
        return;  // nothing to do, the relation already exists.

      this.friends_[player.id].push({
        userId: friendPlayer.userId,
        name: friendPlayer.name,
        lastSeen: Date.now()
      });

      return this.database_.query(ADD_QUERY, player.userId, friendPlayer.userId);
    });
  }

  // Returns a promise that will be resolved with the list of friends of |player|.
  getFriends(player) {
    if (!player.isRegistered())
      return Promise.resolve([]);

    return this.loadPromises_[player.id].then(() => {
      // Sort the friends by their nickname. This does modify the |this.friends_| entry too.
      const friends = this.friends_[player.id].sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

      // Function for determining if |friend| is currently online.
      const isOnline = friend => this.lastActive_[friend.userId] == FriendsManager.CURRENTLY_ONLINE;

      return {
        online: this.friends_[player.id].filter(friend => isOnline(friend)).map(f => f.name),
        offline: this.friends_[player.id].filter(friend => !isOnline(friend)).map(f => f.name)
      };
    });
  }

  // Returns a promise that will be resolved with a boolean indicating whether |player| has added
  // |friendPlayer| as a friend. Both players must be registered and logged in to their accounts.
  hasFriend(player, friendPlayer) {
    if (!player.isRegistered() || !friendPlayer.isRegistered())
      return Promise.resolve(false /* has_friend */);

    const friendUserId = friendPlayer.userId;

    return this.loadPromises_[player.id].then(() => {
      for (let friend of this.friends_[player.id]) {
        if (friend.userId == friendUserId)
          return true;
      }

      return false;
    });
  }

  // Removes |nickname| as a friend of |player|, which does not have to be their complete name.
  // Returns a promise that will be resolved with the removed player's name when the relationship
  // has been removed from both the local state and the database.
  removeFriend(player, nickname) {
    if (!player.isRegistered())
      return Promise.reject(new Error('The |player| must be registered.'));

    // Try to interpret |nickname| as a player Id when it's been given as a number.
    if (Number.isInteger(parseInt(nickname))) {
      const targetPlayer = server.playerManager.getById(parseInt(nickname));
      if (targetPlayer)
        nickname = targetPlayer.name;
    }

    const normalizedName = nickname.toLowerCase();

    return this.loadPromises_[player.id].then(() => {
      let removeNickname = null;
      let removeUserId = null;

      for (let friend of this.friends_[player.id]) {
        if (!friend.name.toLowerCase().includes(normalizedName))
          continue;

        if (removeNickname !== null && removeUserId != friend.userId)
          throw new Error('More than one friend matches the nickname you gave: ' + nickname);

        removeNickname = friend.name;
        removeUserId = friend.userId;
      }

      if (removeUserId === null)
        throw new Error('No friends match the nickname you gave: ' + nickname);

      // Remove the friend from the cached list of friends.
      this.friends_[player.id] = this.friends_[player.id].filter(f => removeUserId != f.userId);

      return this.database_.query(REMOVE_QUERY, player.userId, removeUserId).then(() => {
        return removeNickname;
      });
    });
  }

  dispose() {
    server.playerManager.removeObserver(this);
  }
}

// Value for indicating that a player is currently online on Las Venturas Playground.
FriendsManager.CURRENTLY_ONLINE = Number.MAX_SAFE_INTEGER;

exports = FriendsManager;
