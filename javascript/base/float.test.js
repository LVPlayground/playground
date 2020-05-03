// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { toFloat } from 'base/float.js';

describe('float', it => {
    it('is able to convert integer views of floats, back to floats', assert => {
        assert.closeTo(toFloat(1033238885), 0.073, 0.001);
        assert.closeTo(toFloat(1033892929), 0.078, 0.001);
    });
});
