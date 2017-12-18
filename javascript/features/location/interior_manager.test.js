// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import InteriorManager from 'features/location/interior_manager.js';
import Portal from 'features/location/portal.js';

describe('InteriorManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => {
        const abuse = server.featureManager.loadFeature('abuse');

        manager = new InteriorManager(() => abuse);
        manager.loadPortalFile('data/portals/ammunation.json');
    });

    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    const AmmunationEntranceMarkerPosition = new Vector(2159.51, 943.329, 9.82339);
    const AmmunationExitMarkerPosition = new Vector(285.8, -85.45, 1000.54);

    const AmmunationInteriorId = 4;

    it('should load the defined interior markers from the data file', assert => {
        assert.isAbove(manager.portalCount, 0);
        assert.equal(manager.markerCount, manager.portalCount * 2);
    });

    it('should dispose of the created markers when being disposed of', assert => {
        const originalPickupCount = server.pickupManager.count;

        manager.dispose();
        assert.isBelow(server.pickupManager.count, originalPickupCount);

        manager = new InteriorManager();
        manager.loadPortalFile('data/portals/ammunation.json');

        assert.equal(server.pickupManager.count, originalPickupCount);
        manager = null;
    });

    it('should teleport the player when standing in an interior marker', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        // Move Gunther to the entrance of the Ammunation in south Las Venturas.
        gunther.position = AmmunationEntranceMarkerPosition;

        // Wait a tick to make sure that the permission check has finished.
        await Promise.resolve();

        assert.equal(gunther.interiorId, AmmunationInteriorId);
        assert.notEqual(gunther.virtualWorld, 0);
    });

    it('should be able to remove portals after they have been added', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        let enterCounter = 0;
        let exitCounter = 0;

        const portal = new Portal('My Portal', {
            position: new Vector(500, 500, 500),
            facingAngle: 180,
            interiorId: 0,
            virtualWorld: 0
        }, {
            position: new Vector(1000, 1000, 1000),
            facingAngle: 90,
            interiorId: 5,
            virtualWorld: 100
        }, {
            enterFn: player => ++enterCounter,
            exitFn: player => ++exitCounter
        });

        assert.doesNotThrow(() => manager.createPortal(portal));

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        assert.equal(enterCounter, 0);
        assert.equal(exitCounter, 0);

        // Move Gunther to the entrance position of the portal.
        gunther.position = portal.entrancePosition;

        // Wait a tick to make sure that the permission check has finished.
        await Promise.resolve();

        assert.equal(gunther.interiorId, 5);
        assert.equal(gunther.virtualWorld, 100);

        assert.equal(enterCounter, 1);
        assert.equal(exitCounter, 0);

        // Remove the expected pickup and re-position Gunther to the exit pickup, to leave it.
        manager.expectedPickup_.delete(gunther);
        gunther.position = portal.exitPosition;

        // Wait a tick to make sure that the permission check has finished.
        await Promise.resolve();

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        assert.equal(enterCounter, 1);
        assert.equal(exitCounter, 1);

        // Now remove the |portal| from the manager.
        assert.doesNotThrow(() => manager.removePortal(portal));

        // Remove the expected pickup and re-position Gunther to the entrance pickup, to enter it.
        manager.expectedPickup_.delete(gunther);
        gunther.position = portal.entrancePosition;

        // Wait a tick to make sure that the permission check has finished.
        await Promise.resolve();

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        assert.equal(enterCounter, 1);
        assert.equal(exitCounter, 1);
    });

    it('should be possible for portals to have custom access checks', async(assert) => {
        const permissionDeniedMessage = 'Sorry, you cannot enter this portal right now!';

        const gunther = server.playerManager.getById(0 /* Gunther */);
        const portal = new Portal('My Portal', {
            position: new Vector(500, 500, 500),
            facingAngle: 180,
            interiorId: 0,
            virtualWorld: 0
        }, {
            position: new Vector(1000, 1000, 1000),
            facingAngle: 90,
            interiorId: 5,
            virtualWorld: 100
        }, {
            accessCheckFn: player => {
                player.sendMessage(permissionDeniedMessage);
                return false;
            }
        });

        assert.doesNotThrow(() => manager.createPortal(portal));

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        // Move Gunther to the entrance position of the portal.
        gunther.position = portal.entrancePosition;

        // Wait a tick to make sure that the permission check has finished. The check will fail, so
        // we don't expect Gunther to be allowed to teleport.
        await Promise.resolve();

        assert.equal(gunther.interiorId, 0);
        assert.equal(gunther.virtualWorld, 0);

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], permissionDeniedMessage);
    });

    it('should have the ability to display a label with a portal', assert => {
        const originalTextLabelCount = server.textLabelManager.count;

        const portal = new Portal('My Portal', {
            position: new Vector(500, 500, 500),
            facingAngle: 180,
            interiorId: 0,
            virtualWorld: 0
        }, {
            position: new Vector(1000, 1000, 1000),
            facingAngle: 90,
            interiorId: 5,
            virtualWorld: 100
        }, {
            label: 'Hello, world!'
        });

        assert.doesNotThrow(() => manager.createPortal(portal));
        assert.equal(server.textLabelManager.count, originalTextLabelCount + 1);

        assert.doesNotThrow(() => manager.removePortal(portal));
        assert.equal(server.textLabelManager.count, originalTextLabelCount);
    });

    it('should be possible to have portals in different colors', assert => {
        const originalPickupCount = server.pickupManager.count;

        const testCases = [
            { value: 'yellow', modelId: 19902 },
            { value: 'red', modelId: 19605 },
            { value: 'green', modelId: 19606 },
            { value: 'blue', modelId: 19607 }
        ];

        for (const testCase of testCases) {
            const portal = new Portal('My Portal', {
                position: new Vector(500, 500, 500),
                facingAngle: 180,
                interiorId: 0,
                virtualWorld: 0
            }, {
                position: new Vector(1000, 1000, 1000),
                facingAngle: 90,
                interiorId: 5,
                virtualWorld: 100
            }, {
                color: testCase.value
            });

            assert.doesNotThrow(() => manager.createPortal(portal));
            assert.equal(server.pickupManager.count, originalPickupCount + 2);

            const { entrancePickup, exitPickup } = manager.getPortalPickupsForTests(portal);

            assert.equal(entrancePickup.modelId, testCase.modelId);
            assert.equal(exitPickup.modelId, 19902 /* exits are always yellow */);

            assert.doesNotThrow(() => manager.removePortal(portal));
            assert.equal(server.pickupManager.count, originalPickupCount);
        }

    });
});
