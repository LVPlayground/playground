// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PriorityQueue = require('base/priority_queue.js'); 

// Returns the squared distance between the |point| and the nearest edge of the |boundingBox|.
const distanceFromPointToBoundingBox = (point, boundingBox) => {
  const distanceX = point[0] < boundingBox[0] ? boundingBox[0] - point[0]
                        : point[0] <= boundingBox[2] ? 0
                            : point[0] - boundingBox[2];

  const distanceY = point[1] < boundingBox[1] ? boundingBox[1] - point[1]
                        : point[1] <= boundingBox[3] ? 0
                            : point[1] - boundingBox[3];

  return distanceX * distanceX + distanceY * distanceY;
}

// Implementation of a strategy that implements a kNN search by doing a depth-first search
// and storing the resulting nodes in a priority queue ordered by distance from the point.
//
// This implementation has a worst-case complexity of O(n) for |n| nodes in the tree.
class NearestStrategy {
  nearest(rootNode, point, count) {
    const queue = new PriorityQueue((lhs, rhs) => lhs.distance - rhs.distance);

    let node = rootNode,
        result = [];

    while (node) {
      node.children.forEach(child => {
        queue.push({
          distance: distanceFromPointToBoundingBox(point, child.boundingBox),
          child: child
        });
      });

      while (queue.size() && queue.peek().child.isLeaf) {
        result.push(queue.pop().child.value);
        if (result.length == count)
          return result;
      }

      node = queue.size() ? queue.pop().child : null;
    }

    return result;
  }
};

exports = NearestStrategy;
