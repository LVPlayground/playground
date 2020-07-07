// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCustomSetting } from 'features/games/game_custom_setting.js';

// Map of all the spawn weapons with their default ammunition numbers that are available.
const kSpawnWeapons = new Map([
    [  1, { name: 'Brass Knuckles', category: 'Melee weapons', ammo: 1 } ],
    [  2, { name: 'Golf Club', category: 'Melee weapons', ammo: 1 } ],
    [  3, { name: 'Nightstick', category: 'Melee weapons', ammo: 1 } ],
    [  4, { name: 'Knife', category: 'Melee weapons', ammo: 1 } ],  // xxxxxxxxxxxxxxxx
    [  5, { name: 'Baseball Bat', category: 'Melee weapons', ammo: 1 } ],
    [  6, { name: 'Shovel', category: 'Melee weapons', ammo: 1 } ],
    [  7, { name: 'Pool Cue', category: 'Melee weapons', ammo: 1 } ],
    [  8, { name: 'Katana', category: 'Melee weapons', ammo: 1 } ],  // xxxxxxxxxxxxxx
    [  9, { name: 'Chainsaw', category: 'Melee weapons', ammo: 1 } ],
    [ 10, { name: 'Purple Dildo', category: 'Melee weapons', ammo: 1 } ],
    [ 11, { name: 'Dildo', category: 'Melee weapons', ammo: 1 } ],
    [ 12, { name: 'Vibrator', category: 'Melee weapons', ammo: 1 } ],
    [ 13, { name: 'Silver Vibrator', category: 'Melee weapons', ammo: 1 } ],
    [ 14, { name: 'Flowers', category: 'Melee weapons', ammo: 1 } ],
    [ 15, { name: 'Cane', category: 'Melee weapons', ammo: 1 } ],
    [ 16, { name: 'Grenade', category: 'Throwable weapons', ammo: 50 } ],
    [ 17, { name: 'Tear Gas', category: 'Throwable weapons', ammo: 50 } ],
    [ 18, { name: 'Molotov Cocktail', category: 'Throwable weapons', ammo: 50 } ],
    [ 22, { name: 'Colt 45 (9mm)', category: 'Pistols', ammo: 150 } ],
    [ 23, { name: 'Silenced 9mm', category: 'Pistols', ammo: 150 } ],
    [ 24, { name: 'Desert Eagle', category: 'Pistols', ammo: 150 } ],
    [ 25, { name: 'Shotgun', category: 'Shotguns', ammo: 250 } ],
    [ 26, { name: 'Sawnoff Shotgun', category: 'Shotguns', ammo: 250 } ],
    [ 27, { name: 'Combat Shotgun', category: 'Shotguns', ammo: 250 } ],
    [ 28, { name: 'Micro SMG (UZI)', category: 'Sub-machine guns', ammo: 500 } ],
    [ 29, { name: 'MP5', category: 'Sub-machine guns', ammo: 500 } ],
    [ 30, { name: 'AK-47', category: 'Assault rifles', ammo: 400 } ],
    [ 31, { name: 'M4', category: 'Assault rifles', ammo: 400 } ],
    [ 32, { name: 'Tec-9', category: 'Sub-machine guns', ammo: 500 } ],
    [ 33, { name: 'Country Rifle', category: 'Rifles', ammo: 100 } ],
    [ 34, { name: 'Sniper Rifle', category: 'Rifles', ammo: 100 } ],
    [ 35, { name: 'RPG', category: 'Heavy weapons', ammo: 50 } ],
    [ 36, { name: 'Heat Seaking RPG', category: 'Heavy weapons', ammo: 50 } ],
    [ 37, { name: 'Flamethrower', category: 'Heavy weapons', ammo: 500 } ],
    [ 38, { name: 'Minigun', category: 'Heavy weapons', ammo: 2500 } ],
    [ 41, { name: 'Spraycan', category: 'Miscellaneous', ammo: 250 } ],
    [ 42, { name: 'Fire Extinguisher', category: 'Miscellaneous', ammo: 250 } ],
    [ 46, { name: 'Parachute', category: 'Miscellaneous', ammo: 1 } ],
]);

// Represents the ability for players to determine the spawn weapons for this game. Right now all
// players get the same spawn weapons, but this could be further amended in the future. 
export class SpawnWeaponsSetting extends GameCustomSetting {
    // Set of all the valid spawn weapon IDs available in minigames.
    static kSpawnWeaponIds = new Set([ ...kSpawnWeapons.keys() ]);

    // Returns the value that is to be displayed in the generic customization dialog for games.
    getCustomizationDialogValue(currentValue) {}

    // Handles the customization flow for the given |player|. The spawn weapon configuration will
    // be written directly to the given |settings| Map.
    async handleCustomization(player, settings, currentValue) {}
}
