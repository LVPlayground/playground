// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Gang = require('features/gangs/gang.js');
const GangDatabase = require('features/gangs/gang_database.js');
const GangZones = require('features/gangs/gang_zones.js');
const MockGangDatabase = require('features/gangs/test/mock_gang_database.js');

// The gang manager is responsible for managing all current information associated with gangs
// whose players are logged in to Las Venturas Playground. It also mediates between the commands,
// feature API and persistent storage in the database.
class GangManager {
    constructor(settings) {
        this.database_ = server.isTest() ? new MockGangDatabase()
                                         : new GangDatabase();

        this.zones_ = new GangZones(this, settings);

        this.gangs_ = new Map();
        this.gangPlayers_ = new WeakMap();

        this.observers_ = new Set();

        // Subscribe to notifications for connecting and disconnecting players.
        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    // Gets an array having the Gang instances for each of the gangs for in-game representation.
    get gangs() { return Array.from(this.gangs_.values()); }

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
        if (!player.isRegistered())
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
            this.invokeObservers('onUserJoinGang', player.userId, gang.id)

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
                gangPlayers[player.userId] = player;

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
    addPlayerToGang(player, gang) {
        if (!player.isRegistered())
            return Promise.reject(new Error('The player must registered in order to join a gang.'));

        if (this.gangPlayers_.has(player))
            return Promise.reject(new Error('The player already is part of a gang.'));

        return this.database_.addPlayerToGang(player, gang).then(result => {
            if (!player.isConnected())
                return null;  // the player is not connected to the server anymore

            // Associate the |player| with the |gang| as its leader.
            gang.addPlayer(player, Gang.ROLE_MEMBER);

            // Associate the |gang| with the |player|.
            this.gangPlayers_.set(player, gang);

            // Announce the |player|'s new gang to observers.
            this.invokeObservers('onUserJoinGang', player.userId, gang.id)

            return gang;
        });
    }

    // Removes |player| from the |gang|. This will also be reflected in the database. A promise will
    // be returned that will be resolved when the removal has been completed.
    removePlayerFromGang(player, gang) {
        if (!gang.hasPlayer(player))
            return Promise.reject(new Error('The |player| is not part of the |gang|.'));

        return this.database_.removePlayerFromGang(player.userId, gang).then(result => {
            if (!result) {
                // There is nothing we can do in this case, just output a warning to the log.
                console.log('[GangManager] Failed to remove the affiliation of ' + player.name +
                            ' with gang ' + gang.name + ' from the database.');
            }

            // Remove the association of |player| with the |gang|.
            gang.removePlayer(player);

            // Remove the association of the |gang| with the |player|.
            this.gangPlayers_.delete(player);

            // Announce the |player|'s departure to observers.
            this.invokeObservers('onUserLeaveGang', player.userId, gang.id);

            if (!gang.memberCount)
                this.gangs_.delete(gang.id);
        });
    }

    // Removes the member with |userId| from the |gang|. This method should be used if the player
    // is not currently in-game, but does have to be removed from the gang.
    removeMemberFromGang(userId, gang) {
        return this.database_.removePlayerFromGang(userId, gang).then(() => {
            // Announce the |player|'s departure to observers.
            this.invokeObservers('onUserLeaveGang', userId, gang.id);
        });
    }

    // Determines which player should become the leader of the |gang| after |player| leaves, who
    // currently is one of the gang's leader. The succession rules are as follows:
    //     (1) Current leaders next to |player|.
    //     (2) The manager with the longest tenure in the gang.
    //     (3) The member with the longest tenure in the gang.
    determineSuccessionAfterDeparture(player, gang) {
        if (!gang.hasPlayer(player))
            return Promise.reject(new Error('The |player| is not part of the |gang|.'));

        if (gang.getPlayerRole(player) !== Gang.ROLE_LEADER)
            return Promise.reject(new Error('The |player| is not a leader of the |gang|.'));

        return this.database_.determineSuccessionAfterDeparture(player, gang);
    }

    // Updates the role of |userId| in |gang| to |role|. If the player with |userId| is currently
    // part of the |gang|, they will be told about the change.
    updateRoleForUserId(userId, gang, role) {
        return this.database_.updateRoleForUserId(userId, gang, role).then(() => {
            for (const player of gang.members) {
                if (player.userId !== userId)
                    continue;

                gang.addPlayer(player, role);
                return;
            }
        });
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
    updateColor(gang, color) {
        return this.database_.updateColor(gang, color).then(() => {
            gang.updateColor(color);
        });
    }

    // Updates the preference of |player| within |gang| to use the common gang color when the
    // |useGangColor| parameter is set to true, or their personal color otherwise.
    updateColorPreference(gang, player, useGangColor) {
        if (gang.usesGangColor(player) === useGangColor)
            return Promise.resolve();  // no need to update the value

        return this.database_.updateColorPreference(gang, player, useGangColor).then(() => {
            gang.setUsesGangColor(player, useGangColor);
        });
    }

    // Updates the |gang|'s name to be |name|. Will return a promise when the operation has
    // completed, TRUE means the tag has been changed, FALSE means another gang owns it.
    updateName(gang, name) {
        return this.database_.doesNameExist(name).then(exists => {
            if (exists)
                return false;  // name is owned by another gang

            return this.database_.updateName(gang, name).then(() => {
                gang.name = name;
                return true;
            });
        });
    }

    // Updates the |gang|'s tag to be |tag|. Will return a promise when the operation has completed,
    // TRUE means the tag has been changed, FALSE means another gang owns it.
    updateTag(gang, tag) {
        return this.database_.doesTagExist(tag).then(exists => {
            if (exists)
                return false;  // tag is owned by another gang

            return this.database_.updateTag(gang, tag).then(() => {
                gang.tag = tag;
                return true;
            });
        });
    }

    // Updates the |gang|'s goal to be |goal| in both the local state and in the database. Returns
    // a promise that will be resolved when the goal has been updated.
    updateGoal(gang, goal) {
        return this.database_.updateGoal(gang, goal).then(() => {
            gang.goal = goal;
        });
    }

    // Called when |player| has logged in to their Las Venturas Playground account. Will check with
    // the database to see if they should automatically join a gang.
    onPlayerLogin(player, eventData) {
        if (!eventData.hasOwnProperty('gangid') || !eventData.gangid)
            return;

        this.database_.loadGangForPlayer(player.userId, eventData.gangid).then(result => {
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
            delete this.gangs_[gang.id];
    }

    // Cleans up all state stored by the gang manager.
    dispose() {
        server.playerManager.removeObserver(this);

        this.zones_.dispose();
        this.zones_ = null;
    }
}

exports = GangManager;
