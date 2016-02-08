// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoCircle = require('world/geometry/geo_circle.js'),
      GeoObjectUtil = require('world/geometry/geo_object_util.js'),
      GeoRectangle = require('world/geometry/geo_rectangle.js');

describe('GeoObjectUtil', it => {
  const circle1 = new GeoCircle(10, 10, 10),  // [0, 0, 20, 20]
        circle2 = new GeoCircle(35, 35, 10),  // [25, 25, 45, 45]
        circle3 = new GeoCircle(25, 25, 15);  // [10, 10, 40, 40]

  const rectangle1 = new GeoRectangle(10, 10, 15, 20),  // [10, 10, 25, 30]
        rectangle2 = new GeoRectangle(25, 25, 10, 10),  // [25, 25, 35, 35]
        rectangle3 = new GeoRectangle(20, 20, 20, 15);  // [20, 20, 40, 35]

  it('should be able to determine distances between objects', assert => {
    // Distance between cirlces.
    assert.closeTo(circle1.distance(circle2), 15.36, 0.1);
    assert.closeTo(circle2.distance(circle1), 15.36, 0.1);
    assert.equal(circle1.distance(circle3), 0);
    assert.equal(circle3.distance(circle1), 0);

    // Distance between a circle and a rectangle.
    assert.equal(circle1.distance(rectangle1), 0);
    assert.closeTo(circle1.distance(rectangle2), 11.21, 0.1);
    assert.closeTo(rectangle2.distance(circle1), 11.21, 0.1);
    assert.equal(circle3.distance(rectangle3), 0);

    // Distance between rectangles.
    assert.equal(rectangle1.distance(rectangle2), 5);
    assert.equal(rectangle2.distance(rectangle1), 5);
    assert.equal(rectangle1.distance(rectangle3), 0);
  });

  it('should be able to determine whether objects intersect', assert => {
    // Intersection between circles.
    assert.isFalse(circle1.intersects(circle2));
    assert.isFalse(circle2.intersects(circle1));
    assert.isTrue(circle1.intersects(circle3));
    assert.isTrue(circle3.intersects(circle2));

    // Intersection between a circle and a rectangle.
    assert.isTrue(circle1.intersects(rectangle1));
    assert.isTrue(rectangle1.intersects(circle1));
    assert.isFalse(rectangle2.intersects(circle1));
    assert.isTrue(circle3.intersects(rectangle3));

    // Intersection between rectangles.
    assert.isFalse(rectangle1.intersects(rectangle2));
    assert.isFalse(rectangle2.intersects(rectangle1));
    assert.isTrue(rectangle1.intersects(rectangle3));
    assert.isTrue(rectangle3.intersects(rectangle2));
  });
});
