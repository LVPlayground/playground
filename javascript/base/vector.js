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
  get magnitude() {
    return Math.sqrt(Math.pow(this.x_, 2) + Math.pow(this.y_, 2) + Math.pow(this.z_, 2));
  }

  // Returns a new vector with the X/Y coordinates normalized over the 2-dimensional magnitude. The
  // Z coordinate of the vector will always be set to zero.
  get normalized2D() {
    let magnitude = this.magnitude2D;
    if (magnitude === 0)
      return new Vector(0, 0, 0);

    return new Vector(this.x_ / magnitude, this.y_ / magnitude, 0);
  }

  // Returns a new vector with all coordinates normalized over the 3-dimensional magnitude.
  get normalized() {
    let magnitude = this.magnitude;
    if (magnitude === 0)
      return new Vector(0, 0, 0);

    return new Vector(this.x_ / magnitude, this.y_ / magnitude, this.z_ / magnitude);
  }
};

exports = Vector;
