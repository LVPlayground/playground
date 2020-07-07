// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCustomSetting } from 'features/games/game_custom_setting.js';

// Represents the ability for players to determine the spawn weapons for this game. Right now all
// players get the same spawn weapons, but this could be further amended in the future. 
export class SpawnWeaponsSetting extends GameCustomSetting {
    // Returns the value that is to be displayed in the generic customization dialog for games.
    getCustomizationDialogValue(currentValue) {}

    // Handles the customization flow for the given |player|. The spawn weapon configuration will
    // be written directly to the given |settings| Map.
    async handleCustomization(player, settings, currentValue) {}
}
