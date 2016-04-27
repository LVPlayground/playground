// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GangDatabase = require('features/gangs/gang_database.js');

// The gang manager is responsible for managing all current information associated with gangs
// whose players are logged in to Las Venturas Playground. It also mediates between the commands,
// feature API and persistent storage in the database.
class GangManager {
    constructor(database) {
        this.database_ = new GangDatabase(database);

        // Subscribe to notifications for connecting and disconnecting players.
        server.playerManager.addObserver(this);
    }

    // Called when |player| has logged in to their Las Venturas Playground account. Will check with
    // the database to see if they should automatically join a gang.
    onPlayerLogin(player, eventData) {
        if (!eventData.hasOwnProperty('gangid') || !eventData.gangid)
            return;

        const gangId = eventData.gangid;

        // TODO(Russell): Preload information about this gang.
    }

    // Called when |player| disconnects from the server. Will clean up local state associated with
    // the player, and potentially their gang if they were the only connected player in it.
    onPlayerDisconnect(player, reason) {

    }

    // Cleans up all state stored by the gang manager.
    dispose() {
        server.playerManager.removeObserver(this);
    }
}

exports = GangManager;
