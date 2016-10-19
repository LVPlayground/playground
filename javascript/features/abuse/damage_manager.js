// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// The Damage Manager is responsible for tracking all damage done on Las Venturas Playground. It
// observes fights, decides whether damage should be dealt and interacts with the mitigator.
class DamageManager {
    constructor(mitigator, settings) {
        this.mitigator_ = mitigator;
        this.settings_ = settings;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playergivedamage', DamageManager.prototype.onPlayerGiveDamage.bind(this));
        this.callbacks_.addEventListener(
            'playertakedamage', DamageManager.prototype.onPlayerTakeDamage.bind(this));
        this.callbacks_.addEventListener(
            'playerweaponshot', DamageManager.prototype.onPlayerWeaponShot.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the player the |event| describes has given damage to somebody.
    onPlayerGiveDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was not received for a valid player

        this.mitigator_.reportDamageIssued(player);
    }

    // Called when the player the |event| describes has taken damage from somebody.
    onPlayerTakeDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was not received for a valid player

        this.mitigator_.reportDamageTaken(player);
    }

    // Called when the player the |event| describes has fired a shot.
    onPlayerWeaponShot(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was not received for a valid player

        this.mitigator_.reportWeaponFire(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}

exports = DamageManager;
