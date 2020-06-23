// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Requires that the player is currently in the main world.
export const kMainWorldRequirement = 'main-world';

// Requires that the player hasn't recently inflicted or taken damage, or fired their weapon.
export const kNoDeathmatchRequirement = 'no-deathmatch';

// Requires that the player isn't engaged in a minigame of any kind.
export const kNoMinigameRequirement = 'no-minigame';

// Requires that the player is currently outside, meaning not in any interior.
export const kOutsideRequirement = 'outside';
