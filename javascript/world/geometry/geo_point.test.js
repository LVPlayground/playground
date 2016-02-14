// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoPoint = require('world/geometry/geo_point.js');

describe('GeoPoint', it => {
  it('should reflect the initialized values', assert => {
    const point = new GeoPoint(10, 20);

    assert.equal(point.x, 10);
    assert.equal(point.y, 20);
    assert.equal(point.w, undefined);
    assert.equal(point.h, undefined);
  });

  it('should never have an area', assert => {
    assert.equal(new GeoPoint(10, 10).area(), 0);
    assert.equal(new GeoPoint(20, 20).area(), 0);
  });

  it('should always have a defined bounding box', assert => {
    assert.deepEqual(new GeoPoint(10, 10).boundingBox(), [10, 10, 10, 10]);
    assert.deepEqual(new GeoPoint(-10, -10).boundingBox(), [-10, -10, -10, -10]);
    assert.deepEqual(new GeoPoint(15, -10).boundingBox(), [15, -10, 15, -10]);
  });

  it('should be able to reflect its center', assert => {
    assert.deepEqual(new GeoPoint(10, 15).center(), [10, 15]);
    assert.deepEqual(new GeoPoint(10, 15).center(), [10, 15]);
    assert.deepEqual(new GeoPoint(5, 20).center(), [5, 20]);
    assert.deepEqual(new GeoPoint(10, 10).center(), [10, 10]);
  });

  it('should be able to determine containment', assert => {
    const point = new GeoPoint(10, 5);

    assert.isTrue(point.contains(10, 5));
    assert.isFalse(point.contains(9.999, 4.999));
    assert.isFalse(point.contains(10.001, 5.001));
    assert.isFalse(point.contains(11, 5));
    assert.isFalse(point.contains(10, 4));
    assert.isFalse(point.contains(100, 100));
  });

  it('should never have a perimeter', assert => {
    assert.equal(new GeoPoint(10, 10).perimeter(), 0);
    assert.equal(new GeoPoint(20, 20).perimeter(), 0);
  });
});
