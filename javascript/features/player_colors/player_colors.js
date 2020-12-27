// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ColorNatives } from 'features/player_colors/color_natives.js';
import { ColorPicker } from 'features/player_colors/color_picker.js';
import { Feature } from 'components/feature_manager/feature.js';
import { PlayerColorsManager } from 'features/player_colors/player_colors_manager.js';
import { PlayerColorsSupplement } from 'features/player_colors/player_colors_supplement.js';

// Implements an API through which a player's colours can be managed. Exposes the `player.colors`
// supplement through which other parts of the code can access player colour information.
export default class PlayerColors extends Feature {
    natives_ = null;
    manager_ = null;

    constructor() {
        super();

        // This is a foundational feature, and can thus depend on very few other features.
        this.markFoundational();

        // The manager is responsible for making sure colour state is synchronized between our local
        // representation, the server, and all other players on the server.
        this.manager_ = new PlayerColorsManager();

        // Register the `colors` supplement for the Player class.
        Player.provideSupplement('colors', PlayerColorsSupplement, this.manager_);

        // Provides the native Pawn functions enabling that code to manage colour information.
        this.natives_ = new ColorNatives();

        // Initialize the Manager, which will create the necessary supplements.
        this.manager_.initialize();
    }

    // ---------------------------------------------------------------------------------------------
    // API of the PlayerColors feature
    // ---------------------------------------------------------------------------------------------

    // Takes the |player| through the color picker flow by displaying the picker to them. The caller
    // of this function is expected to do the necessary Limits tests.
    async displayColorPickerForPlayer(player) { return await ColorPicker.displayForPlayer(player); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        Player.provideSupplement('colors', null);

        this.natives_.dispose();
        this.natives_ = null;

        this.manager_.dispose();
        this.manager_ = null;
    }
}
