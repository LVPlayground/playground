// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoObject = require('world/geometry/geo_object.js'),
      GeoObjectUtil = require('world/geometry/geo_object_util.js');

// Class representing a rectangle that can be used in a 2D space. It has origin coordinates and a
// defined width and height, which are immutable for the lifetime of the object.
class GeoRectangle extends GeoObject {
  constructor(x, y, w, h) {
    super();

    this.x_ = x;
    this.y_ = y;
    this.w_ = w;
    this.h_ = h;
  }

  get x() { return this.x_; }
  get y() { return this.y_; }
  get w() { return this.w_; }
  get h() { return this.h_; }

  area() {
    return this.w_ * this.h_;
  }

  boundingBox() {
    return [ this.x_, this.y_, this.x_ + this.w_, this.y_ + this.h_ ];
  }

  center() {
    return [ this.x_ + this.w_ / 2, this.y_ + this.h_ / 2 ];
  }

  // Combines this rectangle with |rectangle| and returns a new rectangle.
  combine(rectangle) {
    const x = Math.min(this.x_, rectangle.x),
          y = Math.min(this.y_, rectangle.y);

    return new GeoRectangle(x, y,
                            Math.max(this.x_ + this.w_, rectangle.x + rectangle.w) - x,
                            Math.max(this.y_ + this.h_, rectangle.y + rectangle.h) - y);
  }

  contains(x, y) {
    return x >= this.x_ && x < this.x_ + this.w_ &&
           y >= this.y_ && y < this.y_ + this.h_;
  }

  distance(obj) {
    return GeoObjectUtil.distance(obj, this);
  }

  intersects(obj) {
    return GeoObjectUtil.intersects(obj, this);
  }

  perimeter() {
    return this.w_ * 2 + this.h_ * 2;
  }
};

// Register the GeoRectangle type with the utility class.
GeoObjectUtil.registerType(GeoRectangle);

exports = GeoRectangle;
