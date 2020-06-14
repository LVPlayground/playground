// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { PlayerStatsSupplement } from 'features/player_stats/player_stats_supplement.js';
import { PlayerStatsTracker } from 'features/player_stats/player_stats_tracker.js';

// This feature collects statistics about a player's ativities in-game, which will be stored for
// each of their sessions in the database. This will allow us to dynamically generate periodic
// overviews of how certain players, and groups of them (gangs), are performing online.
//
// Statistics are implemented as a Supplement, because other features could use this rich data as
// well, for example the DeathMatch system.
export default class PlayerStats extends Feature {
    tracker_ = null;

    constructor() {
        super();

        // This is a foundational feature, which depends on exactly no other features. Events are
        // observed through the PlayerEventObserver, which lives in //components.
        this.markFoundational();

        // Provides the `Player.prototype.stats` accessor to all Player instances.
        Player.provideSupplement('stats', PlayerStatsSupplement);

        // Tracks events and converts them to statistics for each of the individual players.
        this.tracker_ = new PlayerStatsTracker();
    }

    dispose() {
        this.tracker_.dispose();
        
        // Remove the `Player.prototype.stats` supplement again.
        Player.provideSupplement('stats', null);
    }
}
