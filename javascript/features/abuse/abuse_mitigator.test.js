// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AbuseMitigator = require('features/abuse/abuse_mitigator.js');

describe('AbuseMitigator', (it, beforeEach, afterEach) => {
    let mitigator = null;

    beforeEach(() => mitigator = new AbuseMitigator());
    afterEach(() => mitigator.dispose());

    it('should properly support the time throttling-related mitigations', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        {
            const time = server.clock.monotonicallyIncreasingTime();

            assert.isTrue(mitigator.satisfiesTimeThrottle(gunther, time, 1500, 'test'));
            assert.isTrue(mitigator.satisfiesTimeThrottle(russell, time, 1500, 'test'));

            mitigator.reportTimeThrottleUsage(gunther, 'test');

            assert.isFalse(mitigator.satisfiesTimeThrottle(gunther, time, 1500, 'test'));
            assert.isTrue(mitigator.satisfiesTimeThrottle(russell, time, 1500, 'test'));
        }
        await server.clock.advance(1000);
        {
            const time = server.clock.monotonicallyIncreasingTime();

            mitigator.reportTimeThrottleUsage(russell, 'test');

            assert.isFalse(mitigator.satisfiesTimeThrottle(gunther, time, 1500, 'test'));
            assert.isFalse(mitigator.satisfiesTimeThrottle(russell, time, 1500, 'test'));
        }
        await server.clock.advance(1000);
        {
            const time = server.clock.monotonicallyIncreasingTime();

            assert.isTrue(mitigator.satisfiesTimeThrottle(gunther, time, 1500, 'test'));
            assert.isFalse(mitigator.satisfiesTimeThrottle(russell, time, 1500, 'test'));
        }
        await server.clock.advance(500);
        {
            const time = server.clock.monotonicallyIncreasingTime();

            assert.isTrue(mitigator.satisfiesTimeThrottle(gunther, time, 1500, 'test'));
            assert.isTrue(mitigator.satisfiesTimeThrottle(russell, time, 1500, 'test'));
        }
    });

    it('should properly support the fighting-related mitigations', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const time = server.clock.monotonicallyIncreasingTime();
        const futureTime = time + 2000 /* two seconds beyond |time| */;

        // satisfiesWeaponFireConstraint
        {
            assert.isTrue(mitigator.satisfiesWeaponFireConstraint(gunther, time, 1500));
            assert.isTrue(mitigator.satisfiesWeaponFireConstraint(russell, time, 1500));

            gunther.shoot();

            assert.isFalse(mitigator.satisfiesWeaponFireConstraint(gunther, time, 1500));
            assert.isTrue(mitigator.satisfiesWeaponFireConstraint(russell, time, 1500));

            assert.isTrue(mitigator.satisfiesWeaponFireConstraint(gunther, futureTime, 1500));
        }

        gunther.respawn();
        russell.respawn();

        // satisfiesDamageIssuedConstraint
        {
            assert.isTrue(mitigator.satisfiesDamageIssuedConstraint(gunther, time, 1500));
            assert.isTrue(mitigator.satisfiesDamageIssuedConstraint(russell, time, 1500));

            gunther.shoot();

            assert.isTrue(mitigator.satisfiesDamageIssuedConstraint(gunther, time, 1500));
            assert.isTrue(mitigator.satisfiesDamageIssuedConstraint(russell, time, 1500));

            gunther.shoot({ target: russell });

            assert.isFalse(mitigator.satisfiesDamageIssuedConstraint(gunther, time, 1500));
            assert.isTrue(mitigator.satisfiesDamageIssuedConstraint(russell, time, 1500));

            assert.isTrue(mitigator.satisfiesDamageIssuedConstraint(gunther, futureTime, 1500));
        }

        gunther.respawn();
        russell.respawn();

        // satisfiesDamageTakenConstraint
        {
            assert.isTrue(mitigator.satisfiesDamageTakenConstraint(gunther, time, 1500));
            assert.isTrue(mitigator.satisfiesDamageTakenConstraint(russell, time, 1500));

            gunther.shoot();

            assert.isTrue(mitigator.satisfiesDamageTakenConstraint(gunther, time, 1500));
            assert.isTrue(mitigator.satisfiesDamageTakenConstraint(russell, time, 1500));

            gunther.shoot({ target: russell });

            assert.isTrue(mitigator.satisfiesDamageTakenConstraint(gunther, time, 1500));
            assert.isFalse(mitigator.satisfiesDamageTakenConstraint(russell, time, 1500));

            assert.isTrue(mitigator.satisfiesDamageTakenConstraint(russell, futureTime, 1500));
        }
    });
});
