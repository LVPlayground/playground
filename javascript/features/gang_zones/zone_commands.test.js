// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import GangZones from 'features/gang_zones/gang_zones.js';
import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import { Player } from 'entities/player.js';

import createHousesTestEnvironment from 'features/houses/test/test_environment.js';

describe('ZoneCommands', (it, beforeEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(async() => { global.xx = 1;
        await createHousesTestEnvironment();

        // Register the |gang_zones| feature since it's not being loaded by default.
        server.featureManager.registerFeaturesForTests({
            gang_zones: GangZones,
        });

        const feature = server.featureManager.loadFeature('gang_zones');
        const houses = server.featureManager.loadFeature('houses');
        const playground = server.featureManager.loadFeature('playground');

        await MockZoneDatabase.populateTestHouses(houses);

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;

        // Change the |zone| command's access requirements so that everyone can use it.
        playground.access.setCommandLevel('zone', Player.LEVEL_PLAYER);
    });

    it('should be able to run tests with all data initialized', async (assert) => {
        assert.equal(manager.areaManager_.zones_.size, 3);
    });
});
