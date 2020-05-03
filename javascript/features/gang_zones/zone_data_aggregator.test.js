// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import { ZoneDataAggregator, kZoneDominanceActiveMemberRequirement } from 'features/gang_zones/zone_data_aggregator.js';

describe('ZoneDataAggregator', (it, beforeEach, afterEach) => {
    let aggregator = null;
    let database = null;
    
    beforeEach(() => {
        database = new MockZoneDatabase();
        aggregator = new ZoneDataAggregator(database);
    });

    afterEach(() => {
        aggregator.dispose();
        aggregator = null;
    });

    it('is able to execute Step 1. of the zone dominance algorithm', async (assert) => {
        // Determination of "active players", and the gangs associated with them.
        await aggregator.initialize();

        assert.isAboveOrEqual(aggregator.gangs.size, 1);
        for (const gang of aggregator.gangs.values())
            assert.isAboveOrEqual(gang.size, 1);
    });

    it('is able to execute Step 2. of the zone dominance algorithm', async (assert) => {
        // Determination of "active gangs", and basic details associated with them.
        await aggregator.initialize();

        assert.isAboveOrEqual(aggregator.gangs.size, 1);
        assert.isTrue(aggregator.gangs.has(MockZoneDatabase.BA));

        const baGang = aggregator.gangs.get(MockZoneDatabase.BA);

        assert.isNotNull(baGang);
        assert.isAboveOrEqual(baGang.size, kZoneDominanceActiveMemberRequirement);
    });
});
