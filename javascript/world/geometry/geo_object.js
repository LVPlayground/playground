// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Interface for the different kinds of objects that can be represented in a 2D space. These methods
// are guaranteed to be available and implemented on all geometric objects.
class GeoObject {
  // Returns the area of this object.
  area() {}

  // Returns the bounding box of [x1, y1, x2, y2] of this object.
  boundingBox() {}

  // Returns the center [x, y] of this object.
  center() {}

  // Returns whether the point at [x, y] is contained within this object.
  contains(x, y) {}

  // Returns the distance between this object and |obj|.
  distance(obj) {}

  // Returns whether this object and |obj| intersect.
  intersects(obj) {}

  // Returns the perimeter (or circumference) of this object.
  perimeter() {}
};

exports = GeoObject;
