// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { random } from 'base/random.js';

describe('random', it => {
    it('should be able to return random numbers within a range', assert => {
        const cases = [
            [ 0, 100 ],
            [ -1000, 1000 ],
            [  1000, 1000 ]
        ];

        for (const [min, max] of cases) {
            assert.setContext(`case (${min} - ${max})`);

            for (let i = 0; i < 50; ++i) {
                const value = random(min, max);

                assert.isAboveOrEqual(value, min);
                assert.isBelowOrEqual(value, max);
            }
        }
    });

    it('should be able to return numbers between [0, max]', assert => {
        assert.throws(() => random(-10));

        for (let i = 0; i < 50; ++i) {
            const value = random(100);

            assert.isAboveOrEqual(value, 0);
            assert.isBelowOrEqual(value, 100);
        }
    });
});
