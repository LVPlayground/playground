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

  // Calculates the 2-dimensional magnitude of the vector per the Pythagoras theorem.
  get magnitude2D() {
    return Math.sqrt(Math.pow(this.x_, 2) + Math.pow(this.y_, 2));
  }

  // Calculates the 3-dimensional magnitude of the vector per the Pythagoras theorem.
  get magnitude3D() {
    return Math.sqrt(Math.pow(this.x_, 2) + Math.pow(this.y_, 2) + Math.pow(this.z_, 2));
  }
};

exports = Vector;
