// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { PlayerWeaponsManager } from 'features/player_weapons/player_weapons_manager.js';
import { PlayerWeaponSupplement } from 'features/player_weapons/player_weapons_supplement.js';

// The PlayerWeapon feature will handle the weapons for a player. This feature is for now tightly 
// coupled with weaponCheat.pwn and LVP.pwn in order to not provoke anti cheat and keep the PAWN
// part of the code happy.
export default class PlayerWeapons extends Feature {
    constructor() {
        super();
        
        this.manager_ = new PlayerWeaponsManager();

        // Provide the weapons supplement to the Player class. This makes the `weapons` accessor
        // available on each player connected to the server.
        Player.provideSupplement('weapons', PlayerWeaponSupplement, this.manager_);
    }

    dispose() {
        Player.provideSupplement('weapons', null);
    }
}
