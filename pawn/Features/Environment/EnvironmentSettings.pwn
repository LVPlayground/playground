// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The western-most x-coordinate and the southern-most y-coordinate supported on the San Andreas map.
const Float: EnvironmentMinimumAxisValue = -3000.0;

// The eastern-most x-coordinate and the northern-most y-coordinate supported on the San Andreas map.
const Float: EnvironmentMaximumAxisValue = 3000.0;

// Total length of the map's edge. Derived from the total distance between the minimum and maximum axis values.
const Float: EnvironmentEdgeLength = 6000.0;

// The length of the edge any tile should have. Tiles are square.
const Float: EnvironmentTileEdgeLength = 300.0;

// The number of tiles on any axis of the San Andreas map. Derived by dividing the environment's
// edge length by a tile's edge length.
const EnvironmentTileAxisCount = 20;

// The total number of tiles on the map. Derived from squaring the tile axis count.
const EnvironmentTileCount = 400;
