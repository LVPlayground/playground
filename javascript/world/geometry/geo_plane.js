// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const BoundingBoxUtil = require('world/geometry/bounding_box_util.js'),
      GeoObject = require('world/geometry/geo_object.js'),
      GeoPlaneNode = require('world/geometry/geo_plane_node.js');

// Default maximum number of children that a single node may contain. The minimum will, by default,
// be set to ~40% of this number, as that load ratio offers the best performance for an R-tree.
const DEFAULT_MAX_CHILDREN = 6;

// The GeoPlane class expresses a 2D plane on which geometric objects can efficiently be represented
// and queried. It is implemented as an optimized R-tree that accepts any object of geometric nature
// to allow for additional complexity and ease-of-use.
//
// https://sa-mp.nl/tools/visualize-rtree/
// http://www-db.deis.unibo.it/courses/SI-LS/papers/Gut84.pdf
// https://en.wikipedia.org/wiki/R-tree
//
// TODO: Enable objects to be removed from the tree.
class GeoPlane {
  constructor({ maxChildren = DEFAULT_MAX_CHILDREN, minChildren = Math.ceil(0.4 * maxChildren) } = {}) {
    this.root_ = new GeoPlaneNode(null /* value */);
    this.maxChildren_ = maxChildren;
    this.minChildren_ = minChildren;
  }

  // Gets the bounding box encapsulating all objects in the plane.
  get boundingBox() { return this.root_.boundingBox; }

  // Gets the current height of the internal R-tree.
  get height() { return this.root_.height; }

  // Gets the maximum and minimum number of children a node in this tree may host.
  get maxChildren() { return this.maxChildren_; }
  get minChildren() { return this.minChildren_; }

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
      if (node.children.length <= this.maxChildren_)
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
              enlargement = BoundingBoxUtil.computeArea(boundingBox, child.boundingBox) - area;

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

  // Splits |node| in two new nodes. This is a naive splitting algorithm in which nodes will be
  // sorted on the axis whose sum of the semi perimeters of potential splitting points is lowest.
  //
  // TODO: Actually implement the rest of the SplitNode algorithm.
  splitNode(node) {
    const semiPerimeterSumX = GeoPlane.sumPotentialSplitSemiPerimeters(node, GeoPlane.compareMinX),
          semiPerimeterSumY = GeoPlane.sumPotentialSplitSemiPerimeters(node, GeoPlane.compareMinY);

    if (semiPerimeterSumX < semiPerimeterSumY)
      node.sortChildren(GeoPlane.compareMinX);

    // TODO: Choose the index to split at. The R-tree structure prefers distribution with minimum
    //       overlap, then distribution with minimum area.
    const splitIndex = Math.ceil(node.children.length / 2);

    return new GeoPlaneNode(null /* value */, node.splitAt(splitIndex), node.height);
  }

  // Comparison function for sorting by the minimum X-coordinate of a node's bounding box.
  static compareMinX(lhs, rhs) {
    return lhs.boundingBox[0] - rhs.boundingBox[0];
  }

  // Comparison function for sorting by the minimum Y-coordinate of a node's bounding box.
  static compareMinY(lhs, rhs) {
    return lhs.boundingBox[1] - rhs.boundingBox[1];
  }

  // Sorts the |node|'s children using |compareFn| and then computes the total semi-perimeter based
  // on the available splitting points, which is the value that will be returned.
  static sumPotentialSplitSemiPerimeters(node, compareFn) {
    node.sortChildren(compareFn);

    // Alias the utility methods to improve readability in this function.
    const computeSemiPerimeter = BoundingBoxUtil.semiPerimeter;
    const combine = BoundingBoxUtil.combine;

    let leftBoundingBox = combine(...node.children.slice(0, this.minChildren_)),
        rightBoundingBox = combine(...node.children.slice(this.maxChildren_ - this.minChildren_)),
        semiPerimeter = computeSemiPerimeter(leftBoundingBox) + computeSemiPerimeter(rightBoundingBox);

    for (let i = this.minChildren_; i < this.maxChildren_; ++i) {
      leftBoundingBox = combine(leftBoundingBox, node.children[i].boundingBox);
      semiPerimeter += computeSemiPerimeter(leftBoundingBox);
    }

    for (let i = this.maxChildren_ - this.minChildren_ - 1; i >= this.minChildren_; --i) {
      rightBoundingBox = combine(rightBoundingBox, node.children[i].boundingBox);
      semiPerimeter += computeSemiPerimeter(rightBoundingBox);
    }

    return semiPerimeter;
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

exports = GeoPlane;
