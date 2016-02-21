// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const BoundingBoxUtil = require('world/geometry/bounding_box_util.js'),
      GeoObject = require('world/geometry/geo_object.js'),
      Node = require('world/geometry/plane/node.js');

const IntersectStrategy = require('world/geometry/plane/intersect_strategy.js'),
      NearestStrategy = require('world/geometry/plane/nearest_strategy.js'),
      SplitStrategy = require('world/geometry/plane/split_strategy.js');

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
    this.clear();

    this.minChildren_ = minChildren;
    this.maxChildren_ = maxChildren;

    this.intersectStrategy_ = new IntersectStrategy();
    this.nearestStrategy_ = new NearestStrategy();
    this.splitStrategy_ = new SplitStrategy(minChildren, maxChildren);
  }

  // Gets the bounding box encapsulating all objects in the plane.
  get boundingBox() { return this.root_.boundingBox; }

  // Gets the current height of the internal R-tree.
  get height() { return this.root_.height; }

  // Gets the maximum and minimum number of children a node in this tree may host.
  get maxChildren() { return this.maxChildren_; }
  get minChildren() { return this.minChildren_; }

  // Clears the state of the GeoPlane by removing all existing nodes from the plane.
  clear() {
    this.root_ = new Node(null /* value */);
  }

  // Inserts |obj| on the plane. The |obj| must be an instance of one of the geometric objects that
  // derive from the GeoObject base class, as availability of that interface will be assumed. The
  // insertion can cause the tree to rebalance itself.
  //
  // This method implements the Insert and AdjustTree algorithms from the paper, and calls through
  // to the SplitNode algorithm in case of overflows in the insertion path.
  insert(obj) {
    const insertionPath = [];
    const parentNode = this.determineInsertionPath(obj.boundingBox(), insertionPath);
    const newNode = parentNode.addChild(new Node(obj));

    let level = this.root_.height - 1;

    // Determine if the insertion node has to be split. If it has to, chances are that further nodes
    // down the tree have to be split as well, as the modification could cause them to overflow.
    for (; level >= 0; --level) {
      const node = insertionPath[level];
      if (node.children.length <= this.maxChildren_)
        break;

      const splitNode = this.splitStrategy_.split(node);

      // Split the root to accomodate |splitNode| if |node| has no parent. Otherwise, add to parent.
      if (!level) {
        this.root_ = new Node(null /* value */, [ node, splitNode ], node.height + 1);
        continue;
      }

      insertionPath[level - 1].addChild(splitNode);
    }

    // Extend the boundary boxes of all nodes upwards of |level| with that of |newNode|.
    for (; level >= 0; --level)
      insertionPath[level].extendBoundingBox(newNode);
  }

  // Returns an array with all objects on the map that intersect with |boundingBox|. An empty array
  // will be returned when no intersections could be found.
  intersect(boundingBox) {
    return this.intersectStrategy_.intersect(this.root_, boundingBox);
  }

  // Returns an array with the |count| nearest objects to |point|, which must be an array with a
  // [x, y] coordinates. When no objects could be found, null will be returned instead.
  nearest(point, count = 1) {
    return this.nearestStrategy_.nearest(this.root_, point, count);
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
        const enlargement = BoundingBoxUtil.computeArea(boundingBox, child.boundingBox) - child.area;

        if (enlargement < minimumEnlargement) {
          minimumEnlargement = enlargement;
          minimumArea = Math.min(minimumArea, child.area);
          target = child;
        }

        else if (enlargement === minimumEnlargement && minimumArea > child.area) {
          minimumArea = child.area;
          target = child;
        }
      });

      node = target;
    }

    return node;
  }

  // -----------------------------------------------------------------------------------------------

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
