// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoCircle = require('world/geometry/geo_circle.js'),
      GeoPlane = require('world/geometry/geo_plane.js'),
      GeoRectangle = require('world/geometry/geo_rectangle.js');

describe('GeoPlane', it => {
  // Utility function for generating a random rectangle.
  const createRectangle = () => new GeoRectangle();

  it('should adjust the bounding box on object modification', assert => {
    const plane = new GeoPlane();

    plane.insert(new GeoRectangle(10, 15, 10, 10));
    assert.deepEqual(plane.boundingBox, [10, 15, 20, 25]);

    plane.insert(new GeoCircle(10, 10, 5));
    assert.deepEqual(plane.boundingBox, [5, 5, 20, 25]);
  });

  it('should split the tree when reaching the maximum number of entries in a node', assert => {
    const plane = new GeoPlane();
    for (let i = 0; i < GeoPlane.MAX_ENTRIES + 1; ++i)
      plane.insert(createRectangle());

    assert.equal(plane.height, 2);
  });
});
