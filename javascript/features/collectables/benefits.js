// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import * as achievements from 'features/collectables/achievements.js';

// Whether a player is able to use the quick vehicle commands. (/nrg & co.)
export const kBenefitBasicSprayQuickVehicleAccess = 0;
export const kBenefitBasicBarrelQuickVehicleAccess = 1;
export const kBenefitFullQuickVehicleAccess = 2;

// Whether a player is able to use the bomb shop.
export const kBenefitBombShop = 3;

// Whether a player can use the vehicle colour changing keys.
export const kBenefitVehicleKeysColour = 4;

// Whether a player can use the vehicle jump keys outside of Las Venturas.
export const kBenefitVehicleKeysJump = 5;

// Whether a player can use the vehicle nitro key outside of Las Venturas.
export const kBenefitVehicleKeysNitro = 6;

// Whether a player can use the vehicle gravity key outside of Las Venturas.
export const kBenefitVehicleKeysGravity = 7;

// Mapping of which benefits map to having to obtain which achievements.
export const kBenefits = new Map([
    [
        kBenefitBasicSprayQuickVehicleAccess,
        {
            achievement: achievements.kAchievementSprayTagBronze,
            name: 'Spawn /pre and /sul vehicles',
        }
    ],
    [
        kBenefitBasicBarrelQuickVehicleAccess,
        {
            achievement: achievements.kAchievementRedBarrelBronze,
            name: 'Spawn /ele and /tur vehicles',
        }
    ],
    [
        kBenefitFullQuickVehicleAccess,
        {
            achievement: achievements.kAchievementSprayTagPlatinum,
            name: 'Spawn /inf and /nrg vehicles',
        }
    ],
    [
        kBenefitBombShop,
        {
            achievement: achievements.kAchievementSprayTagSilver,
            name: 'Ability to use the Bomb Shop',
        }
    ],
    [
        kBenefitVehicleKeysColour,
        {
            achievement: achievements.kAchievementRedBarrelSilver,
            name: `Vehicle Key to change colours`,
        }
    ],
    [
        kBenefitVehicleKeysJump,
        {
            achievement: achievements.kAchievementRedBarrelPlatinum,
            name: `Vehicle Key to jump your vehicle`,
        }
    ],
    [
        kBenefitVehicleKeysNitro,
        {
            achievement: achievements.kAchievementReactionTestSilver,
            name: `Vehicle Key to add nitro`,
        }
    ],
    [
        kBenefitVehicleKeysGravity,
        {
            achievement: achievements.kAchievementTreasuresPlatinium,
            name: `Vehicle Key to invert gravity`,
        }
    ]
]);
