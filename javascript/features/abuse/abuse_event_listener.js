// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// The event listener is responsible for listening to server events and propagating those to other
// parts of the Abuse feature, including the detectors.
export class AbuseEventListener {
    constructor(mitigator, detectors) {
        this.detectors_ = detectors;
        this.mitigator_ = mitigator;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playergivedamage', AbuseEventListener.prototype.onPlayerGiveDamage.bind(this));
        this.callbacks_.addEventListener(
            'playertakedamage', AbuseEventListener.prototype.onPlayerTakeDamage.bind(this));
        this.callbacks_.addEventListener(
            'playerweaponshot', AbuseEventListener.prototype.onPlayerWeaponShot.bind(this));
        this.callbacks_.addEventListener(
            'playerdeath', AbuseEventListener.prototype.onPlayerDeath.bind(this));
        
        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the player the |event| describes has given damage to somebody.
    onPlayerGiveDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was not received for a valid player

        this.mitigator_.reportDamageIssued(player);
    }

    // Called when the player the |event| describes has taken damage from somebody. This event is
    // sent by the player who took damage, and thus cannot be entirely trusted.
    // https://wiki.sa-mp.com/wiki/OnPlayerTakeDamage
    onPlayerTakeDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was not received for a valid player

        this.mitigator_.reportDamageTaken(player);

        const issuer = server.playerManager.getById(event.issuerid);

        for (const detector of this.detectors_.activeDetectors) {
            detector.onPlayerTakeDamage(
                player, issuer, event.weaponid, event.amount, event.bodypart);
        }
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

    // Called when a player has entered vehicle. This is similar to the OnPlayerEnterVehicle event
    // issued by SA-MP, but is fired *after* the |player| has entered the |vehicle|.
    //
    // https://wiki.sa-mp.com/wiki/OnPlayerEnterVehicle
    // https://wiki.sa-mp.com/wiki/OnPlayerStateChange
    onPlayerEnterVehicle(player, vehicle) {
        for (const detector of this.detectors_.activeDetectors)
            detector.onPlayerEnterVehicle(player, vehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
