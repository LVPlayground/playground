// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { PlayerColorsManager } from 'features/player_colors/player_colors_manager.js';
import { PlayerColorsSupplement } from 'features/player_colors/player_colors_supplement.js';

// Implements an API through which a player's colours can be managed. Exposes the `player.colors`
// supplement through which other parts of the code can access player colour information.
export default class PlayerColors extends Feature {
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

        // Initialize the Manager, which will create the necessary supplements.
        this.manager_.initialize();
    }

    dispose() {
        Player.provideSupplement('colors', null);

        this.manager_.dispose();
        this.manager_ = null;
    }
}
