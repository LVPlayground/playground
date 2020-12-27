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

        assert.equal(gunther.stats.session.ratio, 0);
        assert.equal(russell.stats.session.ratio, 0);

        dispatchEvent('playerresolveddeath', {
            playerid: gunther.id,
            killerid: Player.kInvalidId,
            reason: 255,  // invalid reason
        });

        assert.equal(gunther.stats.enduring.deathCount, 1);
        assert.equal(gunther.stats.enduring.killCount, 0);
        assert.equal(gunther.stats.session.deathCount, 1);
        assert.equal(gunther.stats.session.killCount, 0);

        assert.equal(gunther.stats.session.ratio, 0);
        assert.equal(russell.stats.session.ratio, 0);

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

        assert.equal(gunther.stats.session.ratio, 1);
        assert.equal(russell.stats.session.ratio, 0);

        assert.equal(russell.stats.enduring.deathCount, 1);
        assert.equal(russell.stats.session.deathCount, 1);

        russell.stats.session.killCount = 200;
        russell.stats.session.deathCount = 50;

        assert.equal(russell.stats.session.ratio, 4);
    });

    it('is able to track statistics about individual shots', assert => {
        assert.equal(gunther.stats.enduring.shotsHit, 0);
        assert.equal(gunther.stats.enduring.shotsMissed, 0);
        assert.equal(gunther.stats.enduring.shotsTaken, 0);

        assert.equal(gunther.stats.session.shotsHit, 0);
        assert.equal(gunther.stats.session.shotsMissed, 0);
        assert.equal(gunther.stats.session.shotsTaken, 0);

        assert.equal(gunther.stats.enduring.accuracy, 0);
        assert.equal(gunther.stats.enduring.shots, 0);
        assert.equal(gunther.stats.enduring.shotsRatio, 0);

        assert.equal(gunther.stats.session.accuracy, 0);
        assert.equal(gunther.stats.session.shots, 0);
        assert.equal(gunther.stats.session.shotsRatio, 0);

        dispatchEvent('playerweaponshot', {
            playerid: gunther.id,
            weaponid: 24,  // desert eagle
            hittype: 0,  // nothing
            hitid: 0,
            fX: 0,
            fY: 0,
            fZ: 0,
        });

        assert.equal(gunther.stats.enduring.shotsHit, 0);
        assert.equal(gunther.stats.enduring.shotsMissed, 1);
        assert.equal(gunther.stats.enduring.shotsTaken, 0);

        assert.equal(gunther.stats.session.shotsHit, 0);
        assert.equal(gunther.stats.session.shotsMissed, 1);
        assert.equal(gunther.stats.session.shotsTaken, 0);

        assert.equal(gunther.stats.enduring.accuracy, 0);
        assert.equal(gunther.stats.enduring.shots, 1);
        assert.equal(gunther.stats.enduring.shotsRatio, 0);

        assert.equal(gunther.stats.session.accuracy, 0);
        assert.equal(gunther.stats.session.shots, 1);
        assert.equal(gunther.stats.session.shotsRatio, 0);

        assert.equal(russell.stats.session.shotsHit, 0);
        assert.equal(russell.stats.session.shotsMissed, 0);
        assert.equal(russell.stats.session.shotsTaken, 0);

        dispatchEvent('playerweaponshot', {
            playerid: russell.id,
            weaponid: 24,  // desert eagle
            hittype: 1,  // player
            hitid: gunther.id,
            fX: 0,
            fY: 0,
            fZ: 0,
        });

        assert.equal(gunther.stats.enduring.shotsHit, 0);
        assert.equal(gunther.stats.enduring.shotsMissed, 1);
        assert.equal(gunther.stats.enduring.shotsTaken, 1);

        assert.equal(gunther.stats.session.shotsHit, 0);
        assert.equal(gunther.stats.session.shotsMissed, 1);
        assert.equal(gunther.stats.session.shotsTaken, 1);

        assert.equal(gunther.stats.enduring.accuracy, 0);
        assert.equal(gunther.stats.enduring.shots, 1);
        assert.equal(gunther.stats.enduring.shotsRatio, 0);

        assert.equal(gunther.stats.session.accuracy, 0);
        assert.equal(gunther.stats.session.shots, 1);
        assert.equal(gunther.stats.session.shotsRatio, 0);

        assert.equal(russell.stats.session.shotsHit, 1);
        assert.equal(russell.stats.session.shotsMissed, 0);
        assert.equal(russell.stats.session.shotsTaken, 0);

        assert.equal(russell.stats.enduring.accuracy, 1);
        assert.equal(russell.stats.enduring.shots, 1);
        assert.equal(russell.stats.enduring.shotsRatio, 1);
    
        russell.stats.session.shotsHit = 50;
        russell.stats.session.shotsMissed = 150;

        assert.equal(russell.stats.session.shots, 200);
        assert.equal(russell.stats.session.accuracy, 0.25);

        russell.stats.session.shotsHit = 200;
        russell.stats.session.shotsTaken = 50;

        assert.equal(russell.stats.session.shotsRatio, 4);
    });

    it('is able to include damage information in the statistics', assert => {
        assert.equal(gunther.stats.enduring.damageGiven, 0);
        assert.equal(gunther.stats.enduring.damageTaken, 0);
        assert.equal(gunther.stats.session.damageGiven, 0);
        assert.equal(gunther.stats.session.damageTaken, 0);

        assert.equal(russell.stats.enduring.damageGiven, 0);
        assert.equal(russell.stats.enduring.damageTaken, 0);
        assert.equal(russell.stats.session.damageGiven, 0);
        assert.equal(russell.stats.session.damageTaken, 0);
    
        assert.equal(gunther.stats.session.damageRatio, 0);
        assert.equal(russell.stats.session.damageRatio, 0);

        dispatchEvent('playertakedamage', {
            playerid: russell.id,
            issuerid: gunther.id,
            amount: 25,
            weaponid: 24,  // desert eagle
            bodypart: 3,  // torso
        });

        assert.equal(gunther.stats.enduring.damageGiven, 25);
        assert.equal(gunther.stats.enduring.damageTaken, 0);
        assert.equal(gunther.stats.session.damageGiven, 25);
        assert.equal(gunther.stats.session.damageTaken, 0);

        assert.equal(russell.stats.enduring.damageGiven, 0);
        assert.equal(russell.stats.enduring.damageTaken, 25);
        assert.equal(russell.stats.session.damageGiven, 0);
        assert.equal(russell.stats.session.damageTaken, 25);
    
        assert.equal(gunther.stats.session.damageRatio, 25);
        assert.equal(russell.stats.session.damageRatio, 0);

        dispatchEvent('playertakedamage', {
            playerid: gunther.id,
            issuerid: russell.id,
            amount: 50,
            weaponid: 24,  // desert eagle
            bodypart: 9,  // head
        });

        assert.equal(gunther.stats.enduring.damageGiven, 25);
        assert.equal(gunther.stats.enduring.damageTaken, 50);
        assert.equal(gunther.stats.session.damageGiven, 25);
        assert.equal(gunther.stats.session.damageTaken, 50);

        assert.equal(russell.stats.enduring.damageGiven, 50);
        assert.equal(russell.stats.enduring.damageTaken, 25);
        assert.equal(russell.stats.session.damageGiven, 50);
        assert.equal(russell.stats.session.damageTaken, 25);
    
        assert.equal(gunther.stats.session.damageRatio, 0.5);
        assert.equal(russell.stats.session.damageRatio, 2);
    });

    it('is able to calculate and update player online times', async (assert) => {
        assert.equal(russell.stats.enduring.onlineTime, 0);
        assert.equal(russell.stats.session.onlineTime, 0);

        await server.clock.advance(60000);

        assert.closeTo(russell.stats.enduring.onlineTime, 60, 2);
        assert.closeTo(russell.stats.session.onlineTime, 60, 2);

        russell.stats.enduring.onlineTime = 1000;
        russell.stats.session.onlineTime = 1000;

        assert.equal(russell.stats.enduring.onlineTime, 1000);
        assert.equal(russell.stats.session.onlineTime, 1000);

        await server.clock.advance(60000);

        assert.closeTo(russell.stats.enduring.onlineTime, 1060, 2);
        assert.closeTo(russell.stats.session.onlineTime, 1060, 2);
    });

    it('is able to create snapshots and differentiate them with current statistics', assert => {
        const properties = new Map();
        let index = 0;

        // (1) Gather an array of |properties| that should be representable on the View.
        for (const property of Object.getOwnPropertyNames(gunther.stats.session)) {
            if (PlayerStatsView.kIgnoredProperties.has(property))
                continue;
            
            properties.set(index++, property);
        }

        // (2) Populate |gunther|'s current statistics with mock values.
        for (const [ index, property ] of properties)
            gunther.stats.session[property] = index;

        const snapshot = gunther.stats.snapshot();

        // (3) Modify |gunther|'s statistics because they're really ace at these things.
        for (const [ index, property ] of properties)
            gunther.stats.session[property] += Math.pow(2, index);

        const diff = gunther.stats.diff(snapshot);

        // (4) Confirm that both |gunther|'s current statistics and diff are as expected.
        for (const [ index, property ] of properties) {
            assert.equal(gunther.stats.session[property], index + Math.pow(2, index));
            assert.equal(diff[property], Math.pow(2, index));
        }
    });
});
