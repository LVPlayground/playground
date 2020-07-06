// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a custom setting that's made available to a game. These have the ability to manually
// serialize and deserialize their values, and present a customized user experience to the player.
export class GameCustomSetting {
    // Returns the value that is to be displayed in the generic customization dialog for games. Is
    // able to use embedded colours. Colour for customised default values is added automatically.
    getCustomizationDialogValue(currentValue) {}

    // Handles the customization flow for the given |player|. When this function succeeds, the
    // resulting value must have been written to the |settings| map.
    async handleCustomization(player, settings, currentValue) {}
}
