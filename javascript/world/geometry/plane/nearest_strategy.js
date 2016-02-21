// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Strategy interface for implementing the `nearest` functionality of the GeoPlane. The
// implementation is expected to return the |count| nearest objects to the |point|.
class NearestStrategy {
  nearest(rootNode, point, count) { return null; }
};

exports = NearestStrategy;
