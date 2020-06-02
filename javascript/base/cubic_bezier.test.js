// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CubicBezier } from 'base/cubic_bezier.js';

describe('CubicBezier', it => {
    it('is strict about invalid input', assert => {
        assert.throws(() => new CubicBezier());
        assert.throws(() => new CubicBezier('peanut'));
        assert.throws(() => new CubicBezier(3, 0, 0, 0));
        assert.throws(() => new CubicBezier(0, 3, 0, 0));
        assert.throws(() => new CubicBezier(0, 0, 3, 0));
        assert.throws(() => new CubicBezier(0, 0, 0, 3));
    });

    it('is able to resolve positions on the bezier curve', assert => {
        const curve = new CubicBezier(.5, 0, .5, 1);
        const values = [
            [   0, 0     ],
            [ 0.1, 0.015 ],
            [ 0.2, 0.064 ],
            [ 0.3, 0.16  ],
            [ 0.4, 0.309 ],
            [ 0.5, 0.5   ],
            [ 0.6, 0.691 ],
            [ 0.7, 0.84  ],
            [ 0.8, 0.936 ],
            [ 0.9, 0.985 ],
            [   1, 1     ]
        ];

        for (const [ x, expected ] of values) {
            assert.setContext(x);
            assert.closeTo(curve.calculate(x), expected, .001);
        }
    });
});
