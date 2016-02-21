// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ResidentialValuePlane = require('world/economy/land_value/residential_value_plane.js');

describe('ResidentialValuePlane', it => {
  const plane = new ResidentialValuePlane();

  it('assigns `0` values to unpopulated areas', assert => {
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


  it('assigns `2` values to the richer and mid-size towns', assert => {
    const towns = [
      [-2400, 2350],  // Bayside
      [0, 1050],      // Fort Carson
      [2400, 0]       // Palomino Creek
    ];

    towns.forEach(point =>
        assert.equal(plane.getResidentialValueForLocation(...point), 2));
  });

  it('assigns `3` values to the outskirts of the three big cities', assert => {
    const outskirts = [
      [1616, 2628],   // Las Venturas (1)
      [2533, 1113],   // Las Venturas (2)
      [1667, 713],    // Las Venturas (3)
      [-2711, 40],    // San Fierro (1)
      [-1625, 977],   // San Fierro (2)
      [-2669, 1190],  // San Fierro (3)
      [1294, -1192],  // Los Santos (1)
      [2736, -1371],  // Los Santos (2)
      [513, -1670]    // Los Santos (3)
    ];

    outskirts.forEach(point =>
        assert.equal(plane.getResidentialValueForLocation(...point), 3));
  });

  it('assigns `4` values to the centers of the three big cities', assert => {
    const cityCenters = [
      [2100, 1600],   // Las Venturas
      [-2100, 500],   // San Fierro
      [1300, -1500],  // Los Santos (1)
      [2300, -1700]   // Los Santos (2)
    ];

    cityCenters.forEach(point =>
        assert.equal(plane.getResidentialValueForLocation(...point), 4));
  });

  it('assigns `5` values to airports and strategic places', assert => {
    const strategicPlaces = [
      [1490, 1141],    // Las Venturas Airport
      [-1337, -214],   // San Fierro Airport
      [1811, -2511],   // Los Santos Airport
      [275, 2460],     // Desert Airport
      [-2290, -1660],  // Mount Chilliad summit
      [-2025, -880],   // Sillicon Valley
      [2474, -1690],   // Grove Street
      [-1420, 380],    // Millitary Base
      [200, 1845],     // Area 51
      [2000, 1500]     // Pirate Ship
    ];

    strategicPlaces.forEach(point =>
        assert.equal(plane.getResidentialValueForLocation(...point), 5));
  });

});
