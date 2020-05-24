// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Gang from 'features/gangs/gang.js';
import GangDatabase from 'features/gangs/gang_database.js';
import { GangFinance } from 'features/gangs/gang_finance.js';

import MockGangDatabase from 'features/gangs/test/mock_gang_database.js';

// The gang manager is responsible for managing all current information associated with gangs
// whose players are logged in to Las Venturas Playground. It also mediates between the commands,
// feature API and persistent storage in the database.
class GangManager {
    constructor(settings) {
        this.database_ = server.isTest() ? new MockGangDatabase()
                                         : new GangDatabase();

        this.gangs_ = new Map();
        this.gangPlayers_ = new WeakMap();

        this.finance_ = new GangFinance(this.database_, this);

        this.observers_ = new Set();

        // Subscribe to notifications for connecting and disconnecting players.
        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    // Gets the database which provides long-term data access for the gang.
    get database() { return this.database_; }

    // Gets an array having the Gang instances for each of the gangs for in-game representation.
    get gangs() { return Array.from(this.gangs_.values()); }

    // Gets access to the GangFinance instance owned by this manager.
    get finance() { return this.finance_; }

    // Returns the Gang that |player| is part of. Returns NULL when they are not part of a gang.
    gangForPlayer(player) {
        return this.gangPlayers_.get(player) || null;
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the |observer| as a gang mutation observer, that will be informed of changes in the
    // members that are part of a gang. It's safe to add |observer| multiple times.
    addObserver(observer) {
        this.observers_.add(observer);
    }

    // Removes the |observer| from the list of gang mutation observers.
    removeObserver(observer) {
        this.observers_.delete(observer);
    }

    // Invokes the |method| on the attached gang observers with the given |...args|.
    invokeObservers(method, ...args) {
        for (const observer of this.observers_) {
            if (!observer.__proto__.hasOwnProperty(method))
                continue;

            observer.__proto__[method].call(observer, ...args);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Sends the |message| to the |gang|. The |excludePlayer| triggered the message and will get
    // confirmed through other means. Optionally the |args| will be applied when the |message| is an
    // instance of the Message class that requires formatting.
    announceToGang(gang, excludePlayer, message, ...args) {
        if (message instanceof Message)
            message = Message.format(message, ...args);

        const formattedMessage = Message.format(Message.GANG_ANNOUNCE_INTERNAL, message);

        for (let player of gang.members) {
            if (player === excludePlayer)
                continue;

            player.sendMessage(formattedMessage);
        }
    }

    // Creates a gang with |tag|, named |name| pursuing |goal| and stores it in the database. When
    // successful, |player| will be added to the gang as its leader. Error messages thrown by this
    // method may be presented to users.
    createGangForPlayer(player, tag, name, goal) {
        if (!player.account.isRegistered())
            return Promise.reject(new Error('You must be registered in order to create a gang.'));

        if (this.gangPlayers_.has(player))
            return Promise.reject(new Error('You are already part of a gang.'));

        return this.database_.doesGangExists(tag, name).then(result => {
            if (!result.available)
                throw new Error('The gang is too similar to [' + result.tag + '] ' + result.name);

            return this.database_.createGangWithLeader(player, tag, name, goal);
        }).then(gangInfo => {
            if (!player.isConnected())
                return null;  // the player is not connected to the server anymore

            const gang = new Gang(gangInfo);

            // Associate the |player| with the |gang| as its leader.
            gang.addPlayer(player, Gang.ROLE_LEADER);

            // Associate the |gang| with the |player|.
            this.gangPlayers_.set(player, gang);
            this.gangs_.set(gang.id, gang);

            // Announce the |player|'s new gang to observers.
            this.invokeObservers('onUserJoinGang', player.account.userId, gang.id, gang)

            return gang;
        });
    }

    // Gets a complete lisy of the |gang|'s members from the database, including this players who
    // are not on the server right now. Those logged in will be annotated. Optionally, the players
    // can be grouped by role by setting the |groupByRole| argument.
    getFullMemberList(gang, groupByRole = false) {
        return this.database_.getFullMemberList(gang).then(members => {
            let gangPlayers = {};

            let gangMembersUngrouped = [];
            let gangMembers = {
                leaders: [],
                managers: [],
                members: []
            };

            for (let player of gang.members)
                gangPlayers[player.account.userId] = player;

            members.forEach(member => {
                const memberInfo = {
                    nickname: member.username,
                    player: gangPlayers[member.userId] || null,
                    role: member.role,
                    userId: member.userId
                };

                // Add them to the single big array when not grouping by role.
                if (!groupByRole) {
                    gangMembersUngrouped.push(memberInfo);
                    return;
                }

                // Add them to the appropriate group otherwise.
                switch (member.role) {
                    case Gang.ROLE_LEADER:
                        gangMembers.leaders.push(memberInfo);
                        break;
                    case Gang.ROLE_MANAGER:
                        gangMembers.managers.push(memberInfo);
                        break;
                    case Gang.ROLE_MEMBER:
                        gangMembers.members.push(memberInfo);
                        break;
                    default:
                        throw new Error('Invalid role: ' + members.role);
                }
            });

            return groupByRole ? gangMembers : gangMembersUngrouped;
        });
    }

    // Adds |player| to the |gang|. This will also be reflected in the database. A promise will be
    // returned that will be resolved when the removal has been completed.
    async addPlayerToGang(player, gang) {
        if (!player.account.isRegistered())
            throw new Error('The player must registered in order to join a gang.');

        if (this.gangPlayers_.has(player))
            throw new Error('The player already is part of a gang.');

        await this.database_.addPlayerToGang(player, gang);
        if (!player.isConnected())
            return null;  // the player is not connected to the server anymore

        // Associate the |player| with the |gang| as its leader.
        gang.addPlayer(player, Gang.ROLE_MEMBER);

        // Associate the |gang| with the |player|.
        this.gangPlayers_.set(player, gang);

        // Announce the |player|'s new gang to observers.
        this.invokeObservers('onUserJoinGang', player.account.userId, gang.id, gang);

        return gang;
    }

    // Removes |player| from the |gang|. This will also be reflected in the database. A promise will
    // be returned that will be resolved when the removal has been completed.
    async removePlayerFromGang(player, gang) {
        if (!gang.hasPlayer(player))
            throw new Error('The |player| is not part of the |gang|.');

        await this.database_.removePlayerFromGang(player.account.userId, gang);

        // Remove the association of |player| with the |gang|.
        gang.removePlayer(player);

        // Remove the association of the |gang| with the |player|.
        this.gangPlayers_.delete(player);

        // Announce the |player|'s departure to observers.
        this.invokeObservers('onUserLeaveGang', player.account.userId, gang.id);

        if (!gang.memberCount)
            this.gangs_.delete(gang.id);
    }

    // Removes the member with |userId| from the |gang|. This method should be used if the player
    // is not currently in-game, but does have to be removed from the gang.
    async removeMemberFromGang(userId, gang) {
        await this.database_.removePlayerFromGang(userId, gang);

        // Announce the |player|'s departure to observers.
        this.invokeObservers('onUserLeaveGang', userId, gang.id);
    }

    // Determines which player should become the leader of the |gang| after |player| leaves, who
    // currently is one of the gang's leader. The succession rules are as follows:
    //     (1) Current leaders next to |player|.
    //     (2) The manager with the longest tenure in the gang.
    //     (3) The member with the longest tenure in the gang.
    async determineSuccessionAfterDeparture(player, gang) {
        if (!gang.hasPlayer(player))
            throw new Error('The |player| is not part of the |gang|.');

        if (gang.getPlayerRole(player) !== Gang.ROLE_LEADER)
            throw new Error('The |player| is not a leader of the |gang|.');

        return this.database_.determineSuccessionAfterDeparture(player, gang);
    }

    // Updates the role of |userId| in |gang| to |role|. If the player with |userId| is currently
    // part of the |gang|, they will be told about the change.
    async updateRoleForUserId(userId, gang, role) {
        await this.database_.updateRoleForUserId(userId, gang, role);

        for (const player of gang.members) {
            if (player.account.userId !== userId)
                continue;

            gang.addPlayer(player, role);
            return;
        }
    }

    // Purchases additional encryption |time|, in seconds, for the |gang|'s chat.
    async updateChatEncryption(gang, player, encryptionTime) {
        const currentTimeSeconds = Math.floor(server.clock.currentTime() / 1000);

        if (gang.chatEncryptionExpiry < currentTimeSeconds)
            gang.chatEncryptionExpiry = currentTimeSeconds + encryptionTime;
        else
            gang.chatEncryptionExpiry += encryptionTime;

        await this.database_.purchaseChatEncryption(gang, player, encryptionTime);
    }

    // Update the |gang|'s color, as well as the color of all its in-game members, to |color|. Will
    // return a promise that will be resolved when the color has been updated.
    async updateColor(gang, color) {
        await this.database_.updateColor(gang, color);

        gang.updateColor(color);

        this.invokeObservers('onGangSettingUpdated', gang);
    }

    // Updates the preference of |player| within |gang| to use the common gang color when the
    // |useGangColor| parameter is set to true, or their personal color otherwise.
    async updateColorPreference(gang, player, useGangColor) {
        if (gang.usesGangColor(player) === useGangColor)
            return;  // no need to update the value

        await this.database_.updateColorPreference(gang, player, useGangColor);

        gang.setUsesGangColor(player, useGangColor);
    }

    async updateSkinId(gang, skinId) {
        if (skinId < 0 || skinId > 299 || skinId == 121)
            return;

        await this.database_.updateSkinId(gang, skinId);

        gang.updateSkinId(skinId);

        this.invokeObservers('onGangSettingUpdated', gang);
    }

    // Updates the preference of the |player| within |gang| to use te common gang skin when the
    // |usesGangSkin| parameter is set to true, or their personal color otherwise.
    async updateSkinPreference(gang, player, usesGangSkin) {
        if (gang.usesGangSkin(player) === usesGangSkin)
            return;

        gang.setUsesGangSkin(player, usesGangSkin);

        if(usesGangSkin === true) 
            this.setSkinInPawnCode(player.id, gang.skinId, true);
    }

    // Call the spawn manager to update player skin.
    async setSkinInPawnCode(playerId, skinId, uponNextSpawn) {
        const shouldUpdateUponNextSpawn = uponNextSpawn === false ? 0 : 1;

        pawnInvoke('OnSetPlayerSkinId', 'iii', playerId, skinId, shouldUpdateUponNextSpawn);
    }

    // Updates the |gang|'s name to be |name|. Will return a promise when the operation has
    // completed, TRUE means the tag has been changed, FALSE means another gang owns it.
    async updateName(gang, name) {
        if (await this.database_.doesNameExist(name))
            return false;  // name is owned by another gang

        await this.database_.updateName(gang, name);

        gang.name = name;

        this.invokeObservers('onGangSettingUpdated', gang);
        return true;
    }

    // Updates the |gang|'s tag to be |tag|. Will return a promise when the operation has completed,
    // TRUE means the tag has been changed, FALSE means another gang owns it.
    async updateTag(gang, tag) {
        if (await this.database_.doesTagExist(tag))
            return false;  // tag is owned by another gang

        await this.database_.updateTag(gang, tag);

        gang.tag = tag;
        return true;
    }

    // Updates the |gang|'s goal to be |goal| in both the local state and in the database. Returns
    // a promise that will be resolved when the goal has been updated.
    async updateGoal(gang, goal) {
        await this.database_.updateGoal(gang, goal);

        gang.goal = goal;
    }

    // Updates the |gang|'s bank account balance access to the given |balanceAccess| value.
    async updateBalanceAccess(gang, balanceAccess) {
        await this.database_.updateBalanceAccess(gang, balanceAccess);

        gang.balanceAccess = balanceAccess;
    }

    // Called when |player| has logged in to their Las Venturas Playground account. Will check with
    // the database to see if they should automatically join a gang.
    onPlayerLogin(player, eventData) {
        if (!eventData.hasOwnProperty('gangid') || !eventData.gangid)
            return;

        this.database_.loadGangForPlayer(player.account.userId, eventData.gangid).then(result => {
            if (!player.isConnected())
                return;  // the player is not connected to the server anymore

            if (result === null) {
                console.log('[GangManager] Player ' + player.name + ' is said to be in a gang, ' +
                    'but the associated information cannot be loaded.');
                return;
            }

            const gangInfo = result.gang;

            let gang = this.gangs_.get(gangInfo.id);
            if (!gang) {
                gang = new Gang(gangInfo);
                this.gangs_.set(gangInfo.id, gang);
            }

            // Associate the |player| with the |gang|, for the appropriate role.
            gang.addPlayer(player, result.role, result.useGangColor);

            // Associate the |gang| with the |player|.
            this.gangPlayers_.set(player, gang);

            if (gang.usesGangSkin(player) && gang.skinId !== null && gang.skinId !== undefined) {
                this.setSkinInPawnCode(player.id, gang.skinId, false);
            }

            // Inform observers about the |player| whose part of |gang| now being online.
            this.invokeObservers('onGangMemberConnected', player.account.userId, gang.id);
        });
    }

    // Called when |player| disconnects from the server. Will clean up local state associated with
    // the player, and potentially their gang if they were the only connected player in it.
    onPlayerDisconnect(player, reason) {
        const gang = this.gangPlayers_.get(player);
        if (!gang)
            return;  // the player was not part of a gang

        this.gangPlayers_.delete(player);

        gang.removePlayer(player);

        if (!gang.memberCount)
            this.gangs_.delete(gang.id);
    }

    // Cleans up all state stored by the gang manager.
    dispose() {
        server.playerManager.removeObserver(this);

        this.finance_.dispose();
        this.finance_ = null;
    }
}

export default GangManager;
