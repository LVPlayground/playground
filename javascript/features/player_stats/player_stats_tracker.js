// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';

// Tracks statistics and amends the PlayerStatsSupplement instances when something substantial
// changes. Observes relevant events from the DeferredEventManager to avoid a layering violation.
export class PlayerStatsTracker extends PlayerEventObserver {
    constructor() {
        super();

        server.deferredEventManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player has died, potentially by doing of another player.
    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        const killer = server.playerManager.getById(event.killerid);

        if (!player)
            return;  // possibly a fake kill
        
        player.stats.enduring.deathCount++;
        player.stats.session.deathCount++;

        if (!killer)
            return;  // a death, or an invalid killer id
        
        killer.stats.enduring.killCount++;
        killer.stats.session.killCount++;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.deferredEventManager.removeObserver(this);
    }
}
