// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Invalid bounding box where the [xy]2 coordinates are larger than [xy]1.
const INVALID_BOUNDING_BOX = [ Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
                               Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ];

// Node representing an entry in the R-tree backing the GeoPlane implementation.
class GeoPlaneNode {
  constructor(value) {
    this.boundingBox_ = value ? value.boundingBox() : INVALID_BOUNDING_BOX;
    this.children_ = [];
    this.value_ = value;
  }

  // Gets the bounding box encapsulating this node and all its children.
  get boundingBox() { return this.boundingBox_; }

  // Gets the children of this node in the plane.
  get children() { return this.children_; }

  // Gets the value of this node, i.e. the object it's holding.
  get value() { return this.value_; }

  // Adds |obj| as a child to this node. The bounding box of the node will be extended if needed.
  addChild(obj) {
    const node = new GeoPlaneNode(obj);

    this.boundingBox_[0] = Math.min(this.boundingBox_[0], node.boundingBox[0]);
    this.boundingBox_[1] = Math.min(this.boundingBox_[1], node.boundingBox[1]);

    this.boundingBox_[2] = Math.max(this.boundingBox_[2], node.boundingBox[2]);
    this.boundingBox_[3] = Math.max(this.boundingBox_[3], node.boundingBox[3]);

    this.children_.push(node);
  }
};

exports = GeoPlaneNode;
