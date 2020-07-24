// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplement } from 'base/supplementable.js';

// Supplements the Player object with an `account` accessor, giving other features access to the
// information associated with a player's account. This supplement will be created for players who
// are registered on the server, as well as players who are visiting us as a guest.
export class PlayerAccountSupplement extends Supplement {
    isRegistered_ = false;
    isIdentified_ = false;

    hasRequestedUpdate_ = false;

    userId_ = null;
    bankAccountBalance_ = 0;
    cashBalance_ = 0;
    reactionTests_ = 0;
    skinDecorations_ = [];
    mutedUntil_ = null;

    // Gets the permanent user Id that has been assigned to this user. Read-only.
    get userId() { return this.userId_; }

    // Gets or sets the balance this user has on their bank account. Writes will be processed as
    // high priority, because 
    get bankAccountBalance() { return this.bankAccountBalance_; }
    set bankAccountBalance(balance) {
        if (!this.isIdentified_)
            return;  // deliberately break this for guests

        this.bankAccountBalance_ = balance;
        this.requestUpdate();
    }

    // Gets or sets the amount of cash the player has on their person right now.
    get cashBalance() { return this.cashBalance_; }
    set cashBalance(value) { this.cashBalance_ = value; }

    // Gets or sets the number of reaction tests that this player has won.
    get reactionTests() { return this.reactionTests_; }
    set reactionTests(value) { this.reactionTests_ = value; }

    // Gets or sets the time until when the player has been muted, if at all.
    get mutedUntil() { return this.mutedUntil_; }
    set mutedUntil(value) { this.mutedUntil_ = value; }

    // Gets or sets the array of skin decorations this player should have.
    get skinDecorations() { return this.skinDecorations_; }
    set skinDecorations(value) { this.skinDecorations_ = value; }

    // Returns whether the player is registered with Las Venturas Playground.
    isRegistered() { return this.isRegistered_; }

    // Returns whether the player owning this account has completed identification.
    isIdentified() { return this.isIdentified_; }

    // Returns whether this account data has requested an update, for fields of high importance.
    hasRequestedUpdate() { return this.hasRequestedUpdate_; }

    // Called when the account data is being initialized from the database. Should do the necessary
    // data transformations to make the data types appropriate for JavaScript. (E.g. colours.)
    initializeFromDatabase(player, databaseRow) {
        this.userId_ = databaseRow.user_id;
        this.bankAccountBalance_ = databaseRow.money_bank;
        this.cashBalance_ = databaseRow.money_cash;
        this.reactionTests_ = databaseRow.stats_reaction;
        this.skinDecorations_ = [];
        this.mutedUntil_ = null;

        // |skin_decorations| are stored as a comma-divided list of model Ids.
        if (databaseRow.skin_decorations && databaseRow.skin_decorations.length > 0)
            this.skinDecorations_ = databaseRow.skin_decorations.split(',').map(id => parseInt(id));

        // |muted| is stored as the number of remaining seconds on their punishment.
        if (databaseRow.muted > 0)
            this.mutedUntil_ = server.clock.monotonicallyIncreasingTime() + 1000 * databaseRow.muted

        // Color information will be stored on the player's colour state, when configured.
        if (databaseRow.custom_color !== 0)
            player.colors.customColor = Color.fromNumberRGBA(databaseRow.custom_color);

        // Statistics that will be stored by the PlayerStatsSupplement instead.
        player.stats.enduring.onlineTime = databaseRow.online_time;
        player.stats.enduring.deathCount = databaseRow.death_count;
        player.stats.enduring.killCount = databaseRow.kill_count;
        player.stats.enduring.damageGiven = databaseRow.stats_damage_given;
        player.stats.enduring.damageTaken = databaseRow.stats_damage_taken;
        player.stats.enduring.shotsHit = databaseRow.stats_shots_hit;
        player.stats.enduring.shotsMissed = databaseRow.stats_shots_missed;
        player.stats.enduring.shotsTaken = databaseRow.stats_shots_taken;

        this.isRegistered_ = true;
        this.isIdentified_ = true;
    }

    // Called when the account data is being written to the database. Can happen multiple times for
    // the lifetime of this object.
    prepareForDatabase(player) {
        const currentTime = server.clock.monotonicallyIncreasingTime();

        this.hasRequestedUpdate_ = false;
        return {
            user_id: this.userId_,
            custom_color: player.colors.customColor?.toNumberRGBA() ?? 0,
            // TODO: include |online_time|
            kill_count: player.stats.enduring.killCount,
            death_count: player.stats.enduring.deathCount,
            money_bank: this.bankAccountBalance_,
            money_cash: this.cashBalance_,
            skin_decorations: this.skinDecorations_.join(','),
            stats_reaction: this.reactionTests_,
            stats_damage_given: player.stats.enduring.damageGiven,
            stats_damage_taken: player.stats.enduring.damageTaken,
            stats_shots_hit: player.stats.enduring.shotsHit,
            stats_shots_missed: player.stats.enduring.shotsMissed,
            stats_shots_taken: player.stats.enduring.shotsTaken,
            muted: Math.max(Math.floor(((this.mutedUntil_ || currentTime) - currentTime) / 1000), 0),
        };
    }

    // Call this method when a property write should be reflected in the database with priority.
    requestUpdate() { this.hasRequestedUpdate_ = true; }
}
