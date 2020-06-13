// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerStatsView } from 'features/player_stats/player_stats_view.js';
import { Supplement } from 'base/supplementable.js';

// Implements the statistical data structure for a given player. An instance will automatically be
// created as `Player.prototype.stats` through the Supplementable system, and be available globally
// throughout Las Venturas Playground code.
export class PlayerStatsSupplement extends Supplement {
    #enduring_ = null;
    #session_ = null;

    constructor() {
        super();

        this.#enduring_ = new PlayerStatsView();
        this.#session_ = new PlayerStatsView();
    }

    // ---------------------------------------------------------------------------------------------

    // Gets a PlayerStatsView instance for the player's statistics over the life of their account.
    get enduring() { return this.#enduring_; }

    // Gets a PlayerStatsView instance for the player's statistics during this playing session.
    get session() { return this.#session_; }

    // ---------------------------------------------------------------------------------------------

    // Returns a difference between the player's current statistics and the given |snapshot|.
    diff(snapshot) {
        const view = new PlayerStatsView();

        for (const property of Object.getOwnPropertyNames(this.#session_)) {
            if (PlayerStatsView.kIgnoredProperties.has(property))
                continue;

            view[property] = this.#session_[property] - (snapshot.get(property) ?? 0);
        }

        return view;
    }

    // Returns a snapshot of the player's session statistics at this very moment.
    snapshot() {
        const snapshot = new Map();
        for (const property of Object.getOwnPropertyNames(this.#session_)) {
            if (PlayerStatsView.kIgnoredProperties.has(property))
                continue;
            
            snapshot.set(property, this.#session_[property]);
        }

        return snapshot;
    }
}
