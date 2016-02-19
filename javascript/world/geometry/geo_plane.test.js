// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoCircle = require('world/geometry/geo_circle.js'),
      GeoPlane = require('world/geometry/geo_plane.js'),
      GeoPoint = require('world/geometry/geo_point.js'),
      GeoRectangle = require('world/geometry/geo_rectangle.js');

describe('GeoPlane', (it, beforeEach, afterEach) => {
  // Reference points that can be used to verify correctness of our own implementation, as well as
  // a base set of data for comparison against other implementations.
  const referencePoints = [
    [0, 0], [10, 10], [20, 20], [25, 0], [35, 10], [45, 20], [0, 25], [10, 35], [20, 45],
    [25, 25], [35, 35], [45, 45], [50, 0], [60, 10], [70, 20], [75, 0], [85, 10], [95, 20],
    [50, 25], [60, 35], [70, 45], [75, 25], [85, 35], [95, 45], [0, 50], [10, 60], [20, 70],
    [25, 50], [35, 60], [45, 70], [0, 75], [10, 85], [20, 95], [25, 75], [35, 85], [45, 95],
    [50, 50], [60, 60], [70, 70], [75, 50], [85, 60], [95, 70], [50, 75], [60, 85], [70, 95],
    [75, 75], [85, 85], [95, 95]
  ];

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
      [0, 0, 5, 5], [20, 20, 5, 5], [0, 0, 5, 10], [5, 5, 5, 5],
      [0, 0, 10, 5], [25, 20, 1, 5], [10, 0, 1, 10]

    ].forEach(rectangle => firstPlane.insert(new GeoRectangle(...rectangle)));

    assert.deepEqual(firstPlane.exportBoundingBoxTreeForTesting(), {
      boundingBox: [0, 0, 26, 25],
      height: 2,
      children: [
        { boundingBox: [0, 0, 11, 10], height: 1, children: [ [0, 0, 5, 5], [0, 0, 5, 10], [0, 0, 10, 5], [10, 0, 11, 10] ] },
        { boundingBox: [5, 5, 26, 25], height: 1, children: [ [5, 5, 10, 10], [20, 20, 25, 25], [25, 20, 26, 25] ] },
      ]
    });

    // Classical T-shape split representing Figure 3.1 from the paper.
    const secondPlane = new GeoPlane({ maxChildren: 3, minChildren: 2 });

    [
      [0, 10, 40, 10], [30, 0, 10, 200], [50, 0, 10, 200], [50, 10, 40, 10]

    ].forEach(rectangle => secondPlane.insert(new GeoRectangle(...rectangle)));

    assert.deepEqual(secondPlane.exportBoundingBoxTreeForTesting(), {
      boundingBox: [0, 0, 90, 200],
      height: 2,
      children: [
        { boundingBox: [30, 0, 60, 200], height: 1, children: [ [30, 0, 40, 200], [50, 0, 60, 200] ] },
        { boundingBox: [0, 10, 90, 20], height: 1, children: [ [0, 10, 40, 20], [50, 10, 90, 20] ] }
      ]
    });
  });

  it('should return NULL when no results could be found', assert => {
    const plane = new GeoPlane({ maxChildren: 4 });
    referencePoints.forEach(point => plane.insert(new GeoPoint(...point)));

    assert.isNull(plane.find(new GeoRectangle(100, 100, 10, 10)));
    assert.isNull(plane.find(new GeoRectangle(-10, -10, 0, 0)));
    assert.isNull(plane.find(new GeoRectangle(51, 51, 1, 1)));
  });

  it('should be able to find points located within a rectangle', assert => {
    const plane = new GeoPlane({ maxChildren: 4 }),
          points = {};

    referencePoints.forEach(position => {
      const point = new GeoPoint(...position);

      points[point.x] = points[point.x] || {};
      points[point.x][point.y] = point;

      plane.insert(point);
    });

    assert.deepEqual(plane.find(new GeoRectangle(40, 20, 40, 50)), [
      points[70][70], points[45][70], points[60][60], points[75][25], points[70][20], points[50][25],
      points[45][20], points[75][50], points[70][45], points[60][35], points[45][45], points[50][50]
    ]);

    assert.deepEqual(plane.find(new GeoRectangle(0, 0, 10, 100)), [
      points[0][75], points[10][60], points[10][85], points[0][25], points[10][10],
      points[0][0], points[10][35], points[0][50]
    ]);

    assert.deepEqual(plane.find(new GeoRectangle(60, 60, 15, 15)), [
      points[70][70], points[75][75], points[60][60]
    ]);
  });

  it('should be able to find rectangles for a given point', assert => {
    const plane = new GeoPlane({ maxChildren: 4 }),
          rectangles = {};

    // Creates a rectangle with the given size, stores it in |points| and adds it to the |plane|.
    const createRectangle = (x, y, w, h) => {
      const rectangle = new GeoRectangle(x, y, w, h);

      rectangles[rectangle.x] = rectangles[rectangle.x] || {};
      rectangles[rectangle.x][rectangle.y] = rectangle;

      plane.insert(rectangle);
    };

    for (let x = 0; x < 100; x += 10) {
      for (let y = 0; y < 100; y += 10)
        createRectangle(x, y, 10, 10);
    }

    for (let x = 1; x < 100; x += 15) {
      for (let y = 1; y < 100; y += 15)
        createRectangle(x, y, 15, 15);
    }

    for (let x = 2; x < 100; x += 20) {
      for (let y = 2; y < 100; y += 20)
        createRectangle(x, y, 20, 20);
    }

    // Utility function to sort an array of rectangles.
    const sortRectangles = rectangles => {
      return rectangles.sort((lhs, rhs) => {
        if (lhs.x == rhs.x) return lhs.y < rhs.y ? -1 : 1;
        return lhs.x < rhs.x ? -1 : 1;
      });
    }

    // Test with a hundred random points, that also do a linear search over the registered |points|
    // in order to figure out whether they're on the plane or not.
    for (let attempt = 0; attempt < 100; ++attempt) {
      const point = new GeoPoint(Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)),
            actual = plane.find(point),
            expected = [];

      for (let x in rectangles) {
        for (let y in rectangles[x]) {
          const boundingBox = rectangles[x][y].boundingBox();

          if (point.x < boundingBox[0] || point.y < boundingBox[1] ||
              point.x > boundingBox[2] || point.y > boundingBox[3])
            continue;

          expected.push(rectangles[x][y]);
        }
      }

      // Sort both the |expected| array and the results of |plane.find()| to make sure that the
      // deepEqual comparison is done on arrays of equal order.
      assert.deepEqual(sortRectangles(actual), sortRectangles(expected));
    }

  });

  it('should be able to perform rectangles-for-point operations quickly', assert => {
    // This test acts as a performance test to measure how long insertion operations take for large
    // numbers of rectangles, as well as find operations for finding intersecting rectangles for a
    // given point. Note that finding rectangles for rectangles would be equally fast.
    const MAP_BOUNDARIES = [ -3000, -3000, 3000, 3000 ],
          FIND_ITERATIONS = 1000;

    let plane = new GeoPlane(),
        counter = 0;

    // Inserts a series of rectangles in |plane| of size [|width|, |height|].
    const insertRectangles = (width, height) => {
      for (let x = MAP_BOUNDARIES[0]; x < MAP_BOUNDARIES[2]; x += width) {
        for (let y = MAP_BOUNDARIES[1]; y < MAP_BOUNDARIES[3]; y += height) {
          plane.insert(new GeoRectangle(x, y, width, height));
          counter++;
        }
      }
    };

    const insertionStart = highResolutionTime();

    insertRectangles(1000, 1000);  //   36
    insertRectangles( 600,  600);  //  100
    insertRectangles( 300,  300);  //  400
    insertRectangles( 100,  100);  // 3600

    const insertionEnd = highResolutionTime();
    const findStart = highResolutionTime();

    for (let iteration = 0; iteration < FIND_ITERATIONS; ++iteration) {
      const x = Math.random() * MAP_BOUNDARIES[2] + MAP_BOUNDARIES[0];
      const y = Math.random() * MAP_BOUNDARIES[3] + MAP_BOUNDARIES[1];

      const point = new GeoPoint(x, y);

      assert.equal(plane.find(point).length, 4);
    }

    const findEnd = highResolutionTime();

    const insertionTotal = Math.round((insertionEnd - insertionStart) * 100) / 100,
          findTotal = Math.round((findEnd - findStart) * 100) / 100;

    console.log('[GeoPlane] Inserted ' + counter + ' nodes in ' + insertionTotal + 'ms, ' +
        'found nodes for ' + FIND_ITERATIONS + ' points in ' + findTotal + 'ms.');
  });

});
