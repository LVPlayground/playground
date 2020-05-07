// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

export class Vector {
    constructor(x, y, z) {
        this.x_ = x || 0.0;
        this.y_ = y || 0.0;
        this.z_ = z || 0.0;
    }

    get x() { return this.x_; }
    get y() { return this.y_; }
    get z() { return this.z_; }

    // Returns whether this vector is close to the other |vector|, with a given |maxDistance|.
    closeTo(vector, maxDistance = 1) {
        return this.squaredDistanceTo(vector) <= (maxDistance * maxDistance);
    }

    // Computes the distance from this vector to |vector| in a 2D space.
    distanceTo2D(vector) {
        const diffX = Math.abs(this.x_ - vector.x);
        const diffY = Math.abs(this.y_ - vector.y);

        return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    }

    // Computes the distance to this vector from |vector| in a 2D space. Returns the squared result.
    squaredDistanceTo2D(vector) {
        const diffX = Math.abs(this.x_ - vector.x);
        const diffY = Math.abs(this.y_ - vector.y);

        return Math.pow(diffX, 2) + Math.pow(diffY, 2);
    }

    // Computes the distance from this vector to |vector| in a 3D space.
    distanceTo(vector) {
        const diffX = Math.abs(this.x_ - vector.x);
        const diffY = Math.abs(this.y_ - vector.y);
        const diffZ = Math.abs(this.z_ - vector.z);

        return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2) + Math.pow(diffZ, 2));
    }

    // Computes the distance to this vector from |vector| in a 3D space. Returns the squared result.
    squaredDistanceTo(vector) {
        const diffX = Math.abs(this.x_ - vector.x);
        const diffY = Math.abs(this.y_ - vector.y);
        const diffZ = Math.abs(this.z_ - vector.z);

        return Math.pow(diffX, 2) + Math.pow(diffY, 2) + Math.pow(diffZ, 2);
    }

    // TODO(Russell): translateTo for a 3D space, having a vector of angles.

    // Computes the position that's |distance| units away from this vector at |angle|, and returns
    // the new vector containing the target direction. The |angle| must be given in degrees.
    translateTo2D(distance, angle) {
        const angleRadians = angle * (Math.PI / 180);

        return new Vector(this.x_ + distance * Math.sin(-angleRadians),
                          this.y_ + distance * Math.cos(-angleRadians),
                          this.z_);
    }

    // Returns a new vector with this vector's location translated by |x|, |y| and |z|.
    translate({ x = 0, y = 0, z = 0 } = {}) {
        return new Vector(this.x_ + x, this.y_ + y, this.z_ + z);
    }

    // Calculates the 2-dimensional magnitude of the vector per the Pythagoras theorem.
    get magnitude2D() {
        return Math.sqrt(Math.pow(this.x_, 2) + Math.pow(this.y_, 2));
    }

    // Calculates the 3-dimensional magnitude of the vector per the Pythagoras theorem.
    get magnitude() {
        return Math.sqrt(Math.pow(this.x_, 2) + Math.pow(this.y_, 2) + Math.pow(this.z_, 2));
    }

    // Returns a new vector with the X/Y coordinates normalized over the 2-dimensional magnitude.
    // The Z-coordinate of the vector will always be set to zero.
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

global.Vector = Vector;
