// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplement } from 'base/supplementable.js';

// This supplement will allow you to change the weapons a player has.
// This supplement will be in charge of tracking the players weapons and all related logic when this
// Gets moved to the JavaScript part of the game mode.
export class PlayerWeaponSupplement extends Supplement {
    player_ = null;
    manager_ = null;

    constructor(player, manager) { 
        this.player_ = player;
        this.manager_ = manager;
    }

    // Rests the weapons of the player. Returns 1 on success and 0 on fail.
    reset() {
        return this.manager_.resetWeapons(player_.id);
    }

    // Gives the player a certain weapon. Returns 1 on success and 0 on fail.
    give(weaponId, ammo) {
        return this.manager_.giveWeapon(player_.id, weaponId, ammo);
    }
}