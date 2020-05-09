// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import Settings from 'features/settings/settings.js';
import { ZoneCalculator } from 'features/gang_zones/zone_calculator.js';
import { ZoneDataAggregator } from 'features/gang_zones/zone_data_aggregator.js';
import { ZoneManager } from 'features/gang_zones/zone_manager.js';

import createHousesTestEnvironment from 'features/houses/test/test_environment.js';

describe('ZoneCalculator', (it, beforeEach, afterEach) => {
    /**
     * @type ZoneDataAggregator
     */
    let aggregator = null;

    /**
     * @type ZoneCalculator
     */
    let calculator = null;

    /**
     * @type ZoneManager
     */
    let manager = null;

    /**
     * @type Settings
     */
    let settings = null;

    beforeEach(async() => {
        await createHousesTestEnvironment();
        
        settings = server.featureManager.loadFeature('settings');

        manager = new ZoneManager();
        calculator = new ZoneCalculator(manager, () => settings);

        const database = new MockZoneDatabase();
        const gangs = server.featureManager.createDependencyWrapperForFeature('gangs');
        const houses = server.featureManager.createDependencyWrapperForFeature('houses');

        await database.populateTestHouses(houses());

        aggregator = new ZoneDataAggregator(database, gangs, houses);
        await aggregator.initialize();
    });

    afterEach(() => {
        calculator.dispose();
        manager.dispose();
    });

    it('is able to limit the number of gang areas', async (assert) => {
        const zoneGangBA = aggregator.activeGangs.get(MockZoneDatabase.BA);
        assert.isNotNull(zoneGangBA);

        for (let count = 2; count <= 8; ++count) {
            settings.setValue('gangs/zones_cluster_limit', count);
            assert.isBelowOrEqual(calculator.computeGangAreas(zoneGangBA).length, count);
        }
        
        settings.setValue('gangs/zones_cluster_limit', 8);
        assert.equal(calculator.computeGangAreas(zoneGangBA).length, 3);
    });

    it('is able to apply a member bonus factor to area calculations', async (assert) => {
        const zoneGangBA = aggregator.activeGangs.get(MockZoneDatabase.BA);
        assert.isNotNull(zoneGangBA);

        const paddingPercentage = 20;
        const bonusPercentage = 25;

        // Note: padding percentage will be applied on each area edge.
        settings.setValue('gangs/zones_area_padding_pct', paddingPercentage);

        settings.setValue('gangs/zones_area_bonus_members', 5);
        settings.setValue('gangs/zones_area_bonus_members_pct', bonusPercentage);

        const bonusAreas = calculator.computeGangAreas(zoneGangBA);
        assert.equal(bonusAreas.length, 3);
        assert.isAbove(bonusAreas.filter(info => info.bonuses.includes('member_bonus')).length, 0);

        for (const info of bonusAreas) {
            assert.closeTo(info.paddedArea.width,
                           info.enclosingArea.width * (1 + (paddingPercentage / 100) * 2), 0.1);
            assert.closeTo(info.paddedArea.height,
                           info.enclosingArea.height * (1 + (paddingPercentage / 100) * 2), 0.1);
  
            if (!info.bonuses.includes('member_bonus'))
                continue;
            
            assert.closeTo(info.area.width,
                           info.paddedArea.width * (1 + (bonusPercentage / 100) * 2), 0.1);
            assert.closeTo(info.area.height,
                           info.paddedArea.height * (1 + (bonusPercentage / 100) * 2), 0.1);
        }

        settings.setValue('gangs/zones_area_bonus_members', Number.MAX_SAFE_INTEGER);

        const regularAreas = calculator.computeGangAreas(zoneGangBA);
        assert.equal(regularAreas.length, 3);
        assert.equal(regularAreas.filter(info => info.bonuses.includes('member_bonus')).length, 0);
    });
});
