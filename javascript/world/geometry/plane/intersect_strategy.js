// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Strategy interface for implementing the `intersect` functionality of the GeoPlane. The
// implementation is expected to return all nodes that intersect with the |boundingBox|.
class IntersectStrategy {
  intersect(rootNode, boundingBox) { return null; }
};

exports = IntersectStrategy;
