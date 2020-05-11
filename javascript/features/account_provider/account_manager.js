// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountData } from 'features/account_provider/account_data.js';
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

        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // Returns the AccountData associated with the given |player|.
    getAccountDataForPlayer(player) {
        return this.accounts_.get(player);
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager observers
    // ---------------------------------------------------------------------------------------------

    onPlayerConnect(player) {
        this.accounts_.set(player, new AccountData());

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

            this.accounts_.get(player).initializeFromDatabase(databaseData);

            // Now that the player's account has been initialized, tell the rest of the server.
            server.playerManager.onPlayerLogin(event);
        });
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
        const accountData = this.accounts_.get(player);
        if (!accountData || !accountData.hasIdentified())
            return;  // the |player| was never identified to their account
        
        // Deliberately do not wait for the save operation to complete.
        this.database_.saveAccountData(accountData.prepareForDatabase());
        this.accounts_.delete(player);
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
