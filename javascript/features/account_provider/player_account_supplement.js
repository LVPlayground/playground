// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplement } from 'base/supplementable.js';

// Supplements the Player object with an `account` accessor, giving other features access to the
// information associated with a player's account. Because it's not certain that a player is
// registered with Las Venturas Playground, the optional chaining operator is your friend here:
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
export class PlayerAccountSupplement extends Supplement {
    player_ = null;
    manager_ = null;

    constructor(player, manager) {
        super();

        this.player_ = player;
        this.manager_ = manager;
    }

    // Returns whether the player has registered with Las Venturas Playground.
    isRegistered() {
        return this.manager_.getAccountDataForPlayer(this.player_) !== undefined;
    }

    // Returns whether the player, when registered, has identified to their account.
    isIdentified() {
        const accountData = this.manager_.getAccountDataForPlayer(this.player_);
        return accountData && accountData.hasIdentified();
    }

    // Gets their user Id. Only available if they've identified, undefined otherwise. Read-only.
    get userId() { return this.manager_.getAccountDataForPlayer(this.player_)?.userId; }

    // Gets or sets the balance of their bank account. Limited to the valid range of JavaScript
    // integers, stored as an int64_t in the MySQL database.
    get bankAccountBalance() {
        return this.manager_.getAccountDataForPlayer(this.player_)?.bankAccountBalance || 0;
    }
    set bankAccountBalance(balance) {
        const accountData = this.manager_.getAccountDataForPlayer(this.player_);
        if (accountData && accountData.hasIdentified())
            accountData.bankAccountBalance = balance;
    }
}
