// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';
import ScopedCallbacks from 'base/scoped_callbacks.js';

// Mock implementation of the DeferredEventManager that has a similar interface, but is powered
// through events fired through `dispatchEvent()` rather than the server's own deferred system.
export class MockDeferredEventManager {
    callbacks_ = null;
    observers_ = new Set();

    constructor() {
        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerresolveddeath', MockDeferredEventManager.prototype.onPlayerDeath.bind(this));
        this.callbacks_.addEventListener(
            'playerweaponshot', MockDeferredEventManager.prototype.onPlayerWeaponShot.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        const killer = server.playerManager.getById(event.killerid);

        if (player) {
            for (const observer of this.observers_)
                observer.onPlayerDeath(player, killer, event.reason);
        }
    }

    onPlayerWeaponShot(event) {
        const player = server.playerManager.getById(event.playerid);
        const position = new Vector(event.fX, event.fY, event.fZ);

        if (player) {
            for (const observer of this.observers_) {
                observer.onPlayerWeaponShot(
                    player, event.weaponid, event.hittype, event.hitid, position);
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the given |observer| to those receiving player events.
    addObserver(observer) {
        if (!(observer instanceof PlayerEventObserver))
            throw new Error(`The given observer (${observer}) must inherit PlayerEventObserver.`);
        
        this.observers_.add(observer);
    }

    // Removes the given |observer| from those receiving player events.
    removeObserver(observer) {
        if (!(observer instanceof PlayerEventObserver))
            throw new Error(`The given observer (${observer}) must inherit PlayerEventObserver.`);
        
        this.observers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
