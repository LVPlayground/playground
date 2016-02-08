// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Determines the distance between the two circles.
function distanceBetweenCircles(circle1, circle2) {
  const squaredCenterDistance = Math.pow(circle2.x - circle1.x, 2) + Math.pow(circle2.y - circle1.y, 2),
        distance = Math.sqrt(squaredCenterDistance) - (circle2.r + circle1.r);

  return Math.max(0, distance);
}

// Determines the distance between the circle and the rectangle.
function distanceBetweenCircleAndRectangle(circle, rectangle) {
  const rectangleCenter = rectangle.center();

  const xDiff = Math.max(0, Math.abs(circle.x - rectangleCenter[0]) - rectangle.w / 2),
        yDiff = Math.max(0, Math.abs(circle.y - rectangleCenter[1]) - rectangle.h / 2);

  return Math.max(0, Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) - circle.r);
}

// Determines the distance between the two rectangles.
function distanceBetweenRectangles(rectangle1, rectangle2) {
  if (rectanglesIntersect(rectangle1, rectangle2))
    return 0;

  const topMost = rectangle1.y < rectangle2.y ? rectangle1 : rectangle2,
        bottomMost = rectangle2.y < rectangle1.y ? rectangle1 : rectangle2,
        leftMost = rectangle1.x < rectangle2.x ? rectangle1 : rectangle2,
        rightMost = rectangle2.x < rectangle1.x ? rectangle1 : rectangle2;

  const xDiff = leftMost.x == rightMost.x ? 0 : rightMost.x - (leftMost.x + leftMost.w),
        yDiff = topMost.y == bottomMost.y ? 0 : bottomMost.y - (topMost.y + topMost.h);

  return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
}

// -------------------------------------------------------------------------------------------------

// Determines whether the circle intersects with the rectangle.
function circleIntersectsWithRectangle(circle, rectangle) {
  return rectangle.contains(circle.x, circle.y) ||
         circle.contains(rectangle.x, rectangle.y) ||
         circle.contains(rectangle.x, rectangle.y + rectangle.h) ||
         circle.contains(rectangle.x + rectangle.w, rectangle.y) ||
         circle.contains(rectangle.x + rectangle.w, rectangle.y + rectangle.h);
}

// Determines whether the two rectangles intersect.
function rectanglesIntersect(rectangle1, rectangle2) {
  return rectangle1.x < rectangle2.x + rectangle2.w &&
         rectangle1.y < rectangle2.y + rectangle2.h &&
         rectangle1.x + rectangle1.w > rectangle2.x &&
         rectangle1.y + rectangle1.h > rectangle2.y;
}

// -------------------------------------------------------------------------------------------------

// These types must be known to the utility class, but we cannot require the files directly because
// that would create a circular dependency. The types are injected during parsing time instead.
let GeoCircle = null,
    GeoRectangle = null;

// Utility calculations for operations that may be done by any object in any order. The complexity
// of these will grow quadratic with the number of supported objects.
class GeoObjectUtil {
  // Registers |type| as a geometric interface extending from GeoObject.
  static registerType(type) {
    switch (type.name) {
      case 'GeoCircle':
        GeoCircle = type;
        break;
      case 'GeoRectangle':
        GeoRectangle = type;
        break;
    }
  }

  // Calculates the distance between |obj1| and |obj2|.
  static distance(obj1, obj2) {
    if (obj1 instanceof GeoCircle) {
      if (obj2 instanceof GeoCircle)
        return distanceBetweenCircles(obj1, obj2);
      else if (obj2 instanceof GeoRectangle)
        return distanceBetweenCircleAndRectangle(obj1, obj2);
      else
        return Math.NaN;  // |obj2| is of an invalid type.
    } else if (obj1 instanceof GeoRectangle) {
      if (obj2 instanceof GeoCircle)
        return distanceBetweenCircleAndRectangle(obj2, obj1);
      else if (obj2 instanceof GeoRectangle)
        return distanceBetweenRectangles(obj1, obj2);
      else
        return Math.NaN;  // |obj2| is of an invalid type.
    } else {
      return Math.NaN;  // |obj1| is of an invalid type.
    }
  }

  // Determines whether |obj| and |obj2| intersect with each other.
  static intersects(obj1, obj2) {
    if (obj1 instanceof GeoCircle) {
      if (obj2 instanceof GeoCircle)
        return distanceBetweenCircles(obj1, obj2) == 0;
      else if (obj2 instanceof GeoRectangle)
        return circleIntersectsWithRectangle(obj1, obj2);
      else
        return false;  // |obj2| is of an invalid type.
    } else if (obj1 instanceof GeoRectangle) {
      if (obj2 instanceof GeoCircle)
        return circleIntersectsWithRectangle(obj2, obj1);
      else if (obj2 instanceof GeoRectangle)
        return rectanglesIntersect(obj1, obj2);
      else
        return false;  // |obj2| is of an invalid type.
    } else {
      return false;  // |obj1| is of an invalid type.
    }
  }
};

exports = GeoObjectUtil;
