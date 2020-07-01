// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Game } from 'features/games/game.js';

// Implementation of the `Game` interface which extends it with deathmatch-related functionality. It
// exposes methods that should be called before game-specific behaviour, i.e. through super calls.
export class DeathmatchGame extends Game {
    // Whether lag compensation mode should be enabled for this game.
    #lagCompensation_ = false;

    // Snapshots of statistics of each of the participants when they join the game.
    #statistics_ = new WeakMap();

    // ---------------------------------------------------------------------------------------------

    // Returns a PlayerStatsView instance for the current statistics of the given |player|, or NULL
    // when the |player| is not currently engaged in the game.
    getStatisticsForPlayer(player) {
        const snapshot = this.#statistics_.get(player);
        if (!snapshot)
            return null;  // no snapshot could be found
        
        return player.stats.diff(snapshot);
    }

    // ---------------------------------------------------------------------------------------------

    async onInitialized(settings) {
        await super.onInitialized(settings);

        // Import the settings from the |settings|, which may have been customised by the player.
        this.#lagCompensation_ = settings.get('deathmatch/lag_compensation');
    }

    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        this.#statistics_.set(player, player.stats.snapshot());

        if (!this.#lagCompensation_)
            player.syncedData.lagCompensationMode = /* disabled= */ 0;
    }

    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        this.#statistics_.delete(player);

        if (!this.#lagCompensation_)
            player.syncedData.lagCompensationMode = Player.kDefaultLagCompensationMode;
    }
}
