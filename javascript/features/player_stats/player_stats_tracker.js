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
    onPlayerDeath(player, killer, reason) {
        player.stats.enduring.deathCount++;
        player.stats.session.deathCount++;

        if (!killer)
            return;  // a death, or an invalid killer id
        
        killer.stats.enduring.killCount++;
        killer.stats.session.killCount++;
    }

    // Called when a player has issued a shot.
    onPlayerWeaponShot(player, weaponId, hitType, hitId, hitPosition) {
        if (hitType === /* player */ 1) {
            const victim = server.playerManager.getById(hitId);
            if (victim && victim !== player) {
                player.stats.enduring.shotsHit++;
                player.stats.session.shotsHit++;

                victim.stats.enduring.shotsTaken++;
                victim.stats.session.shotsTaken++;
            }
        } else if (hitType === /* vehicle */ 2) {
            player.stats.enduring.shotsHit++;
            player.stats.session.shotsHit++;
        } else {
            player.stats.enduring.shotsMissed++;
            player.stats.session.shotsMissed++;
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.deferredEventManager.removeObserver(this);
    }
}
