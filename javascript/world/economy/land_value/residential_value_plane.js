// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GeoPlane = require('world/geometry/geo_plane.js');

// JSON file that contains the definitions for determining the residential value.
const RESIDENTIAL_VALUE_DATA_FILE = 'data/economy/residential_value.json';

// Determines residential value of given points on the map. This is a layered plane that will return
// the following values for the following scenarios to a given point:
//
// 0  Nature, water, unpopulated areas.
// 1  Small, poorer towns.
// 2  Small, richer towns; mid-size towns.
// 3  Outskirts of Las Venturas, San Fierro and Los Santos.
// 4  City centers of Las Venturas, San Fierro and Los Santos.
// 5  Airports, military bases, silicon valey, otherwise strategic areas.
//
// This class does not define how residential values should influence aggregate land values.
class ResidentialValuePlane {
  constructor() {
    this.plane_ = new GeoPlane();
    this.loadFile(RESIDENTIAL_VALUE_DATA_FILE);
  }

  // Returns the residential value for the given [x, y] coordinates.
  getResidentialValueForLocation(x, y) {
    const areas = this.plane_.intersect([x, y, x, y]);

    let value = 0;
    areas.forEach(area =>
        value = Math.max(value, area.value));

    return value;
  }

  // Loads the definitions in |filename| as input for populating the residential value plane. It is
  // expected to be an array of entries, each of which has a bounding box and a value.
  //
  // This method does not do a lot of error checking, but since the functionality is unit tested any
  // error in the data (or data file) will be surfaced before the gamemode starts.
  loadFile(filename) {
    const data = JSON.parse(readFile(filename));
    data.forEach(entry =>
        this.plane_.insert(new ResidentialValueArea(entry.area, entry.value)));
  }
};

exports = ResidentialValuePlane;
