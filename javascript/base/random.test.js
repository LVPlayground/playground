// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { createSeed, random, randomSeed } from 'base/random.js';

describe('random', it => {
    it('should be able to return random numbers within a range', assert => {
        const cases = [
            [ 0, 100 ],
            [ -1000, 1000 ],
            [  1000, 2000 ]
        ];

        for (const [min, max] of cases) {
            assert.setContext(`case (${min} - ${max})`);

            for (let i = 0; i < 50; ++i) {
                const value = random(min, max);

                assert.isAboveOrEqual(value, min);
                assert.isBelow(value, max);
            }
        }
    });

    it('should be able to return numbers between [0, max]', assert => {
        assert.throws(() => random(-10));

        for (let i = 0; i < 50; ++i) {
            const value = random(100);

            assert.isAboveOrEqual(value, 0);
            assert.isBelow(value, 100);
        }
    });

    it('should be able to return values from [0, 1]', assert => {
        for (let i = 0; i < 50; ++i) {
            const value = random();

            assert.isAboveOrEqual(value, 0);
            assert.isBelow(value, 1);
        }
    });

    it('should be able to support seeded hashes', assert => {
        const firstSeed = createSeed('banana');
        const secondSeed = createSeed('banana');
        const thirdSeed = createSeed('apple');

        assert.equal(randomSeed(firstSeed, 100), randomSeed(secondSeed, 100));
        assert.equal(randomSeed(firstSeed, 10, 20), randomSeed(secondSeed, 10, 20));

        assert.notEqual(
            randomSeed(firstSeed, Number.MAX_SAFE_INTEGER),
            randomSeed(thirdSeed, Number.MAX_SAFE_INTEGER));
    });
});
