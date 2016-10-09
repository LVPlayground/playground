// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// The fight tracker keeps track of whether players are currently engaged in a fight. This includes
// shooting, issuing damage and taking damage, whilst resetting these statistics at the appropriate
// moments too, for instance when the player respawns.
class FightTracker {
    constructor() {
        this.lastShot_ = new WeakMap();
        this.lastIssuedDamage_ = new WeakMap();
        this.lastTakenDamage_ = new WeakMap();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playergivedamage', FightTracker.prototype.onPlayerGiveDamage.bind(this));
        this.callbacks_.addEventListener(
            'playerspawn', FightTracker.prototype.onPlayerSpawn.bind(this));
        this.callbacks_.addEventListener(
            'playertakedamage', FightTracker.prototype.onPlayerTakeDamage.bind(this));
        this.callbacks_.addEventListener(
            'playerweaponshot', FightTracker.prototype.onPlayerWeaponShot.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the time, in milliseconds, at which the |player| last fired a shot.
    getLastShotTime(player) {
        return this.lastShot_.get(player) || 0;
    }

    // Gets the time, in milliseconds, at which the |player| last issued damage to another player.
    getLastIssuedDamageTime(player) {
        return this.lastIssuedDamage_.get(player) || 0;
    }

    // Gets the time, in milliseconds, at which the |player| last took damage from another player.
    getLastTakenDamageTime(player) {
        return this.lastTakenDamage_.get(player) || 0;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the player the |event| describes has given damage to somebody.
    onPlayerGiveDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (player)
            this.lastIssuedDamage_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // Fight statistics have to be reset when the player spawns.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| is not valid

        this.lastShot_.delete(player);
        this.lastIssuedDamage_.delete(player);
        this.lastTakenDamage_.delete(player);
    }

    // Called when the player the |event| describes has taken damage from somebody.
    onPlayerTakeDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (player)
            this.lastTakenDamage_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // Called when the player the |event| describes has fired a shot.
    onPlayerWeaponShot(event) {
        const player = server.playerManager.getById(event.playerid);
        if (player)
            this.lastShot_.set(player, server.clock.monotonicallyIncreasingTime());
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}

exports = FightTracker;
