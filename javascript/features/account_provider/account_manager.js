// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// Delay, in seconds, before a player's data will be written to the database after they disconnect.
const kPlayerDisconnectQueryDelayMs = 1000;

// The account manager keeps track of in-game players and ensures that all information necessary to
// their account is loaded at the appropriate time, and will be securely stored when needed.
export class AccountManager {
    database_ = null;

    constructor(database) {
        this.database_ = database;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerlogin', AccountManager.prototype.onPlayerLoginEvent.bind(this));
        this.callbacks_.addEventListener(
            'playerguestlogin', AccountManager.prototype.onPlayerGuestLoginEvent.bind(this));

        provideNative('SetIsRegistered', 'ii', AccountManager.prototype.setIsRegistered.bind(this));

        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // native SetIsRegistered(playerid, bool: isRegistered);
    //
    // Sets whether the |playerid| is registered, and has to identify to their account prior to
    // being able to interact with the server.
    setIsRegistered(playerid, isRegistered) {
        const player = server.playerManager.getById(playerid);
        const registered = !!isRegistered;

        if (!player)
            return 0;  // the given |playerid| does not point to a valid player

        player.account.isRegistered_ = registered;
        
        if (!registered)
            server.playerManager.onPlayerGuestSession(player);

        return 1;
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager observers
    // ---------------------------------------------------------------------------------------------

    onPlayerConnect(player) {
        // Implement this method when account management completely moves to JavaScript. We have to
        // start loading their profile data, and check whether they're banned or not.
    }

    // Called when a player has identified to their account. Starts to load their account data and
    // make it available to other parts of the server. Invoked as a Pawn event.
    onPlayerLoginEvent(event) { 
        const player = server.playerManager.getById(event.playerid);
        const userId = event.userid;

        if (!player || !userId)
            return;  // either the given player or user Id in the event are invalid.

        this.database_.loadAccountData(userId).then(databaseData => {
            if (!databaseData || !player.isConnected())
                return;  // the |player| has disconnected from the server since

            player.account.initializeFromDatabase(databaseData);

            // Now that the player's account has been initialized, tell the rest of the server.
            server.playerManager.onPlayerLogin(event);
        });
    }

    // Called when a player was asked to identify, but failed to and has been logged in as a guest
    // with a new nickname instead. Invoked as a Pawn event.
    onPlayerGuestLoginEvent(event) {
        const player = server.playerManager.getById(event.playerId);
        if (!player)
            return;  // the |player| does not exist (anymore)
        
        player.account.isRegistered_ = false;

        server.playerManager.onPlayerNameChange(player, /* update= */ true);
        server.playerManager.onPlayerGuestSession(player);
    }

    // Called when the |player| has disconnected from the server.
    onPlayerDisconnect(player) {
        if (!player.account.isIdentified())
            return;  // the |player| was never identified to their account

        // When running a test, run the store immediately to get coverage over the functionality,
        // but do not wait for the |kPlayerDisconnectQueryDelayMs| delay like we do in production.
        if (server.isTest()) {
            this.database_.saveAccountData(player.account.prepareForDatabase());
            return;
        }

        // Have a second's delay before saving the player's data to the account, allowing for other
        // parts of the game to make their final adjustments before they're gone.
        wait(kPlayerDisconnectQueryDelayMs).then(() =>
            this.database_.saveAccountData(player.account.prepareForDatabase()));
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        provideNative('SetIsRegistered', 'ii', () => 0);

        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
