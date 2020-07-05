// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchDescription } from 'features/games_deathmatch/deathmatch_description.js';

describe('DeathmatchDescription', it => {
    it('should have sensible default values', assert => {
        const settings = server.featureManager.loadFeature('settings');
        const description = new DeathmatchDescription(
            /* description= */ null, /* options= */ {}, settings);

        assert.equal(
            description.lagCompensation, settings.getValue('games/deathmatch_lag_compensation'));
    });

    it('should be able to take configuration from an object of options', assert => {
        const settings = server.featureManager.loadFeature('settings');

        // (1) Create a description based on settings that enable everything.
        {
            const description = new DeathmatchDescription(/* description= */ null, {
                lagCompensation: true,

            }, settings);

            assert.isTrue(description.lagCompensation);
        }

        // (2) Create a description based on settings that change most things, but with different
        // values to catch cases where the server-defined default isn't overridden.
        {
            const description = new DeathmatchDescription(/* description= */ null, {
                lagCompensation: false,

            }, settings);

            assert.isFalse(description.lagCompensation);
        }
    });
});
