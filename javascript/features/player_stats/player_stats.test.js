// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerStatsSupplement } from 'features/player_stats/player_stats_supplement.js';
import { PlayerStatsView } from 'features/player_stats/player_stats_view.js';

describe('PlayerStats', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    beforeEach(() => {
        server.featureManager.loadFeature('player_stats');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('should expose the Player.prototype.stats property as expected', assert => {
        assert.isDefined(gunther.stats);
        assert.instanceOf(gunther.stats, PlayerStatsSupplement);

        assert.isDefined(gunther.stats.enduring);
        assert.instanceOf(gunther.stats.enduring, PlayerStatsView);

        assert.isDefined(gunther.stats.session);
        assert.instanceOf(gunther.stats.session, PlayerStatsView);
    });

    it('is able to record basic kill and death information', assert => {
        assert.equal(gunther.stats.enduring.deathCount, 0);
        assert.equal(gunther.stats.enduring.killCount, 0);
        assert.equal(gunther.stats.session.deathCount, 0);
        assert.equal(gunther.stats.session.killCount, 0);

        dispatchEvent('playerresolveddeath', {
            playerid: gunther.id,
            killerid: Player.kInvalidId,
            reason: 255,  // invalid reason
        });

        assert.equal(gunther.stats.enduring.deathCount, 1);
        assert.equal(gunther.stats.enduring.killCount, 0);
        assert.equal(gunther.stats.session.deathCount, 1);
        assert.equal(gunther.stats.session.killCount, 0);

        assert.equal(russell.stats.enduring.deathCount, 0);
        assert.equal(russell.stats.session.deathCount, 0);

        dispatchEvent('playerresolveddeath', {
            playerid: russell.id,
            killerid: gunther.id,
            reason: 24,  // desert eagle
        });

        assert.equal(gunther.stats.enduring.deathCount, 1);
        assert.equal(gunther.stats.enduring.killCount, 1);
        assert.equal(gunther.stats.session.deathCount, 1);
        assert.equal(gunther.stats.session.killCount, 1);

        assert.equal(russell.stats.enduring.deathCount, 1);
        assert.equal(russell.stats.session.deathCount, 1);
    });
});
