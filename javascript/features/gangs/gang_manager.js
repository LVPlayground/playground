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

    // Returns the Gang that |player| is part of. Returns NULL when they are not part of a gang.
    gangForPlayer(player) {
        return this.gangPlayers_.get(player) || null;
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
