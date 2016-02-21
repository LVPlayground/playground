// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoPlane = require('world/geometry/geo_plane.js');

const LandValuePoint = require('world/economy/land_value_point.js');

// The land value plane determines the value of a specific point on the map. The value of a point
// will be influenced by a series of heuristics: activity, incidents and location.
//
// TODO: Define how granular land values will be. (25x25 areas already are 57600 points.)
// TODO: Define how land values will be expressed (enum? range? absolute number?)
// TODO: Define the precise heuristics that influence land values.
// TODO: Define how and when the land value plane will update.
// TODO: Write a tool to visualize the land value plane for manual verification.
class LandValuePlane {
  constructor() {
    this.plane_ = new GeoPlane();
  }

  // Returns the land value at location [x, y]. This will do a kNN lookup for a single value on the
  // underlying GeoPlane, but will be fast enough to call frequently.
  getValueForLocation(x, y) {
    const point = this.plane_.nearest([x, y], 1);
    if (point.length)
      return point[0].value;

    return 0;
  }

  // Rebuilds the land value plane. This method is expensive as it will access a significant number
  // of data sources to recalculate the value of many points on the map.
  rebuild() {
    this.plane_.clear();
    this.plane_.insert(new LandValuePoint(0, 0, 50));
  }
};

exports = LandValuePlane;
