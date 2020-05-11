// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class manages the player weapons and is tightly coupled with the Pawn part of the game mode.
export class PlayerWeaponsManager {
    
    // Give a player a certain weapon with ammo.
    giveWeapon(playerId, weaponId, ammo) {
        return pawnInvoke('OnGiveWeapon', 'iii', playerId, weaponId, ammo);
    }

    // Resets all the weapons a player has.
    resetWeapons(playerId) {
        return pawnInvoke('OnResetPlayerWeapons', 'i', playerId);
    }
}
