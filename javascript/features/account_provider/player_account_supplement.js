// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplement } from 'base/supplementable.js';

// Supplements the Player object with an `account` accessor, giving other features access to the
// information associated with a player's account.
export class PlayerAccountSupplement extends Supplement {
    player_ = null;
    manager_ = null;

    // The AccountData instance that's been created for this player.
    data_ = null;

    constructor(player, manager) {
        super();

        this.player_ = player;
        this.manager_ = manager;

        this.data_ = this.manager_.getAccountDataForPlayer(this.player_);
    }

    // Returns whether the player has registered with Las Venturas Playground.
    isRegistered() {
        return this.data_.isRegistered();
    }

    // Returns whether the player, when registered, has identified to their account.
    isIdentified() {
        return this.data_.hasIdentified();
    }

    // Gets their user Id. Only available if they've identified, undefined otherwise. Read-only.
    get userId() {
        return this.data_.userId;
    }

    // Gets or sets the balance of their bank account. Limited to the valid range of JavaScript
    // integers, stored as an int64_t in the MySQL database.
    get bankAccountBalance() {
        return this.data_.bankAccountBalance || 0;
    }
    set bankAccountBalance(balance) {
        if (this.data_.hasIdentified())
            this.data_.bankAccountBalance = balance;
    }

    // Gets or sets the number of reaction tests that the player has won.
    get reactionTests() { return this.data_.reactionTests || 0; }
    set reactionTests(value) { this.data_.reactionTests = value; }

    // Gets or sets the time until when the player has been muted, if at all.
    get mutedUntil() { return this.data_.mutedUntil || 0; }
    set mutedUntil(value) { this.data_.mutedUntil = value; }
}
