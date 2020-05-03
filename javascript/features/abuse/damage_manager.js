// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// The Damage Manager is responsible for tracking all damage done on Las Venturas Playground. It
// observes fights, decides whether damage should be dealt and interacts with the mitigator.
class DamageManager {
    constructor(mitigator, detectors, settings) {
        this.detectors_ = detectors;
        this.mitigator_ = mitigator;

        this.settings_ = settings;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playergivedamage', DamageManager.prototype.onPlayerGiveDamage.bind(this));
        this.callbacks_.addEventListener(
            'playertakedamage', DamageManager.prototype.onPlayerTakeDamage.bind(this));
        this.callbacks_.addEventListener(
            'playerweaponshot', DamageManager.prototype.onPlayerWeaponShot.bind(this));
        this.callbacks_.addEventListener(
            'playerdeath', DamageManager.prototype.onPlayerDeath.bind(this));
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
    // https://wiki.sa-mp.com/wiki/OnPlayerWeaponShot
    onPlayerWeaponShot(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was not received for a valid |player|

        this.mitigator_.reportWeaponFire(player);

        const weaponId = event.weaponid;
        const hitPosition = new Vector(event.fX, event.fY, event.fZ);
        let hitPlayer = null;
        let hitVehicle = null;

        switch (event.hittype) {
            case 1:  // BULLET_HIT_TYPE_PLAYER
                hitPlayer = server.playerManager.getById(event.hitid);
                break;
            
            case 2:  // BULLET_HIT_TYPE_VEHICLE
                hitVehicle = server.vehicleManager.getById(event.hitid);
                break;
        }

        for (const detector of this.detectors_.activeDetectors)
            detector.onPlayerWeaponShot(player, weaponId, hitPosition, { hitPlayer, hitVehicle });
    }

    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was not received for a valid |player|

        this.mitigator_.resetDamageIssued(player);
        this.mitigator_.resetDamageTaken(player);
        this.mitigator_.resetWeaponFire(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}

export default DamageManager;
