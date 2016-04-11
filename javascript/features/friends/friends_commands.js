// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

// Implementation of the commands available as part of the friends feature, all under the entry
// point of /friends. See the README.md file for better documentation on the usage.
class FriendsCommands {
  constructor(friendsManager, commandManager) {
    this.friendsManager_ = friendsManager;

    commandManager.buildCommand('friends')
        // /friends add [player]
        .sub('add')
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(this.__proto__.addFriend.bind(this))

        // /friends remove [name]
        .sub('remove')
            .parameters([{ name: 'name', type: CommandBuilder.WORD_PARAMETER }])
            .build(this.__proto__.removeFriend.bind(this))

        // /friends [id]
        .sub(CommandBuilder.PLAYER_PARAMETER)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(this.__proto__.listFriends.bind(this))

        // /friends
        .build(this.__proto__.listFriends.bind(this));
  }

  // Adds |friendPlayer| as a friend of |player|. This will persist between playing sessions.
  addFriend(player, friendPlayer) {
    if (!player.isRegistered()) {
      player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
      return;
    }

    if (!friendPlayer.isRegistered()) {
      player.sendMessage(Message.FRIENDS_ERROR_FRIEND_NOT_REGISTERED, friendPlayer.name);
      return;
    }

    if (player === friendPlayer) {
      player.sendMessage(Message.FRIENDS_ERROR_ADD_SELF);
      return;
    }

    this.friendsManager_.addFriend(player, friendPlayer).then(() =>
        player.sendMessage(Message.FRIENDS_ADDED, friendPlayer.name));
  }

  // Lists the friends of |player|. Administrators can also list the friends of other players by
  // providing a parameter, in which case the |parameterPlayer| will be assigned a value.
  listFriends(player, parameterPlayer) {
    const subjectPlayer = parameterPlayer || player;

    if (!subjectPlayer.isRegistered()) {
      player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
      return;
    }

    this.friendsManager_.getFriends(subjectPlayer).then(friends => {
      // Number of friends to display in a single line of the output.
      const friendsPerRow = 8;

      let friendList = [];
      friends.online.forEach(friendName => {
        const player = Player.find(friendName);
        if (player != null)
          friendList.push('{B1FC17}' + friendName + '{FFFFFF} (Id: ' + player.id + ')');
        else
          friendList.push(friendName);
      });

      friendList.push(...friends.offline);

      // Send a message whose content depends on whether the player has already added some friends.
      if (friendList.length === 0)
        player.sendMessage(Message.FRIENDS_EMPTY);
      else
        player.sendMessage(Message.FRIENDS_HEADER);

      // Split the |friendsList| array in sets of |friendsPerRow| friends.
      for (let i = 0; i < friendList.length; i += friendsPerRow)
        player.sendMessage('{838F31}Friends{FFFFFF}: ' + friendList.slice(i, i + friendsPerRow).join(', '));

      player.sendMessage(Message.FRIENDS_USAGE);
    });
  }

  // Removes |name| as a friend of |player|. This will persist between playing sessions.
  removeFriend(player, name) {
    if (!player.isRegistered()) {
      player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
      return;
    }

    this.friendsManager_.removeFriend(player, name).then(
        name  => player.sendMessage(Message.FRIENDS_REMOVED, name),
        error => player.sendMessage(Message.COMMAND_ERROR, error.message));
  }
}

exports = FriendsCommands;
