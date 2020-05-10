// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplement } from 'base/supplementable.js';

// This supplement will allow you to change the weapons a player has.
export class PlayerWeaponSupplement extends Supplement {
    player_ = null;
    manager_ = null;

    constructor(player, manager) { 
        this.player_ = player;
        this.manager_ = manager;
    }
}