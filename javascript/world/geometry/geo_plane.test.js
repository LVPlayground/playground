// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoCircle = require('world/geometry/geo_circle.js'),
      GeoPlane = require('world/geometry/geo_plane.js'),
      GeoRectangle = require('world/geometry/geo_rectangle.js');

describe('GeoPlane', (it, beforeEach, afterEach) => {
  // Utility function for generating a random rectangle.
  const createRandomCoord = () => Math.floor(Math.random() * 20);
  const createRectangle = () => new GeoRectangle(createRandomCoord(), createRandomCoord(),
                                                 createRandomCoord(), createRandomCoord());

  const originalMaxEntries = GeoPlane.MAX_ENTRIES,
        originalMinEntries = GeoPlane.MIN_ENTRIES;

  // Utility method for reducing the maximum number of child nodes any node can have. Useful for
  // reference testing where we don't want to have to insert 6+ nodes every time.
  const reducePlaneLimitForTesting = (limit) => { GeoPlane.MAX_ENTRIES = limit;
                                                  GeoPlane.MIN_ENTRIES = Math.ceil(limit * 0.4); };

  // Automatically restore the limit after each test to its original value.
  afterEach(() => { GeoPlane.MAX_ENTRIES = originalMaxEntries;
                    GeoPlane.MIN_ENTRIES = originalMinEntries; });

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

  it('should choose an insertion node based on minimizing enlargement, then area', assert => {
    const plane = new GeoPlane(),
          rectangles = [];

    reducePlaneLimitForTesting(4);

    [
      [ 0, 0, 5, 5 ], [ 20, 20, 5, 5 ], [ 0, 0, 5, 10 ], [ 5, 5, 5, 5 ],
      [ 0, 0, 10, 5 ], [ 25, 20, 1, 5 ], [ 10, 0, 1, 10 ]

    ].forEach(rectangle => plane.insert(new GeoRectangle(...rectangle)));

    // Note that this is not correct yet - balancing has yet to be implemented, as well as reduction
    // of the bounding box on changes to the children.
    assert.deepEqual(plane.exportBoundingBoxTreeForTesting(), {
      boundingBox: [ 0, 0, 26, 25 ],
      height: 2,
      children: [
        { boundingBox: [ 0, 0, 26, 25 ], height: 1, children: [ [ 0, 0, 5, 5 ], [ 20, 20, 25, 25 ], [ 0, 0, 5, 10 ] ] },
        { boundingBox: [ 0, 0, 10, 10 ], height: 1, children: [ [ 5, 5, 10, 10 ], [ 0, 0, 10, 5 ] ] },
        [ 25, 20, 26, 25 ], [ 10, 0, 11, 10 ]
      ]
    });

  });

});
