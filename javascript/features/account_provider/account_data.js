// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Contains all information associated with a player's account in the MySQL database. Will initially
// represent an unidentified player, who will transition to an identified player upon a call to the
// `initializeFromDatabase()` method. When the data is being written again, the database will call
// the `prepareForDatabase()` method. This allows AccountData to do the necessary transformations.
//
// When writing important properties, their setter is able to call the `requestUpdate()` method.
// This will queue up the data to be synchronized with the database in the very near future.
export class AccountData {
    isRegistered_ = false;

    hasIdentified_ = false;
    hasRequestedUpdate_ = false;

    userId_ = undefined;
    bankAccountBalance_ = undefined;
    reactionTests_ = undefined;

    // Gets the permanent user Id that has been assigned to this user. Read-only.
    get userId() { return this.userId_; }

    // Gets or sets the balance this user has on their bank account. Writes will be processed as
    // high priority, because 
    get bankAccountBalance() { return this.bankAccountBalance_; }
    set bankAccountBalance(balance) {
        this.bankAccountBalance_ = balance;
        this.requestUpdate();
    }

    // Gets or sets the number of reaction tests that this player has won.
    get reactionTests() { return this.reactionTests_; }
    set reactionTests(value) { this.reactionTests_ = value; }

    // Returns whether the player is registered with Las Venturas Playground.
    isRegistered() { return this.isRegistered_; }

    // Returns whether the player owning this account has completed identification.
    hasIdentified() { return this.hasIdentified_; }

    // Returns whether this account data has requested an update, for fields of high importance.
    hasRequestedUpdate() { return this.hasRequestedUpdate_; }

    // Called when the account data is being initialized from the database. Should do the necessary
    // data transformations to make the data types appropriate for JavaScript. (E.g. colours.)
    initializeFromDatabase(databaseRow) {
        this.userId_ = databaseRow.user_id;
        this.bankAccountBalance_ = databaseRow.money_bank;
        this.reactionTests_ = databaseRow.stats_reaction;

        this.isRegistered_ = true;
        this.hasIdentified_ = true;
    }

    // Called when the account data is being written to the database. Can happen multiple times for
    // the lifetime of this object.
    prepareForDatabase() {
        this.hasRequestedUpdate_ = false;
        return {
            user_id: this.userId_,
            money_bank: this.bankAccountBalance_,
            stats_reaction: this.reactionTests_,
        };
    }

    // Call this method when a property write should be reflected in the database with priority.
    requestUpdate() { this.hasRequestedUpdate_ = true; }
}
