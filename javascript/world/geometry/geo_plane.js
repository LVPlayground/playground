// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoObject = require('world/geometry/geo_object.js'),
      GeoPlaneNode = require('world/geometry/geo_plane_node.js');

// Computes the combined bounding box of the |boundingBox|es and returns the total area.
function extendedBoundingBoxArea(...boundingBoxes) {
  let combinedBoundingBox = [ Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
                              Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ];

  boundingBoxes.forEach(boundingBox => {
    combinedBoundingBox[0] = Math.min(combinedBoundingBox[0], boundingBox[0]);
    combinedBoundingBox[1] = Math.min(combinedBoundingBox[1], boundingBox[1]);

    combinedBoundingBox[2] = Math.max(combinedBoundingBox[2], boundingBox[2]);
    combinedBoundingBox[3] = Math.max(combinedBoundingBox[3], boundingBox[3]);
  });

  return (combinedBoundingBox[2] - combinedBoundingBox[0]) *
             (combinedBoundingBox[3] - combinedBoundingBox[1]);
}

// The GeoPlane class expresses a 2D plane on which geometric objects can efficiently be represented
// and queried. It is implemented as an optimized R-tree that accepts any object of geometric nature
// to allow for additional complexity and ease-of-use.
//
// http://www-db.deis.unibo.it/courses/SI-LS/papers/Gut84.pdf
// https://en.wikipedia.org/wiki/R-tree
//
// TODO: Enable objects to be removed from the tree.
class GeoPlane {
  constructor() {
    this.root_ = new GeoPlaneNode(null /* value */);
  }

  // Gets the bounding box encapsulating all objects in the plane.
  get boundingBox() { return this.root_.boundingBox; }

  // Gets the current height of the internal R-tree.
  get height() { return this.root_.height; }

  // Inserts |obj| on the plane. The |obj| must be an instance of one of the geometric objects that
  // derive from the GeoObject base class, as availability of that interface will be assumed. The
  // insertion can cause the tree to rebalance itself.
  //
  // This method implements the Insert and AdjustTree algorithms from the paper, and calls through
  // to the SplitNode algorithm in case of overflows in the insertion path.
  insert(obj) {
    const insertionPath = [];
    const parentNode = this.determineInsertionPath(obj.boundingBox(), insertionPath);
    const newNode = parentNode.addChild(obj);

    let level = this.root_.height - 1;

    // Determine if the insertion node has to be split. If it has to, chances are that further nodes
    // down the tree have to be split as well, as the modification could cause them to overflow.
    for (; level >= 0; --level) {
      const node = insertionPath[level];
      if (node.children.length <= GeoPlane.MAX_ENTRIES)
        break;

      const splitNode = this.splitNode(node);

      // Split the root to accomodate |splitNode| if |node| has no parent. Otherwise, add to parent.
      if (!level) {
        this.root_ = new GeoPlaneNode(null /* value */, [ node, splitNode ], node.height + 1);
        continue;
      }

      insertionPath[level - 1].addChild(splitNode);
    }

    // Extend the boundary boxes of all nodes upwards of |level| with that of |newNode|.
    for (; level >= 0; --level)
      insertionPath[level].extendBoundingBox(newNode);
  }

  // Determines the ideal insertion path for an object having |boundingBox| in the tree. Nodes will
  // be preferred based on minimizing their area enlargement, then on having the smallest area.
  //
  // This is an implementation of the ChooseLeaf algorithm in the paper.
  determineInsertionPath(boundingBox, insertionPath) {
    let node = this.root_;

    while (true) {
      insertionPath.push(node);
      if (node.isLeaf || insertionPath.length == this.height)
        break;

      let minimumEnlargement = Number.POSITIVE_INFINITY,
          minimumArea = Number.POSITIVE_INFINITY,
          target = null;

      node.children.forEach(child => {
        const area = child.boundingBoxArea(),
              enlargement = extendedBoundingBoxArea(boundingBox, child.boundingBox) - area;

        if (enlargement < minimumEnlargement) {
          minimumEnlargement = enlargement;
          minimumArea = Math.min(minimumArea, area);
          target = child;
        }

        else if (enlargement === minimumEnlargement && area < minimumArea) {
          minimumArea = area;
          target = child;
        }
      });

      node = target;
    }

    return node;
  }

  // Splits |node| in two new nodes.
  //
  // TODO: Actually implement the SplitNode algorithm.
  //
  // This method implements the SplitNode algorithm from the paper. The linear cost algorithm
  // LinearPickSeeds has been used for splitting, since we care more about insertion performance
  // than about raw lookup time performance. (Which can be optimized by using several trees.)
  splitNode(node) {
    // TODO: Sort the children in |node| by the X-coordinate if the margin on that axis is larger.
    // TODO: Choose the index to split at. The R-tree structure prefers distribution with minimum
    //       overlap, then distribution with minimum area.
    const splitIndex = Math.ceil(node.children.length / 2);

    return new GeoPlaneNode(null /* value */, node.splitAt(splitIndex), node.height);
  }

  // Exports the current tree as a bounding box tree for the purposes of testing. Leaf nodes will
  // only be identified by their bounding box, internal nodes by their bounding box and children.
  exportBoundingBoxTreeForTesting(node) {
    node = node || this.root_;
    if (node.isLeaf)
      return node.boundingBox;

    let entry = { boundingBox: node.boundingBox, height: node.height, children: [] };
    node.children.forEach(child =>
        entry.children.push(this.exportBoundingBoxTreeForTesting(child)));

    return entry;
  }

};

// Maximum and minimum number of entries in a single node. The minimum has been set to just over 40%
// of the maximum, as that load ratio offers the best performance for an R-tree.
GeoPlane.MAX_ENTRIES = 6;
GeoPlane.MIN_ENTRIES = 3;

exports = GeoPlane;
