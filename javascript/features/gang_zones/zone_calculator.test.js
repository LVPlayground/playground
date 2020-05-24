// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import Settings from 'features/settings/settings.js';
import { ZoneCalculator } from 'features/gang_zones/zone_calculator.js';
import { ZoneDataAggregator } from 'features/gang_zones/zone_data_aggregator.js';

import createHousesTestEnvironment from 'features/houses/test/test_environment.js';

describe('ZoneCalculator', (it, beforeEach, afterEach) => {
    // Fake that implements the methods expected by the ZoneCalculator in the ZoneManager for the
    // creation, updating and deletion of gang zones, that allows for introspection for testing.
    class FakeZoneManager {
        zones = new Set();

        createZone(zone) { this.zones.add(zone); }
        updateZone(zone) { /* no need, given that |zones| is a set */ }
        deleteZone(zone) { this.zones.delete(zone); }
    }

    /**
     * @type ZoneDataAggregator
     */
    let aggregator = null;

    /**
     * @type ZoneCalculator
     */
    let calculator = null;

    /**
     * @type FakeZoneManager
     */
    let manager = null;

    /**
     * @type Settings
     */
    let settings = null;

    beforeEach(async() => {
        await createHousesTestEnvironment();
        
        settings = server.featureManager.loadFeature('settings');

        manager = new FakeZoneManager();
        calculator = new ZoneCalculator(manager, () => settings);

        const database = new MockZoneDatabase();
        const gangs = server.featureManager.createDependencyWrapperForFeature('gangs');
        const houses = server.featureManager.createDependencyWrapperForFeature('houses');

        await database.populateTestHouses(houses());

        aggregator = new ZoneDataAggregator(database, gangs, houses);
        await aggregator.initialize();
    });

    afterEach(() => calculator.dispose());

    it('is able to limit the number of areas created for an individual gang', async (assert) => {
        const zoneGangBA = aggregator.activeGangs.get(MockZoneDatabase.BA);
        assert.isNotNull(zoneGangBA);

        for (let count = 2; count < 8; ++count) {
            settings.setValue('gangs/zones_area_limit', count);
            assert.isBelowOrEqual(calculator.computeGangAreas(zoneGangBA).length, count);
        }
        
        settings.setValue('gangs/zones_area_limit', 8);
        assert.equal(calculator.computeGangAreas(zoneGangBA).length, 3);
    });

    it('is able to tell the manager which zones should be created and deleted', assert => {
        const zoneGangBA = aggregator.activeGangs.get(MockZoneDatabase.BA);
        assert.isNotNull(zoneGangBA);

        assert.equal(manager.zones.size, 0);

        calculator.onGangUpdated(zoneGangBA);
        assert.isAbove(manager.zones.size, 1);

        calculator.onGangDeactivated(zoneGangBA);
        assert.equal(manager.zones.size, 0);
    });

    it('is able to tell the manager which zones should be updated', assert => {
        const zoneGangBA = aggregator.activeGangs.get(MockZoneDatabase.BA);
        assert.isNotNull(zoneGangBA);

        assert.equal(manager.zones.size, 0);

        calculator.onGangUpdated(zoneGangBA);

        const zoneCountWithPadding = manager.zones.size;
        assert.isAbove(zoneCountWithPadding, 1);

        let totalAreaWithPadding = 0;
        for (const zone of manager.zones)
            totalAreaWithPadding += zone.area.area;

        // Remove the area padding, which will cause the zone's size to shrink.
        settings.setValue('gangs/zones_area_padded_percentage', 0);

        calculator.onGangUpdated(zoneGangBA);
        assert.equal(manager.zones.size, zoneCountWithPadding);

        let totalAreaWithoutPadding = 0;
        for (const zone of manager.zones)
            totalAreaWithoutPadding += zone.area.area;

        assert.isBelow(totalAreaWithoutPadding, totalAreaWithPadding);
    });

    it('is able to apply a member bonus factor to area calculations', assert => {
        const zoneGangBA = aggregator.activeGangs.get(MockZoneDatabase.BA);
        assert.isNotNull(zoneGangBA);

        const paddingPercentage = 20;
        const bonusUnits = 25;

        // Note: padding percentage will be applied on each area edge.
        settings.setValue('gangs/zones_area_padded_percentage', paddingPercentage);

        settings.setValue('gangs/zones_area_bonus_medium_count', 5);
        settings.setValue('gangs/zones_area_bonus_medium_bonus', bonusUnits);

        const bonusAreas = calculator.computeGangAreas(zoneGangBA);
        assert.equal(bonusAreas.length, 3);
        assert.isAbove(bonusAreas.filter(info => info.bonuses.includes('medium-gang')).length, 0);

        for (const info of bonusAreas) {
            assert.closeTo(info.paddedArea.width,
                           info.enclosingArea.width * (1 + (paddingPercentage / 100) * 2), 0.1);
            assert.closeTo(info.paddedArea.height,
                           info.enclosingArea.height * (1 + (paddingPercentage / 100) * 2), 0.1);
  
            if (!info.bonuses.includes('medium-gang'))
                continue;
            
            assert.closeTo(info.area.width, info.paddedArea.width + 2 * bonusUnits, 0.1);
            assert.closeTo(info.area.height, info.paddedArea.height + 2 * bonusUnits, 0.1);
        }

        settings.setValue('gangs/zones_area_bonus_medium_count', Number.MAX_SAFE_INTEGER);

        const regularAreas = calculator.computeGangAreas(zoneGangBA);
        assert.equal(regularAreas.length, 3);
        assert.equal(regularAreas.filter(info => info.bonuses.includes('medium-gang')).length, 0);
    });
});
