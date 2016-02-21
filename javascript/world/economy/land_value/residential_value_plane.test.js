// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ResidentialValuePlane = require('world/economy/land_value/residential_value_plane.js');

describe('ResidentialValuePlane', it => {
  const plane = new ResidentialValuePlane();

  it('assigns zero values to unpopulated areas', assert => {
    const unpopulatedPoints = [
      [-2280, 1830],   // bay north of San Fierro
      [530, -2520],    // bay west of Los Santos
      [2620, 460],     // river between the Las Venturas and Los Santos islands
      [-1600, -2000],  // woods next to Mount Chilliad
      [-6000, -6000]   // random out-of-bounds position
    ];

    unpopulatedPoints.forEach(point =>
        assert.equal(plane.getResidentialValueForLocation(...point), 0));
  });

});
