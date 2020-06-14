// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Rect } from 'base/rect.js';

describe('Rect', it => {
    it('should reflect the given values', assert => {
        const rect = new Rect(100, 80, 150, 120);

        assert.equal(rect.minX, 100);
        assert.equal(rect.minY, 80);
        assert.equal(rect.maxX, 150);
        assert.equal(rect.maxY, 120);

        assert.equal(rect.width, 50);
        assert.equal(rect.height, 40);

        assert.equal(rect.circumference, 2 * 50 + 2 * 40);
        assert.equal(rect.area, 50 * 40);

        assert.deepEqual(rect.center, [ 125, 100 ]);

        assert.deepEqual(rect.topLeft, [ 100, 80 ]);
        assert.deepEqual(rect.topRight, [ 150, 80 ]);
        assert.deepEqual(rect.bottomLeft, [ 100, 120 ]);
        assert.deepEqual(rect.bottomRight, [ 150, 120 ]);
    });

    it('should be able to create new, derived rectangles', assert => {
        const rect = new Rect(100, 80, 150, 120);

        assert.deepEqual(rect.extend(10), new Rect(90, 70, 160, 130));
        assert.deepEqual(rect.extend(20, 30), new Rect(80, 50, 170, 150));

        assert.deepEqual(rect.shrink(10), new Rect(110, 90, 140, 110));
        assert.deepEqual(rect.shrink(20, 15), new Rect(120, 95, 130, 105));
    });

    it('should be able to determine rectangular overlap', assert => {
        const rect = new Rect(0, 0, 100, 100);

        assert.isTrue(rect.overlaps(new Rect(-20, 40, 120, 60))); // vertical overlap
        assert.isTrue(rect.overlaps(new Rect(40, -20, 60, 120))); // horizontal overlap
        assert.isTrue(rect.overlaps(new Rect(-10, -10, 110, 110)));  // engulfs
        assert.isTrue(rect.overlaps(new Rect(40, 40, 60, 60)));  // contains

        assert.isFalse(rect.overlaps(new Rect(-10, -10, 0, 0)));  // touches
        assert.isFalse(rect.overlaps(new Rect(100, 0, 200, 100)));  // adjacent

        assert.isFalse(rect.overlaps(new Rect(600, 600, 700, 700)));  // somewhere else
    });

    it('should be able to convert a rectangle to a string', assert => {
        const rect = new Rect(50, 50, 150, 170);

        assert.equal(rect.toString(), 'x: 50, y: 50, width: 100, height: 120');
    });
});
