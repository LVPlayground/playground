// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameBase } from 'features/games/game_base.js';

// Provides the implementation of actual derbies, building on top of the Games API infrastructure.
// An instance of this class is strictly scoped to the running derby.
export class DerbyGame extends GameBase {
    #description_ = null;

    async onInitialized(settings, registry) {
        await super.onInitialized(settings, registry);

        // (1) Make sure that we understand which derby |this| instance is being created for.
        this.#description_ = registry.getDescription(settings.get('game/description_id'));
        if (!this.#description_)
            throw new Error(`Invalid derby ID specified in ${this}.`);
    }
}
