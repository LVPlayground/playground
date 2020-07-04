// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { FightRegistry } from 'features/fights/fight_registry.js';

// The Fights infrastructure powers games intended for players to have matches with each other. It
// ranges from 1-on-1 fights, to free-for-all games and team battles. Uses the DeathmatchGame base
// for most functionality, with custom maps on top of that.
export default class Fights extends Feature {
    games_ = null;
    registry_ = null;

    constructor() {
        super();

        // Depend on the deathmatch specialization for games, which powers these features.
        this.games_ = this.defineDependency('games_deathmatch');
        this.games_.addReloadObserver(this, () => this.registerFightingGames());

        // Initialize the registry, which loads information of all the available games. Immediately
        // load all data from disk too, except when running tests, to reduce slow disk I/O.
        this.registry_ = new FightRegistry();

        if (!server.isTest())
            this.registry_.initialize();

        // Register all games known to this feature.
        this.registerFightingGames();
    }

    // Registers the fighting games available on Las Venturas Playground. Each is represented by a
    // DeathmatchGame class with an object to specialize behaviour.
    registerFightingGames() {

    }

    dispose() {
        this.games_.removeReloadObserver(this);
        this.games_ = null;
    }
}
