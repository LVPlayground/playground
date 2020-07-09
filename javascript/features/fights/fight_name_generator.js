// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Function that implements the ability to generate names for fights. These are entirely composed
// based on the settings, except when an internal name has been given, in which case we only
// specialize it with adjustments made by the player.
export function fightNameGenerator(registry, settings) {
    let prefix = '';
    let base = '';
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

    // (3) Decide on a suffix for the name. We specialize based on whether lag compensation mode has
    // been disabled, which appeals to a different audience of players.
    if (settings.get('deathmatch/lag_compensation') === false)
        suffix = ' (lag shot)';

    return `${prefix}${base} Match${suffix}`;
}
