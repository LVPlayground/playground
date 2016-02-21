// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const BoundingBoxUtil = require('world/geometry/bounding_box_util.js'),
      Node = require('world/geometry/plane/node.js');

// Comparison function for sorting by the minimum X-coordinate of a node's bounding box.
const compareMinimumX = (lhs, rhs) =>
    lhs.boundingBox[0] - rhs.boundingBox[0];

// Comparison function for sorting by the minimum Y-coordinate of a node's bounding box.
const compareMinimumY = (lhs, rhs) =>
    lhs.boundingBox[1] - rhs.boundingBox[1];

// Computes the semi perimeter of the |boundingBox|, i.e. width plus height.
const computeSemiPerimeter = boundingBox =>
    (boundingBox[2] - boundingBox[0]) + (boundingBox[3] - boundingBox[1]);

// Returns two bounding boxes: one for all children of |node| left of |leftSplit|, one for all
// children of node right of |rightSplit|. The |node| will be unaffected by this operation.
const partialBoundingBoxes = (node, leftSplit, rightSplit) => {
  const leftChildren = node.children.slice(0, leftSplit),
        rightChildren = node.children.slice(rightSplit, node.children.length);

  return [
    BoundingBoxUtil.combine(...leftChildren.map(node => node.boundingBox)),
    BoundingBoxUtil.combine(...rightChildren.map(node => node.boundingBox))
  ];
}

// Strategy for splitting |node| in two new nodes. This is a naive splitting algorithm in which
// nodes will be sorted on the axis whose sum of the semi perimeters of potential splitting points
// is lowest.
//
// Then, within the available splitting points (children in the sorted list between the indices
// [minChildren, (maxChildren - minChildren)]) nodes will be preferred based on minimizing the
// overlap, then having the smallest total area, somewhat similar to choosing a leaf.
class SplitStrategy {
  constructor(minChildren, maxChildren) {
    this.minChildren_ = minChildren;
    this.maxChildren_ = maxChildren;
  }

  // Return a new Node with the split children, and will modify the |node| removing the children
  // that have been moved to the new Node.
  split(node) {
    const semiPerimeterSumX = this.sumPotentialSplitSemiPerimeters(node, compareMinimumX),
          semiPerimeterSumY = this.sumPotentialSplitSemiPerimeters(node, compareMinimumY);

    if (semiPerimeterSumX < semiPerimeterSumY)
      node.sortChildren(compareMinimumX);

    // Alias the utility methods to improve readability in this function.
    const computeArea = BoundingBoxUtil.computeArea;
    const computeIntersection = BoundingBoxUtil.computeIntersection;

    let minimumOverlap = Number.POSITIVE_INFINITY,
        minimumArea = Number.POSITIVE_INFINITY,
        splitIndex = null;

    for (let i = this.minChildren_; i <= node.children.length - this.minChildren_; ++i) {
      const [leftBoundingBox, rightBoundingBox] = partialBoundingBoxes(node, i, i);

      const overlap = computeArea(computeIntersection(leftBoundingBox, rightBoundingBox));
      const area = computeArea(leftBoundingBox) + computeArea(rightBoundingBox);

      if (overlap < minimumOverlap) {
        minimumOverlap = overlap;
        minimumArea = Math.min(minimumArea, area);
        splitIndex = i;
      }

      else if (overlap === minimumOverlap && minimumArea > area) {
        minimumArea = area;
        splitIndex = i;
      }
    }

    return new Node(null /* value */, node.splitAt(splitIndex), node.height);
  }

  // Sorts the |node|'s children using |compareFn| and then computes the total semi-perimeter based
  // on the available splitting points, which is the value that will be returned.
  sumPotentialSplitSemiPerimeters(node, compareFn) {
    node.sortChildren(compareFn);

    const childCount = node.children.length;

    // Alias the utility methods to improve readability in this function.
    const combine = BoundingBoxUtil.combine;

    let [leftBoundingBox, rightBoundingBox] =
        partialBoundingBoxes(node, this.minChildren_, childCount - this.minChildren_);

    let semiPerimeter = computeSemiPerimeter(leftBoundingBox) +
                        computeSemiPerimeter(rightBoundingBox);

    for (let i = this.minChildren_; i < childCount - this.minChildren_; ++i) {
      leftBoundingBox = combine(leftBoundingBox, node.children[i].boundingBox);
      semiPerimeter += computeSemiPerimeter(leftBoundingBox);
    }

    for (let i = childCount - this.minChildren_ - 1; i >= this.minChildren_; --i) {
      rightBoundingBox = combine(rightBoundingBox, node.children[i].boundingBox);
      semiPerimeter += computeSemiPerimeter(rightBoundingBox);
    }

    return semiPerimeter;
  }
};

exports = SplitStrategy;
