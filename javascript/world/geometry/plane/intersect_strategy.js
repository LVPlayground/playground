// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns whether the bounding box |lhs| intersects with |rhs|.
const boundingBoxesIntersects = (lhs, rhs) =>
    !(rhs[0] > lhs[2] || rhs[2] < lhs[0] || rhs[1] > lhs[3] || rhs[3] < lhs[1]);

// Returns whether the bounding box |lhs| contains |rhs|.
const boundingBoxContains = (lhs, rhs) =>
    lhs[0] <= rhs[0] && lhs[1] <= rhs[1] && lhs[2] >= rhs[2] && lhs[3] >= rhs[3];

// Depth-first search implementation of the `intersect` functionality of the GeoPlane. Will do a DFS
// on the |rootNode| entering all children whose bounding box intersects with |boundingBox|.
//
// This implementation has a worst-case complexity of O(n) for |n| nodes in the tree.
class IntersectStrategy {
  intersect(rootNode, boundingBox) {
    let node = rootNode,
        queue = [],
        result = [];

    if (!boundingBoxesIntersects(boundingBox, node.boundingBox))
      return null;

    do {
      node.children.forEach(child => {
        if (!boundingBoxesIntersects(boundingBox, child.boundingBox))
          return;

        if (child.isLeaf) {
          result.push(child.value);
        } else if (boundingBoxContains(boundingBox, child.boundingBox)) {
          // |boundingBox| contains the |child| and all child-nodes. Iteratively add them to the
          // |result| array because we know that all will apply.
          let innerQueue = [],
              innerNode = child;

          do {
            if (innerNode.isLeaf)
              result.push(innerNode.value);
            else
              innerQueue.push(...innerNode.children);

          } while (innerNode = innerQueue.pop());

        } else {
          queue.push(child);
        }
      });

    } while (node = queue.pop());

    return result.length ? result : null;
  }
};

exports = IntersectStrategy;
