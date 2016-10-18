// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FightTracker = require('features/abuse/fight_tracker.js');

describe('FightTracker', (it, beforeEach, afterEach) => {
    let tracker = null;

    beforeEach(() => tracker = new FightTracker());
    afterEach(() => tracker.dispose());

    it('should track the most recent fighting statistics for a player', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        // (1) It should track the time of the last shot.
        {
            gunther.shoot();

            assert.closeTo(tracker.getLastWeaponFiredTime(gunther),
                           server.clock.monotonicallyIncreasingTime(), 5);
            assert.equal(tracker.getLastDamageIssuedTime(gunther), 0);
            assert.equal(tracker.getLastDamageTakenTime(gunther), 0);
        }

        await server.clock.advance(10000);  // arbitrary amount

        // (2) It should track the time at which they last issued damage.
        {
            gunther.shoot({ target: russell });

            assert.closeTo(tracker.getLastWeaponFiredTime(gunther),
                           server.clock.monotonicallyIncreasingTime(), 5);
            assert.closeTo(tracker.getLastDamageIssuedTime(gunther),
                           server.clock.monotonicallyIncreasingTime(), 5);
            assert.equal(tracker.getLastDamageTakenTime(gunther), 0);
        }

        await server.clock.advance(10000);  // arbitrary amount

        // (3) It should track the time at which they last took damage.
        {
            russell.shoot({ target: gunther });

            assert.notCloseTo(tracker.getLastWeaponFiredTime(gunther),
                              server.clock.monotonicallyIncreasingTime(), 5);
            assert.notCloseTo(tracker.getLastDamageIssuedTime(gunther),
                              server.clock.monotonicallyIncreasingTime(), 5);
            assert.closeTo(tracker.getLastDamageTakenTime(gunther),
                           server.clock.monotonicallyIncreasingTime(), 5);
        }
    });

    it('should reset statistics when a player respawns', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.shoot({ target: russell });
        russell.shoot({ target: gunther });

        assert.closeTo(tracker.getLastWeaponFiredTime(gunther),
                       server.clock.monotonicallyIncreasingTime(), 5);
        assert.closeTo(tracker.getLastDamageIssuedTime(gunther),
                       server.clock.monotonicallyIncreasingTime(), 5);
        assert.closeTo(tracker.getLastDamageTakenTime(gunther),
                       server.clock.monotonicallyIncreasingTime(), 5);

        gunther.respawn();

        assert.equal(tracker.getLastWeaponFiredTime(gunther), 0);
        assert.equal(tracker.getLastDamageIssuedTime(gunther), 0);
        assert.equal(tracker.getLastDamageTakenTime(gunther), 0);
    });
});
