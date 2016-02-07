// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoRectangle = require('world/geometry/geo_rectangle.js');

describe('GeoRectangle', it => {
  it('should reflect the initialized values', assert => {
    const rectangle = new GeoRectangle(10, 20, 30, 40);

    assert.equal(rectangle.x, 10);
    assert.equal(rectangle.y, 20);
    assert.equal(rectangle.w, 30);
    assert.equal(rectangle.h, 40);
  });

  it('should be able to determine its area', assert => {
    assert.equal(new GeoRectangle(10, 15, 20, 20).area(), 400);
    assert.equal(new GeoRectangle(20, 30, 20, 20).area(), 400);
    assert.equal(new GeoRectangle(10, 15, 10, 20).area(), 200);
    assert.equal(new GeoRectangle(10, 15, 10, 30).area(), 300);
  });

  it('should be able to determine its bounding box', assert => {
    assert.deepEqual(new GeoRectangle(10, 15, 20, 20).boundingBox(), [10, 15, 30, 35]);
    assert.deepEqual(new GeoRectangle(20, 15, 20, 20).boundingBox(), [20, 15, 40, 35]);
    assert.deepEqual(new GeoRectangle(10, 15, 25, 20).boundingBox(), [10, 15, 35, 35]);
    assert.deepEqual(new GeoRectangle(10, 10, 20, 5).boundingBox(), [10, 10, 30, 15]);
  });

  it('should be able to determine its center', assert => {
    assert.deepEqual(new GeoRectangle(15, 10, 20, 20).center(), [25, 20]);
    assert.deepEqual(new GeoRectangle(20, 20, 20, 20).center(), [30, 30]);
    assert.deepEqual(new GeoRectangle(10, 15, 20, 50).center(), [20, 40]);
    assert.deepEqual(new GeoRectangle(15, 10, 50, 20).center(), [40, 20]);
  });

  it('should be able to combine rectangles', assert => {
    const rectangle1 = new GeoRectangle(0, 0, 10, 10),
          rectangle2 = new GeoRectangle(0, 10, 10, 10),
          rectangle3 = new GeoRectangle(5, 5, 10, 10);

    assert.equal(rectangle1.combine(rectangle2).area(), rectangle1.area() + rectangle2.area());
    assert.equal(rectangle1.combine(rectangle3).area(), 225);
  });

  it('should be able to determine containment', assert => {
    const rectangle = new GeoRectangle(10, 15, 20, 20);

    assert.isTrue(rectangle.contains(10, 15));
    assert.isFalse(rectangle.contains(10, 35));
    assert.isFalse(rectangle.contains(30, 15));
    assert.isFalse(rectangle.contains(30, 35));
    assert.isTrue(rectangle.contains(20, 30));
    assert.isTrue(rectangle.contains(10, 30));
    assert.isFalse(rectangle.contains(9, 20));
    assert.isFalse(rectangle.contains(35, 20));
  });

  it('should be able to determine its perimeter', assert => {
    assert.equal(new GeoRectangle(10, 15, 20, 20).perimeter(), 80);
    assert.equal(new GeoRectangle(20, 30, 20, 20).perimeter(), 80);
    assert.equal(new GeoRectangle(10, 15, 10, 20).perimeter(), 60);
    assert.equal(new GeoRectangle(10, 15, 10, 30).perimeter(), 80);
  });
});
