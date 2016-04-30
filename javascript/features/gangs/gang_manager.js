// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Gang = require('features/gangs/gang.js');
const GangDatabase = require('features/gangs/gang_database.js');

// The gang manager is responsible for managing all current information associated with gangs
// whose players are logged in to Las Venturas Playground. It also mediates between the commands,
// feature API and persistent storage in the database.
class GangManager {
    constructor(database) {
        this.database_ = new GangDatabase(database);

        this.gangs_ = {};
        this.gangPlayers_ = new WeakMap();

        // Subscribe to notifications for connecting and disconnecting players.
        server.playerManager.addObserver(this);
    }

    // Gets an array having the Gang instances for each of the gangs for in-game representation.
    get gangs() { return Object.values(this.gangs_); }

    // Returns the Gang that |player| is part of. Returns NULL when they are not part of a gang.
    gangForPlayer(player) {
        return this.gangPlayers_.get(player) || null;
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
            this.gangs_[gang.id] = gang;

            return gang;
        });
    }

    // Removes |player| from the |gang|. This will also be reflected in the database. A promise will
    // be returned that will be resolved when the removal has been completed.
    removePlayerFromGang(player, gang) {
        if (!gang.hasPlayer(player))
            return Promise.reject(new Error('The |player| is not part of the |gang|.'));

        return this.database_.removePlayerFromGang(player, gang).then(result => {
            if (!result) {
                // There is nothing we can do in this case, just output a warning to the log.
                console.log('[GangManager] Failed to remove the affiliation of ' + player.name +
                            ' with gang ' + gang.name + ' from the database.');
            }

            // Remove the association of |player| with the |gang|.
            gang.removePlayer(player);

            // Remove the association of the |gang| with the |player|.
            this.gangPlayers_.delete(player);

            if (!gang.memberCount)
                delete this.gangs_[gang.id];
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

            let gang = null;
            if (!this.gangs_.hasOwnProperty(gangInfo.id))
                gang = this.gangs_[gangInfo.id] = new Gang(gangInfo);
            else
                gang = this.gangs_[gangInfo.id];

            // Associate the |player| with the |gang|, for the appropriate role.
            gang.addPlayer(player, result.role);

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
    }
}

exports = GangManager;
