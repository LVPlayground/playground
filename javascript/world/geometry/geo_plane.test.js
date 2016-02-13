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

  it('should adjust the bounding box on object modification', assert => {
    const plane = new GeoPlane();

    plane.insert(new GeoRectangle(10, 15, 10, 10));
    assert.deepEqual(plane.boundingBox, [10, 15, 20, 25]);

    plane.insert(new GeoCircle(10, 10, 5));
    assert.deepEqual(plane.boundingBox, [5, 5, 20, 25]);
  });

  it('should store appropriate maximum and minimum number of children', assert => {
    const defaultPlane = new GeoPlane();
    assert.equal(defaultPlane.maxChildren, 6);
    assert.equal(defaultPlane.minChildren, 3);

    const customMaximumPlane = new GeoPlane({ maxChildren: 100 });
    assert.equal(customMaximumPlane.maxChildren, 100);
    assert.equal(customMaximumPlane.minChildren, 40);

    const customPlane = new GeoPlane({ maxChildren: 10, minChildren: 2 });
    assert.equal(customPlane.maxChildren, 10);
    assert.equal(customPlane.minChildren, 2);
  });

  it('should split the tree when reaching the maximum number of children in a node', assert => {
    const plane = new GeoPlane();
    for (let i = 0; i < plane.maxChildren + 1; ++i)
      plane.insert(createRectangle());

    assert.equal(plane.height, 2);
  });

  it('should choose an insertion node based on minimizing enlargement, then area', assert => {
    const firstPlane = new GeoPlane({ maxChildren: 4 });

    [
      [ 0, 0, 5, 5 ], [ 20, 20, 5, 5 ], [ 0, 0, 5, 10 ], [ 5, 5, 5, 5 ],
      [ 0, 0, 10, 5 ], [ 25, 20, 1, 5 ], [ 10, 0, 1, 10 ]

    ].forEach(rectangle => firstPlane.insert(new GeoRectangle(...rectangle)));

    // Note that this is not correct yet - balancing has yet to be implemented, as well as reduction
    // of the bounding box on changes to the children.
    assert.deepEqual(firstPlane.exportBoundingBoxTreeForTesting(), {
      boundingBox: [ 0, 0, 26, 25 ],
      height: 2,
      children: [
        { boundingBox: [ 0, 0, 25, 25 ], height: 1, children: [ [ 0, 0, 5, 5 ], [ 20, 20, 25, 25 ], [ 0, 0, 5, 10 ] ] },
        { boundingBox: [ 0, 0, 10, 10 ], height: 1, children: [ [ 5, 5, 10, 10 ], [ 0, 0, 10, 5 ] ] },
        { boundingBox: [ 10, 0, 26, 25 ], height: 1, children: [ [ 25, 20, 26, 25 ], [ 10, 0, 11, 10 ] ] }
      ]
    });

    // Classical T-shape split representing Figure 3.1 from the paper.
    const secondPlane = new GeoPlane({ maxChildren: 3 });

    [
      [ 30, 0, 10, 200 ], [ 50, 0, 10, 200 ], [ 0, 10, 40, 10 ], [ 50, 10, 40, 10 ]

    ].forEach(rectangle => secondPlane.insert(new GeoRectangle(...rectangle)));

    assert.deepEqual(secondPlane.exportBoundingBoxTreeForTesting(), {
      boundingBox: [ 0, 0, 90, 200 ],
      height: 2,
      children: [
        { boundingBox: [ 30, 0, 60, 200 ], height: 1, children: [ [ 30, 0, 40, 200 ], [ 50, 0, 60, 200 ] ] },
        { boundingBox: [ 0, 10, 90, 20 ], height: 1, children: [ [ 0, 10, 40, 20 ], [ 50, 10, 90, 20 ] ] }
      ]
    });

  });

});
