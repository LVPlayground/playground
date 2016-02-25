// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Class that provides utility methods for working with bounding boxes. Each bounding box is
// expected to be an array with four entries: [x1, y1, x2, y2]. This class may not be instantiated.
class BoundingBoxUtil {
  constructor() { throw TypeError('This class must not be instantiated.'); }

  // Combines the |boundingBoxes| to create a new bounding box that encapsulates the total area.
  static combine(...boundingBoxes) {
    let combinedBoundingBox = [ Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
                                Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ];

    boundingBoxes.forEach(boundingBox => {
      combinedBoundingBox[0] = Math.min(combinedBoundingBox[0], boundingBox[0]);
      combinedBoundingBox[1] = Math.min(combinedBoundingBox[1], boundingBox[1]);

      combinedBoundingBox[2] = Math.max(combinedBoundingBox[2], boundingBox[2]);
      combinedBoundingBox[3] = Math.max(combinedBoundingBox[3], boundingBox[3]);
    });

    return combinedBoundingBox;
  }

  // Computes the area of the |boundingBoxes|. If multiple arguments are passed, the total area of
  // the passed bounding boxes will be computed.
  static computeArea(...boundingBoxes) {
    const combinedBoundingBox = BoundingBoxUtil.combine(...boundingBoxes);
    return (combinedBoundingBox[2] - combinedBoundingBox[0]) *
               (combinedBoundingBox[3] - combinedBoundingBox[1]);
  }

};

exports = BoundingBoxUtil;
