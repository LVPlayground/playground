// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The weather configuration class contains constants used by the other weather components. The
 * sizes of a single tile, tile counts, and so on. All used calculations assume that the map
 * exists of a square surface, optionally with an offset from the center point. Like GTA.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class WeatherConfiguration {
    // What is the length in game length units of a side of the map?
    public const WorldEdgeUnitLength = 6000;

    // Since the center point is 0x0, what is the offset to get to one of the edges?
    public const WorldEdgeUnitOffset = 3000;

    // What is the length of a tile's edge, in game units? The amount of tiles will equal
    // (WorldEdgeUnitLength / TileEdgeUnitLength)^2.
    public const TileEdgeUnitLength = 300;

    // Given a tile's edge length, how many tiles are there on an edge? This value will equal
    // WorldEdgeUnitLength / TileEdgeUnitLength.
    public const EdgeTileCount = 20;

    // How many tiles exist over the entire map? This equals EdgeTileCount^2. If this value gets
    // adjusted, please be advised that all the grid modifications need to be adjusted as well.
    public const TileCount = 400;
};

/**
 * Now include the individual files which control the weather. The WeatherController class will
 * control most of the other classes.
 */
#include "Features/Environment/Weather/HumidityGrid.pwn"
#include "Features/Environment/Weather/TemperatureGrid.pwn"

#include "Features/Environment/Weather/WeatherController.pwn"
#include "Features/Environment/Weather/Weather.pwn"

#include "Features/Environment/Weather/WeatherPrinter.pwn"
