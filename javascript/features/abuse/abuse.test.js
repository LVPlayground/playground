// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockAbuse = require('features/abuse/test/mock_abuse.js');

describe('Abuse', (it, beforeEach) => {
    let abuse = null;

    beforeEach(() => {
        server.featureManager.registerFeaturesForTests({
            abuse: MockAbuse
        });

        abuse = server.featureManager.loadFeature('abuse');
    });

    it('should allow or deny teleportation based on fighting activities', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        // Both issuing and taking damage temporarily blocks teleportation in Las Venturas.
        {
            gunther.position = new Vector(2000, 2000, 0);
            assert.isTrue(abuse.canTeleport(gunther));

            gunther.shoot();
            assert.isTrue(abuse.canTeleport(gunther));

            russell.shoot({ target: gunther });
            assert.isFalse(abuse.canTeleport(gunther));

            gunther.shoot({ target: russell });
            assert.isFalse(abuse.canTeleport(gunther));
        }

        await server.clock.advance(60000);  // arbitrary amount

        // Only issuing damage temporarily blocks teleportation outside of Las Venturas.
        {
            gunther.position = new Vector(0, 0, 0);
            assert.isTrue(abuse.canTeleport(gunther));

            gunther.shoot();
            assert.isTrue(abuse.canTeleport(gunther));

            russell.shoot({ target: gunther });
            assert.isTrue(abuse.canTeleport(gunther));

            gunther.shoot({ target: russell });
            assert.isFalse(abuse.canTeleport(gunther));
        }
    });
});
