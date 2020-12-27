// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { difference } from 'base/set_extensions.js';

import { kSpawnWeaponSets } from 'features/games_deathmatch/settings/spawn_weapons_setting.js';

// Weapon IDs that are used to further specialize game names.
const kWeaponHeatSeakingRocket = 35;
const kWeaponMinigun = 38;
const kWeaponRocket = 36;

// Function that implements the ability to generate names for fights. These are entirely composed
// based on the settings, except when an internal name has been given, in which case we only
// specialize it with adjustments made by the player.
export function fightNameGenerator(registry, settings) {
    let prefix = '';
    let base = '';
    let weapon = '';
    let suffix = '';

    // (1) Decide on the prefix of the game. Usage of teams takes precedence.
    if (settings.get('deathmatch/teams') !== 'Free for all')
        prefix = 'Team ';

    // (2) Decide on the base name of the game. If a name has been specified in the |settings| use
    // that, otherwise fall back to the short name of the location.
    if (settings.get('internal/name') !== null) {
        base = settings.get('internal/name');
    } else {
        const location = registry.getLocation(settings.get('fights/location'));
        if (!location)
            throw new Error('Invalid location specified: ' + settings.get('fights/location'));
        
        base = location.shortName;
    }

    // (3) If Miniguns or Rockets are included in the |settings|, specialize the name based on that
    // because it significantly alters gameplay. In addition, if one of the RW/WW weapon sets was
    // chosen, clarify that in the name as well.
    if (hasWeapon(settings, kWeaponMinigun))
        weapon = 'Minigun ';
    else if (hasWeapon(settings, kWeaponHeatSeakingRocket) || hasWeapon(settings, kWeaponRocket))
        weapon = 'Rocket ';
    else if (hasWeaponSet(settings, 'Run Weapons'))
        weapon = 'RW ';
    else if (hasWeaponSet(settings, 'Walk Weapons'))
        weapon = 'WW ';

    // (4) Decide on a suffix for the name. We specialize based on whether lag compensation mode has
    // been disabled, which appeals to a different audience of players.
    if (settings.get('deathmatch/lag_compensation') === false)
        suffix = ' (lag shot)';

    return `${prefix}${base} ${weapon}Match${suffix}`;
}

// Returns whether the |settings| include the given |weapon|.
function hasWeapon(settings, weapon) {
    for (const spawnWeapon of settings.get('deathmatch/spawn_weapons') ?? []) {
        if (spawnWeapon.weapon === weapon)
            return true;
    }

    return false;
}

// Returns whether the |settings| includes the given |weaponSet|. It must be an exact match.
function hasWeaponSet(settings, weaponSet) {
    if (!kSpawnWeaponSets.has(weaponSet))
        return false;

    const predefined = new Set([ ...kSpawnWeaponSets.get(weaponSet) ]);
    const weapons = new Set();

    for (const spawnWeapon of settings.get('deathmatch/spawn_weapons') ?? [])
        weapons.add(spawnWeapon.weapon);

    return difference(predefined, weapons).size === 0;
}
