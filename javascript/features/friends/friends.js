// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { FriendsCommands } from 'features/friends/friends_commands.js';
import { FriendsManager } from 'features/friends/friends_manager.js';

// Players have the ability to maintain a list of their friends on Las Venturas Playground. These
// indicate one-directional relations, as there are no approval processes or notifications. See the
// README.md file for a list of features enabled by friends.
export default class Friends extends Feature {
    constructor() {
        super();

        this.manager_ = new FriendsManager();
        this.commands_ = new FriendsCommands(this.manager_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Friends feature.
    // ---------------------------------------------------------------------------------------------

    // Asynchronously returns whether |player| has added |friendPlayer| as a friend. Both players
    // must be registered and logged in to their accounts.
    async hasFriend(player, friendPlayer) {
        return await this.manager_.hasFriend(player, friendPlayer);
    }

    // Asynchronously returns whether |player| is on the list of friends of |friendUserId|. The
    // friend does not have to be online, and results will be cached.
    async isFriendedBy(player, friendUserId) {
        return await this.manager_.isFriendedBy(player, friendUserId);
    }

    // ---------------------------------------------------------------------------------------------
    // Testing-specific API of the Friends feature.
    // ---------------------------------------------------------------------------------------------

    // Adds |toPlayer| as a friend of |fromPlayer|. Must only be used for testing purposes.
    async addFriendForTesting(fromPlayer, toPlayer) {
        await this.manager_.addFriend(fromPlayer, toPlayer);
    }

    // Removes |toPlayer| as a friend of |fromPlayer|. Must only be used for testing purposes.
    async removeFriendForTesting(fromPlayer, toPlayer) {
        await this.manager_.removeFriend(fromPlayer, toPlayer.name);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
    }
}
