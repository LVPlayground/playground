// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameCustomSetting } from 'features/games/game_custom_setting.js';

// Represents the environment for minigames, which can be customised to the player's liking. This
// includes the time, the weather, as well as the gravity level to apply.
export class EnvironmentSettings extends GameCustomSetting {
    // Options available for each of the configuration values.
    static kTimeOptions = [ 'Morning', 'Afternoon', 'Evening', 'Night' ];
    static kWeatherOptions = [ 'Cloudy', 'Foggy', 'Heatwave', 'Rainy', 'Sandstorm', 'Sunny' ];
    static kGravityOptions = [ 'Low', 'Normal', 'High' ];

    // Returns the value that is to be displayed in the generic customization dialog for games.
    getCustomizationDialogValue(currentValue) {
        // TODO
    }

    // Handles the customization flow for the given |player|. The resulting environment settings
    // will directly be written to the |settings| object.
    async handleCustomization(player, settings, currentValue) {
        // TODO
    }
}
