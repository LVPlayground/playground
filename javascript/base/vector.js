// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

class Vector {
  constructor(x, y, z) {
    this.x_ = x || 0.0;
    this.y_ = y || 0.0;
    this.z_ = z || 0.0;
  }

  get x() { return this.x_; }
  get y() { return this.y_; }
  get z() { return this.z_; }
};

exports = Vector;
