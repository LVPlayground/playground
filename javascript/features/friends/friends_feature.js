// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js'),
      FriendsCommands = require('features/friends/friends_commands.js'),
      FriendsManager = require('features/friends/friends_manager.js');

// Players have the ability to maintain a list of their friends on Las Venturas Playground. These
// indicate one-directional relations, as there are no approval processes or notifications. See the
// README.md file for a list of features enabled by friends.
class FriendsFeature extends Feature {
  constructor(playground) {
    super(playground);

    this.friendsManager_ = new FriendsManager(playground.database, this.createEventListener());
    this.friendsCommands_ = new FriendsCommands(this.friendsManager_, playground.commandManager);
  }

  // Returns a promise that will be resolved with a boolean indicating whether |player| has added
  // |friendPlayer| as a friend. Both players must be registered and logged in to their accounts.
  hasFriend(player, friendPlayer) {
    return this.friendsManager_.hasFriend(player, friendPlayer);
  }
}

exports = FriendsFeature;
