// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoRectangle = require('world/geometry/geo_rectangle.js');

// Represents an area that has a given residential value. Initialized using a bounding box rather
// than the more common [x, y, w, h] constructor of the GeoRectangle.
class ResidentialValueArea extends GeoRectangle {
  constructor(boundingBox, value) {
    super(boundingBox[0], boundingBox[1], boundingBox[2] - boundingBox[0],
          boundingBox[3] - boundingBox[1]);

    this.value_ = value;
  }

  // Returns the value of this area on the residential value plane.
  get value() { return this.value_; }
};

exports = ResidentialValueArea;
