// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoRectangle = require('world/geometry/geo_rectangle.js');

// A geometric point effectively is a rectangle at a single point, having no explicit width and
// height and thus represented solely with its X and Y coordinates.
class GeoPoint extends GeoRectangle {
  constructor(x, y) {
    super(x, y, 0, 0);
  }

  get w() { return undefined; }
  get h() { return undefined; }

  area() {
    return 0;
  }

  // Inherits boundingBox().

  center() {
    return [ this.x_, this.y_ ];
  }

  contains(x, y) {
    return this.x_ == x && this.y_ == y;
  }

  // Inherits distance(obj).

  // Inherits intersects(obj).

  perimeter() {
    return 0;
  }
};

exports = GeoPoint;
