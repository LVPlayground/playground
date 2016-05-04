// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

// Implementation of the commands available as part of the friends feature, all under the entry
// point of /friends. See the README.md file for better documentation on the usage.
class FriendsCommands {
    constructor(manager) {
        this.manager_ = manager;

        server.commandManager.buildCommand('friends')
            .sub('add')
                .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
                .build(FriendsCommands.prototype.onFriendsAddCommand.bind(this))
            .sub('remove')
                .parameters([{ name: 'name', type: CommandBuilder.WORD_PARAMETER }])
                .build(FriendsCommands.prototype.onFriendsRemoveCommand.bind(this))
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(FriendsCommands.prototype.onListFriendsCommand.bind(this))
            .build(FriendsCommands.prototype.onListFriendsCommand.bind(this));

        // Promises that can be used for testing purposes.
        this.addPromiseForTesting_ = null;
        this.listPromiseForTesting_ = null;
        this.removePromiseForTesting_ = null;
    }

    // Called when a player types `/friends add`. Adds |friendPlayer| as a friend of |player|. This
    // will persist between playing sessions.
    onFriendsAddCommand(player, friendPlayer) {
        let resolveForTests = null;

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

        // Create a "friend has been added" promise that tests can use to observe progress.
        this.addPromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        this.manager_.addFriend(player, friendPlayer).then(() =>
            player.sendMessage(Message.FRIENDS_ADDED, friendPlayer.name)).then(resolveForTests);
    }

    // Lists the friends of |player|. Administrators can also list the friends of other players by
    // providing a parameter, in which case the |parameterPlayer| will be assigned a value.
    onListFriendsCommand(player, parameterPlayer) {
        const subjectPlayer = parameterPlayer || player;
        let resolveForTests = null;

        if (!subjectPlayer.isRegistered()) {
            player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
            return;
        }

        // Create a "friends have been listed" promise that tests can use to observe progress.
        this.listPromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        this.manager_.getFriends(subjectPlayer).then(friends => {
            // Number of friends to display in a single line of the output.
            const friendsPerRow = 8;

            let friendList = [];
            friends.online.forEach(friendName => {
                const player = server.playerManager.getByName(friendName);
                if (player != null)
                    friendList.push('{B1FC17}' + friendName + '{FFFFFF} (Id: ' + player.id + ')');
                else
                    friendList.push(friendName);
            });

            friendList.push(...friends.offline);

            // Text of the header depends on whether the player has already add friends.
            if (friendList.length === 0)
                player.sendMessage(Message.FRIENDS_EMPTY);
            else
                player.sendMessage(Message.FRIENDS_HEADER);

            // Split the |friendsList| array in sets of |friendsPerRow| friends.
            for (let i = 0; i < friendList.length; i += friendsPerRow) {
                const rowFriendString = friendList.slice(i, i + friendsPerRow).join(', ');

                player.sendMessage('{838F31}Friends{FFFFFF}: ' + rowFriendString);
            }

            player.sendMessage(Message.FRIENDS_USAGE);

        }).then(resolveForTests);
    }

    // Removes |name| as a friend of |player|. This will persist between playing sessions.
    onFriendsRemoveCommand(player, name) {
        let resolveForTests = null;

        if (!player.isRegistered()) {
            player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
            return;
        }

        // TODO(Russell): |name| could be the Id of an online player, which should be handled here.

        // Create a "friend has been removed" promise that tests can use to observe progress.
        this.removePromiseForTesting_ = new Promise(resolve => resolveForTests = resolve);

        this.manager_.removeFriend(player, name).then(
            name  => player.sendMessage(Message.FRIENDS_REMOVED, name),
            error => player.sendMessage(Message.COMMAND_ERROR, error.message)).then(resolveForTests)
    }

    dispose() {
        server.commandManager.removeCommand('friends');
    }
}

exports = FriendsCommands;
