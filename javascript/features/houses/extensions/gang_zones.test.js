// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const createTestEnvironment = require('features/houses/test/test_environment.js');

const GangTester = require('features/gangs/test/gang_tester.js');
const GangZones = require('features/houses/extensions/gang_zones.js');

describe('GangZones', (it, beforeEach) => {
    let gangs = null;
    let gunther = null;
    let manager = null;
    let zones = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 498 });

        ({ gangs, manager } = await createTestEnvironment());

        await manager.ready;  // this automagically does the first zone recomputation

        for (const extension of manager.extensions_) {
            if (!(extension instanceof GangZones))
                continue;

            zones = extension;
            break;
        }

        assert.isNotNull(zones);
    });

    // ---------------------------------------------------------------------------------------------

    // Makes |gunther| purchase the first identified available house location.
    async function purchaseAvailableLocation() {
        for (const location of manager.locations) {
            if (!location.isAvailable())
                continue;

            await manager.createHouse(gunther, location, 1 /* interiorId */);
            return location;
        }

        throw new Error('Unable to find an available house location.');
    }

    // Makes |gunther| sell the house that they currently own.
    async function sellCurrentHouse() {
        for (const location of manager.getHousesForPlayer(gunther)) {
            await manager.removeHouse(location);
            return;  // sell at most one house
        }
    }

    // ---------------------------------------------------------------------------------------------

    it('should recompute the zones when a house has been created', async(assert) => {
        assert.equal(zones.recomputationCounter, 1);

        // (1) Creating a house for |gunther| while he's not in a gang does not recompute.
        {
            assert.isNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 0);

            await purchaseAvailableLocation();

            assert.equal(zones.recomputationCounter, 1);  // unchanged
        }

        await sellCurrentHouse();
        await GangTester.createGang(gunther);

        // (2) Creating a house for |gunther| while he's part of a gang does recompute.
        {
            assert.isNotNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 0);

            await purchaseAvailableLocation();

            assert.equal(zones.recomputationCounter, 2);  // increased
        }
    });

    it('should recompute the zones when a player joins a gang', async(assert) => {
        assert.equal(zones.recomputationCounter, 1);

        // (1) Having |gunther| join a gang while he doesn't have a house does not recompute.
        {
            assert.isNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 0);

            await GangTester.createGang(gunther);

            assert.equal(zones.recomputationCounter, 1);  // unchanged
        }

        await GangTester.leaveGang(gunther);
        await purchaseAvailableLocation();

        // (2) Having |gunther| join a gang while he has a house does recompute.
        {
            assert.isNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 1);

            await GangTester.createGang(gunther);

            assert.equal(zones.recomputationCounter, 2);  // increased
        }
    });

    it('should recompute the zones when a player leaves a gang', async(assert) => {
        assert.equal(zones.recomputationCounter, 1);

        await GangTester.createGang(gunther);
        const location = await purchaseAvailableLocation();

        assert.equal(zones.recomputationCounter, 2);

        // (1) Having |gunther| leave a gang that doesn't have a gang zone does not recompute.
        {
            assert.isNotNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 1);
            assert.isFalse(zones.participatingHouses_.has(location));

            await GangTester.leaveGang(gunther);

            assert.equal(zones.recomputationCounter, 2);  // unchanged
        }

        await GangTester.createGang(gunther);

        assert.equal(zones.recomputationCounter, 3);

        // (2) Having |gunther| leave a gang that does have a gang zone does recompute.
        {
            assert.isNotNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 1);

            zones.participatingHouses_.add(location);

            await GangTester.leaveGang(gunther);

            assert.equal(zones.recomputationCounter, 4);  // increased
        }
    });

    it('should recompute the zones when a player sells their house', async(assert) => {
        assert.equal(zones.recomputationCounter, 1);

        await GangTester.createGang(gunther);

        // (1) Having |gunther| sell their house that's not part of a zone does not recompute.
        {
            const location = await purchaseAvailableLocation();

            assert.equal(zones.recomputationCounter, 2);
            assert.isNotNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 1);
            assert.isFalse(zones.participatingHouses_.has(location));

            await sellCurrentHouse();

            assert.equal(zones.recomputationCounter, 2);  // unchanged
        }

        // (2) Having |gunther| sell their house that's part of a zone does recompute.
        {
            const location = await purchaseAvailableLocation();

            assert.equal(zones.recomputationCounter, 3);
            assert.isNotNull(gangs.getGangForPlayer(gunther));
            assert.equal(manager.getHousesForPlayer(gunther).length, 1);

            zones.participatingHouses_.add(location);

            await sellCurrentHouse();

            assert.equal(zones.recomputationCounter, 4);  // increased
        }
    });
});
