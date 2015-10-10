// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Each area in Las Venturas Playground is represented as a tile with a localized situation which
 * includes weather, time and valuation. While there are other complicated systems backing each of
 * these data points, easy accessors are available through the EnvironmentTile class.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class EnvironmentTile <tileId (EnvironmentTileCount)> {
    // Id which represents an invalid tile, for example because it's out of range.
    public const InvalidId = -1;

    /**
     * Converts a 2D position on the San Andreas map to a tile Id. If the position is outside of the
     * valid range, the EnvironmentTile::InvalidId constant will be returned.
     *
     * @param positionX X-coordinate of the position to get the tile Id for.
     * @param positionY Y-coordinate of the position to get the tile Id for.
     * @return integer Id of the tile representing this position, or EnvironmentTile::InvalidId.
     */
    public static TileIdForPosition(Float: positionX, Float: positionY) {
        if (positionX < EnvironmentMinimumAxisValue || positionX > EnvironmentMaximumAxisValue)
            return EnvironmentTile::InvalidId; // X-coordinate out of range.

        if (positionY < EnvironmentMinimumAxisValue || positionY > EnvironmentMaximumAxisValue)
            return EnvironmentTile::InvalidId; // Y-coordinate out of range.

        new tileIndexX = Math->floor((positionX + EnvironmentMaximumAxisValue) / EnvironmentTileEdgeLength),
            tileIndexY = Math->floor((positionY + EnvironmentMaximumAxisValue) / EnvironmentTileEdgeLength);

        return (tileIndexY * EnvironmentTileAxisCount) + tileIndexX;
    }
};
