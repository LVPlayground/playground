// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { range } from 'base/range.js';

describe('range', it => {
    it('validates that the given arguments are sensible', assert => {
        assert.throws(() => range('banana'));
        assert.throws(() => range(false, true));
        assert.throws(() => range(1, 'eleven'));
        assert.throws(() => range(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
    });

    it('is able to create ranges starting at zero', assert => {
        let digits = range(9);

        assert.equal(digits.length, 9);
        for (let i = 0; i < 9; ++i)
            assert.equal(digits[i], i);

        digits = range(-9);

        assert.equal(digits.length, 9);
        for (let i = 0; i < 9; ++i)
            assert.equal(digits[i], 0 - i);
    });

    it('is able to create ranges between two numbers', assert => {
        let digits = range(10, 20);

        assert.equal(digits.length, 10);
        for (let i = 0; i <= 9; ++i)
            assert.equal(digits[i], 10 + i);
        
        digits = range(20, 10);

        assert.equal(digits.length, 10);
        for (let i = 0; i <= 9; ++i)
            assert.equal(digits[i], 20 - i);
    });

    it('is able to create rangers with a custom step', assert => {
        let digits = range(10, 20, 2);

        assert.equal(digits.length, 5);
        for (let i = 0; i < 5; ++i)
            assert.equal(digits[i], 10 + i*2);
        
        digits = range(20, 10, -2);

        assert.equal(digits.length, 5);
        for (let i = 0; i < 5; ++i)
            assert.equal(digits[i], 20 - i*2);
    });
});
