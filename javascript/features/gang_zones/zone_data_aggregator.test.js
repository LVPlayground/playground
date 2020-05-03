// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import { ZoneDataAggregator, kZoneDominanceActiveMemberRequirement } from 'features/gang_zones/zone_data_aggregator.js';

import createHousesTestEnvironment from 'features/houses/test/test_environment.js';

describe('ZoneDataAggregator', (it, beforeEach, afterEach) => {
    let aggregator = null;
    let database = null;
    
    beforeEach(async() => {
        await createHousesTestEnvironment();

        const gangsWrapper = server.featureManager.createDependencyWrapperForFeature('gangs');

        const houses = server.featureManager.loadFeature('houses');
        const housesWrapper = server.featureManager.createDependencyWrapperForFeature('houses');

        database = new MockZoneDatabase();
        await database.populateTestHouses(houses);

        aggregator = new ZoneDataAggregator(database, gangsWrapper, housesWrapper);
    });

    afterEach(() => {
        aggregator.dispose();
        aggregator = null;
    });

    it('is able to execute Step 1. of the zone dominance algorithm', async (assert) => {
        // Determination of "active players", and the gangs associated with them.
        await aggregator.initialize();

        assert.isAboveOrEqual(aggregator.activeGangs.size, 1);
        for (const gang of aggregator.activeGangs.values())
            assert.isAboveOrEqual(gang.members.size, 1);
    });

    it('is able to execute Step 2. of the zone dominance algorithm', async (assert) => {
        // Determination of "active gangs", and basic details associated with them.
        await aggregator.initialize();

        assert.isAboveOrEqual(aggregator.activeGangs.size, 1);
        assert.isTrue(aggregator.activeGangs.has(MockZoneDatabase.BA));

        const baGang = aggregator.activeGangs.get(MockZoneDatabase.BA);

        assert.isNotNull(baGang);
        assert.isAboveOrEqual(baGang.members.size, kZoneDominanceActiveMemberRequirement);
    });

    it('is able to gather data for Step 3. of the zone dominance algorithm', async (assert) => {
        // Gather the houses owned by the active gang members.
        await aggregator.initialize();

        let totalHouses = 0;

        assert.isAboveOrEqual(aggregator.activeGangs.size, 1);
        for (const gang of aggregator.activeGangs.values()) {
            assert.isAboveOrEqual(gang.members.size, 1);

            for (const member of gang.members.values())
                totalHouses += member.houses.size;
        }

        assert.isAboveOrEqual(totalHouses, 1);
    });

    it('reconsiders a gang for having a zone on gang membership changes', async (assert) => {
        let reconsiderationCounter = 0;

        // Override the |reconsiderGangForZone| method since we're only interested in call counts.
        aggregator.__proto__.reconsiderGangForZone = async (zoneGang) => {
            ++reconsiderationCounter;
        };

        await aggregator.initialize();
        
        assert.isAboveOrEqual(reconsiderationCounter, 0);

        // TODO: A player joining an inactive gang, making it active.

        // TODO: A player joining the server who wasn't considered an active member, but now is.
        
        // A player leaving an active gang should end up reconsidering that gang for their gang zone
        // applicability as well, as this affects their member count, house distribution, etc...
        const beforeRemovalReconsiderationCounter = reconsiderationCounter;
        {
            aggregator.onUserLeaveGang(/* [BA]AzKiller= */ 9001, MockZoneDatabase.BA);
            await server.clock.advance(1);  // asynchronous reconsideration
        }
        assert.isAbove(reconsiderationCounter, beforeRemovalReconsiderationCounter);
    });

    it('reconsiders a gang for having a zone on house creation and deletion', async (assert) => {
        const houses = server.featureManager.loadFeature('houses');

        let reconsiderationCounter = 0;

        // Override the |reconsiderGangForZone| method since we're only interested in call counts.
        aggregator.__proto__.reconsiderGangForZone = async (zoneGang) => {
            ++reconsiderationCounter;
        };

        await aggregator.initialize();
        
        assert.isAboveOrEqual(reconsiderationCounter, 0);
    
        // Recreate all the houses we populate for testing, which count as mutations.
        const initializedReconsiderationCounter = reconsiderationCounter;
        {
            await database.populateTestHouses(houses);
            await server.clock.advance(1);  // asynchronous reconsideration
        }
        assert.isAbove(reconsiderationCounter, initializedReconsiderationCounter);

        // Manually remove a house owned by one of our gang members. This should trigger
        const housesAddedReconsiderationCounter = reconsiderationCounter;
        {
            for (const location of houses.manager_.locations) {
                if (!location.isAvailable())
                    await houses.manager_.removeHouse(location);
            }

            await server.clock.advance(1);  // asynchronous reconsideration
        }
        assert.isAbove(reconsiderationCounter, initializedReconsiderationCounter);
    });
});
