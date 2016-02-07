// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoCircle = require('world/geometry/geo_circle.js');

describe('GeoCircle', it => {
  it('should reflect the initialized values', assert => {
    const circle = new GeoCircle(10, 20, 30);

    assert.equal(circle.x, 10);
    assert.equal(circle.y, 20);
    assert.equal(circle.r, 30);
  });

  it('should be able to determine its area', assert => {
    assert.closeTo(new GeoCircle(10, 10, 5).area(), 78.54, 0.1);
    assert.closeTo(new GeoCircle(20, 20, 5).area(), 78.54, 0.1);
    assert.closeTo(new GeoCircle(10, 10, 10).area(), 314.16, 0.1);
    assert.closeTo(new GeoCircle(10, 10, 20).area(), 1256.64, 0.1);
  });

  it('should be able to determine its bounding box', assert => {
    assert.deepEqual(new GeoCircle(10, 10, 5).boundingBox(), [5, 5, 15, 15]);
    assert.deepEqual(new GeoCircle(10, 15, 5).boundingBox(), [5, 10, 15, 20]);
    assert.deepEqual(new GeoCircle(15, 10, 5).boundingBox(), [10, 5, 20, 15]);
    assert.deepEqual(new GeoCircle(10, 10, 10).boundingBox(), [0, 0, 20, 20]);
  });

  it('should be able to determine its center', assert => {
    assert.deepEqual(new GeoCircle(10, 15, 20).center(), [10, 15]);
    assert.deepEqual(new GeoCircle(10, 15, 50).center(), [10, 15]);
    assert.deepEqual(new GeoCircle(5, 20, 20).center(), [5, 20]);
    assert.deepEqual(new GeoCircle(10, 10, 20).center(), [10, 10]);
  });

  it('should be able to determine containment', assert => {
    const circle = new GeoCircle(10, 5, 5);

    assert.isFalse(circle.contains(5, 0));
    assert.isFalse(circle.contains(5, 5));
    assert.isTrue(circle.contains(6, 5));
    assert.isFalse(circle.contains(5, 10));
    assert.isFalse(circle.contains(10, 0));
    assert.isTrue(circle.contains(10, 1));
    assert.isFalse(circle.contains(15, 0));
    assert.isFalse(circle.contains(15, 10));
  });

  it('should be able to determine its perimeter', assert => {
    assert.closeTo(new GeoCircle(10, 15, 20).perimeter(), 125.66, 0.1);
    assert.closeTo(new GeoCircle(20, 30, 20).perimeter(), 125.66, 0.1);
    assert.closeTo(new GeoCircle(10, 15, 10).perimeter(), 62.83, 0.1);
    assert.closeTo(new GeoCircle(10, 15, 30).perimeter(), 188.5, 0.1);
  });
});
