// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoPoint = require('world/geometry/geo_point.js');

// Represents a point on the LandValuePlane with an associated value. The type of unit of the value
// is opaqua for the purposes of this class, it merely stores the value.
class LandValuePoint extends GeoPoint {
  constructor(x, y, value) {
    super(x, y);

    this.value_ = value;
  }

  // Returns the value of this point on the land value plane.
  get value() { return this.value_; }
};

exports = LandValuePoint;
