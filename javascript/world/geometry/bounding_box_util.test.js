// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const BoundingBoxUtil = require('world/geometry/bounding_box_util.js');

describe('BoundingBoxUtil', it => {
  it('should be able to compute the total area', assert => {
    // Single bounding box.
    assert.equal(BoundingBoxUtil.computeArea([0, 0, 10, 10]), 100);
    assert.equal(BoundingBoxUtil.computeArea([10, 10, 20, 20]), 100);
    assert.equal(BoundingBoxUtil.computeArea([0, 10, 15, 15]), 75);

    // Multiple bounding boxes.
    assert.equal(BoundingBoxUtil.computeArea([0, 0, 10, 10], [0, 0, 15, 10]), 150);
    assert.equal(BoundingBoxUtil.computeArea([0, 0, 10, 10], [10, 10, 20, 20]), 400);
    assert.equal(BoundingBoxUtil.computeArea([10, 10, 15, 15], [15, 10, 20, 15]), 50);
  });
});
