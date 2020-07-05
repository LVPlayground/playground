// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Game } from 'features/games/game.js';

// Implementation of the `Game` interface which extends it with deathmatch-related functionality. It
// exposes methods that should be called before game-specific behaviour, i.e. through super calls.
export class DeathmatchGame extends Game {
    // Values for map marker visibility for the participants.
    static kMapMarkersEnabled = 0;
    static kMapMarkersEnabledTeam = 1;
    static kMapMarkersDisabled = 2;

    #lagCompensation_ = false;
    #mapMarkers_ = DeathmatchGame.kMapMarkersEnabled;

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

        switch (settings.get('deathmatch/map_markers')) {
            case 'Enabled':
                this.#mapMarkers_ = DeathmatchGame.kMapMarkersEnabled;
                break;

            case 'Team only':
                this.#mapMarkers_ = DeathmatchGame.kMapMarkersEnabledTeam;
                break;

            case 'Disabled':
                this.#mapMarkers_ = DeathmatchGame.kMapMarkersDisabled;
                break;
            
            default:
                throw new Error(`Invalid value given for map markers.`);
        }
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
