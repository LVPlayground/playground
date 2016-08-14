// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const InteriorManager = require('features/location/interior_manager.js');

describe('InteriorManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new InteriorManager());
    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    const AmmunationEntranceMarkerPosition = new Vector(2159.51, 943.329, 9.82339);
    const AmmunationExitMarkerPosition = new Vector(285.8, -85.45, 1000.54);

    const AmmunationInteriorId = 4;

    it('should load the defined interior markers from the data file', assert => {
        assert.isAbove(manager.markerCount, 0);
        assert.equal(manager.markerCount % 2, 0);  // an even number
    });

    it('should dispose of the created markers when being disposed of', assert => {
        const originalPickupCount = server.pickupManager.count;

        manager.dispose();
        assert.isBelow(server.pickupManager.count, originalPickupCount);

        manager = new InteriorManager();
        assert.equal(server.pickupManager.count, originalPickupCount);
        manager = null;
    });

    it('should teleport the player when standing in an interior marker', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        // Move Gunther to the entrance of the Ammunation in south Las Venturas.
        gunther.position = AmmunationEntranceMarkerPosition;

        // Wait five seconds to make sure that the entrance animation has finished.
        //await wait(5000);

        assert.equal(gunther.interiorId, AmmunationInteriorId);
        assert.notEqual(gunther.virtualWorld, 0);
    });
});
