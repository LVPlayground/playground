// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoCircle = require('world/geometry/geo_circle.js');

// Floating point comparisons must allow for a margin of error, since not every number can be
// expressed in the 53 bit accuracy given to JavaScript numbers.
const CONTAINS_EPSILON = 0.01;

// A geometric point effectively is a circle with a diameter of one unit, represented solely with
// its X and Y coordinates on a 2D plane. Some methods have been overridden for simplification.
class GeoPoint extends GeoCircle {
  constructor(x, y) {
    super(x, y, 0.5);
  }

  get r() { return undefined; }

  area() {
    return 1;
  }

  boundingBox() {
    return [ Math.round(this.x_ - 0.5), Math.round(this.y_ - 0.5),
             Math.round(this.x_ + 0.5), Math.round(this.y_ + 0.5) ];
  }

  // Inherits center().

  contains(x, y) {
    return Math.abs(this.x_ - x) < CONTAINS_EPSILON &&
           Math.abs(this.y_ - y) < CONTAINS_EPSILON;
  }

  // Inherits distance(obj).

  // Inherits intersects(obj).

  perimeter() {
    return 1;
  }
};

exports = GeoPoint;
