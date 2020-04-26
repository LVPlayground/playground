// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerDatabase } from 'features/nuwani_commands/player_database.js';

// Implementation of the PlayerDatabase that overrides all methods with mocked out behaviour, in
// order to avoid hitting the actual database.
export class MockPlayerDatabase extends PlayerDatabase {
    summary = null;

    constructor() {
        super();

        // Initialize all the summary override values to NULL, to make sure that we can use the ??
        // operator in the `getPlayerSummaryInfo` method further down.
        this.summary = {
            level: null,
            vip: null,
            onlineTime: null,
            killCount: null,
            deathCount: null,
            lastSeen: null,
        };
    }

    async getPlayerSummaryInfo(nickname) {
        if (nickname === 'NameThatDoesNotExist')
            return null;

        return {
            level: this.summary.level ?? 'Management',
            is_vip: this.summary.vip ?? true,
            online_time: this.summary.onlineTime ?? 991571,
            kill_count: this.summary.killCount ?? 15122,
            death_count: this.summary.deathCount ?? 4812,
            last_seen: this.summary.lastSeen ?? 92929
        };
    }
}
