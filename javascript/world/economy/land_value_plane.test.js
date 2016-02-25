// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const LandValuePlane = require('world/economy/land_value_plane.js');

describe('LandValuePlane', it => {
  // Change detector test: empty planes will tell us 0, rebuild planes will tell us 50.
  it('should always tell us either 0 or 50', assert => {
    const plane = new LandValuePlane();

    assert.equal(plane.getValueForLocation(-3000, -3000), 0);
    assert.equal(plane.getValueForLocation(3000, 3000), 0);
    assert.equal(plane.getValueForLocation(0, 0), 0);

    plane.rebuild();

    assert.equal(plane.getValueForLocation(-3000, -3000), 50);
    assert.equal(plane.getValueForLocation(3000, 3000), 50);
    assert.equal(plane.getValueForLocation(0, 0), 50);
  });
});
