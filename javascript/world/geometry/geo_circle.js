// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoObject = require('world/geometry/geo_object.js'),
      GeoObjectUtil = require('world/geometry/geo_object_util.js');

// Class representing a circle that can be used in a 2D space. It has [x, y] origin coordinates and
// a defined radius, from which the bounding box can be derived.
class GeoCircle extends GeoObject {
  constructor(x, y, r) {
    super();

    this.x_ = x;
    this.y_ = y;
    this.r_ = r;
  }

  get x() { return this.x_; }
  get y() { return this.y_; }
  get r() { return this.r_; }

  area() {
    return Math.PI * Math.pow(this.r_, 2);
  }

  boundingBox() {
    return [ this.x_ - this.r_, this.y_ - this.r_, this.x_ + this.r_, this.y_ + this.r_ ];
  }

  center() {
    return [ this.x_, this.y_ ];
  }

  contains(x, y) {
    return Math.pow(x - this.x_, 2) + Math.pow(y - this.y_, 2) < Math.pow(this.r_, 2);
  }

  distance(obj) {
    return GeoObjectUtil.distance(obj, this);
  }

  intersects(obj) {
    return GeoObjectUtil.intersects(obj, this);
  }

  perimeter() {
    return 2 * Math.PI * this.r_;
  }
};

// Register the GeoCircle type with the utility class.
GeoObjectUtil.registerType(GeoCircle);

exports = GeoCircle;
