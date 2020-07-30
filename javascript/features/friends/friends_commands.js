// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implementation of the commands available as part of the friends feature, all under the entry
// point of /friends. See the README.md file for better documentation on the usage.
export class FriendsCommands {
    constructor(manager) {
        this.manager_ = manager;

        server.deprecatedCommandManager.buildCommand('friends')
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
    }

    // Called when a player types `/friends add`. Adds |friendPlayer| as a friend of |player|. This
    // will persist between playing sessions.
    async onFriendsAddCommand(player, friendPlayer) {
        if (!player.account.isRegistered()) {
            player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
            return;
        }

        if (!friendPlayer.account.isRegistered()) {
            player.sendMessage(Message.FRIENDS_ERROR_FRIEND_NOT_REGISTERED, friendPlayer.name);
            return;
        }

        if (player === friendPlayer) {
            player.sendMessage(Message.FRIENDS_ERROR_ADD_SELF);
            return;
        }

        await this.manager_.addFriend(player, friendPlayer);

        player.sendMessage(Message.FRIENDS_ADDED, friendPlayer.name);
    }

    // Lists the friends of |player|. Administrators can also list the friends of other players by
    // providing a parameter, in which case the |parameterPlayer| will be assigned a value.
    async onListFriendsCommand(player, parameterPlayer) {
        const subjectPlayer = parameterPlayer || player;

        if (!subjectPlayer.account.isRegistered()) {
            player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
            return;
        }

        // Number of friends to display in a single line of the output.
        const friendsPerRow = 8;

        // Asynchronously load the friends from the manager.
        const friends = await this.manager_.getFriends(subjectPlayer);

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
        if (friendList.length === 0) {
            player.sendMessage(Message.FRIENDS_EMPTY);
        } else {
            player.sendMessage(Message.FRIENDS_HEADER);

            let friendsOffset = 0;
            do {
                const rowFriendString =
                    friendList.slice(friendsOffset, friendsOffset + friendsPerRow).join(', ');

                player.sendMessage('{838F31}Friends{FFFFFF}: ' + rowFriendString);

                friendsOffset += friendsPerRow;

            } while (friendsOffset < friendList.length);
        }

        player.sendMessage(Message.FRIENDS_USAGE);
    }

    // Removes |name| as a friend of |player|. This will persist between playing sessions.
    async onFriendsRemoveCommand(player, name) {
        if (!player.account.isRegistered()) {
            player.sendMessage(Message.FRIENDS_ERROR_NOT_REGISTERED);
            return;
        }

        const maybePlayerId = parseInt(name, 10);
        if (!Number.isNaN(maybePlayerId)) {
            const targetPlayer = server.playerManager.getById(maybePlayerId);
            if (targetPlayer)
                name = targetPlayer.name;
        }

        const result = await this.manager_.removeFriend(player, name);
        if (!result.success) {
            player.sendMessage(Message.COMMAND_ERROR, result.message);
            return;

        }

        player.sendMessage(Message.FRIENDS_REMOVED, result.nickname);
    }

    dispose() {
        server.deprecatedCommandManager.removeCommand('friends');
    }
}
