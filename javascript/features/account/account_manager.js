// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// The account manager keeps track of in-game players and ensures that all information necessary to
// their account is loaded at the appropriate time, and will be securely stored when needed.
export class AccountManager {
    database_ = null;

    // Map from |Player| to the AccountData instance for their account, if any.
    accounts_ = null;

    constructor(database) {
        this.database_ = database;

        this.accounts_ = new Map();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerlogin', AccountManager.prototype.onPlayerLoginEvent.bind(this));
        this.callbacks_.addEventListener(
            'playerguestlogin', AccountManager.prototype.onPlayerGuestLoginEvent.bind(this));

        server.playerManager.addObserver(this);
    }

    // Returns the AccountData associated with the given |player|, or undefined when there is none.
    getAccountDataForPlayer(player) {
        return this.accounts_.get(player);
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
        // TODO: Load the player's account.

        server.playerManager.onPlayerLogin(event);
    }

    // Called when a player was asked to identify, but failed to and has been logged in as a guest
    // with a new nickname instead. Invoked as a Pawn event.
    onPlayerGuestLoginEvent(event) {
        const player = server.playerManager.getById(event.playerId);
        if (player)
            player.setNameForGuestLogin(event.guestPlayerName);
    }

    // Called when the |player| has disconnected from the server.
    onPlayerDisconnect(player) {
        // TODO: Save & unload the player's account.
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.accounts_.clear();
        this.accounts_ = null;
    }
}
