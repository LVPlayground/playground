// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoObject = require('world/geometry/geo_object.js'),
      GeoPlaneNode = require('world/geometry/geo_plane_node.js');

// Maximum and minimum number of entries in a single node. The minimum has been set to just over 40%
// of the maximum, as that load ratio offers the best performance for an R-tree.
const MAX_ENTRIES = 6;
const MIN_ENTRIES = 3;

// The GeoPlane class expresses a 2D plane on which geometric objects can efficiently be represented
// and queried. It is implemented as an optimized R-tree that accepts any object of geometric nature
// to allow for additional complexity and ease-of-use.
//
// https://en.wikipedia.org/wiki/R-tree
//
// TODO: Explain more about the implementation as I make it up along the way.
// TODO: Enable the tree to rebalance itself when >MAX_ENTRIES entries.
// TODO: Enable objects to be removed from the tree.
class GeoPlane {
  constructor() {
    this.root_ = new GeoPlaneNode(null /* value */);
  }

  // Gets the bounding box encapsulating all objects in the plane.
  get boundingBox() { return this.root_.boundingBox; }

  // Inserts |obj| on the plane. The |obj| must be an instance of one of the geometric objects that
  // derive from the GeoObject base class, as availability of that interface will be assumed. The
  // insertion can cause the tree to rebalance itself.
  insert(obj) {
    // TODO: Find the best node once this actually is a tree.
    this.root_.addChild(obj);
  }

};

exports = GeoPlane;
