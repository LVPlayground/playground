// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Vector = require('base/vector.js');

describe('Vector', it => {
  it('should reflect the values', assert => {
    let vector = new Vector(100, 200, 300);
    assert.equal(vector.x, 100);
    assert.equal(vector.y, 200);
    assert.equal(vector.z, 300);
  });

  it('should calculate the magnitude', assert => {
    let vector = new Vector(4, 8, 12);

    // 2D magnitude: sqrt(4^2 + 8^2)
    assert.closeTo(vector.magnitude2D, 8.944, 0.001);

    // 3D magnitude: sqrt(4^2 + 8^2 + 12^2)
    assert.closeTo(vector.magnitude3D, 14.967, 0.001);
  });
});
