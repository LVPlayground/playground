// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchDescription } from 'features/games_deathmatch/deathmatch_description.js';

describe('DeathmatchDescription', it => {
    it('should have sensible default values', assert => {
        const description = new DeathmatchDescription(/* description= */ null, /* options= */ {});

        assert.isFalse(description.lagCompensation);
    });

    it('should be able to take configuration from an object of options', assert => {
        const description = new DeathmatchDescription(/* description= */ null, {
            lagCompensation: true,
        });

        assert.isTrue(description.lagCompensation);
    });
});
