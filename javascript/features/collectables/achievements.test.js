// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import * as achievements from 'features/collectables/achievements.js';

describe('Achievements', it => {
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
});
