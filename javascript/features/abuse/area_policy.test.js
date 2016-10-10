// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AreaPolicy = require('features/abuse/area_policy.js');

describe('AreaPolicy', it => {
    it('should return different policies for within and outside of Las Venturas', assert => {
        const lasVenturasPolicy = AreaPolicy.getForPosition(new Vector(2000, 2000, 0));
        const sanAndreasPolicy = AreaPolicy.getForPosition(new Vector(0, 0, 0));

        assert.notStrictEqual(lasVenturasPolicy, sanAndreasPolicy);

        // Change detector tests.

        assert.isFalse(lasVenturasPolicy.enforceTeleportationTimeLimit);
        assert.isFalse(sanAndreasPolicy.enforceTeleportationTimeLimit);

        assert.isFalse(lasVenturasPolicy.firingWeaponBlocksTeleporation);
        assert.isFalse(sanAndreasPolicy.firingWeaponBlocksTeleporation);

        assert.isTrue(lasVenturasPolicy.issuingDamageBlocksTeleport);
        assert.isTrue(sanAndreasPolicy.issuingDamageBlocksTeleport);

        assert.isTrue(lasVenturasPolicy.takingDamageBlocksTeleport);
        assert.isFalse(sanAndreasPolicy.takingDamageBlocksTeleport);
    });
});
