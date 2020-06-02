// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';

import * as achievements from 'features/collectables/achievements.js';

describe('Achievements', (it, beforeEach) => {
    let delegate = null;
    let gunther = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');

        delegate = feature.manager_.getDelegate(CollectableDatabase.kAchievement);
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should have complete and unique information on all achievements', assert => {
        const whitelistedExports = new Set([ 'Achievements', 'kAchievements' ]);

        const exportedValues = new Map();

        for (const [ name, value ] of Object.entries(achievements)) {
            assert.setContext(name);

            if (whitelistedExports.has(name))
                continue;
                        
            // If the following assert fails, it means that an achievement got added that has a
            // duplicate value with an existing achievement. IDs must be stable, and not be reused.
            assert.isFalse(exportedValues.has(value));

            exportedValues.set(value, name);
        }

        for (const [ value, name ] of exportedValues) {
            assert.setContext(name);

            // If the following assert fails, it means that an achievement was added (or exists)
            // that doesn't have the appropriate information set in |kAchievements|.
            assert.isTrue(achievements.kAchievements.has(value));
        }
    });

    it('should activate effects with certain achievements', assert => {
        assert.equal(gunther.syncedData.vehicleKeys, 0);

        delegate.activateAchievementEffects(gunther, achievements.kAchievementRedBarrelSilver);
        assert.equal(gunther.syncedData.vehicleKeys, 2);

        delegate.activateAchievementEffects(gunther, achievements.kAchievementRedBarrelPlatinum);
        assert.equal(gunther.syncedData.vehicleKeys, 18);
    });

    it('should activate effects when a player logs in', async (assert) => {
        await gunther.identify();

        assert.equal(gunther.syncedData.vehicleKeys, 18);
    });
});
