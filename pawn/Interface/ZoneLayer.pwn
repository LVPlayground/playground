// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * A zone layer contains zero or more zones which will track whether the player is in them or not. A
 * player can be in a maximum of one zone at the same time, per layer. The OnPlayerEnterZone switch
 * will be invoked, based on the layer Id, when they enter it. Similarly, the OnPlayerLeaveZone
 * switch will be invoked when they leave it.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ZoneLayer <layerId (1)> {
    /**
     * Creates a new zone on this layer for which the OnPlayerEnterZone and OnPlayerLeaveZone
     * callbacks then will be invoked for each tracked player.
     *
     * @param x1 The horizontal starting position where this zone will start.
     * @param x2 The horizontal ending position where this zone will end.
     * @param y1 The vertical starting position where this zone will start.
     * @param y2 The vertical ending position where this zone will end.
     * @param maxHeight The maximum height until which this zone will apply.
     * @return integer Id of the zone which has been allocated in the Zone Manager.
     */
    public createZone(Float: x1, Float: x2, Float: y1, Float: y2, Float: maxHeight = 100.0) {
        return zone_create(layerId, x1, x2, y1, y2, maxHeight);
    }

    /**
     * Returns boundary information about the current zone. This is a rather expensive operation
     * because player processing cannot be done while executing this method is in process, so call
     * this as little as you can. Still, it's useful for visualizing the created zones.
     *
     * @param zoneId Id of the zone to get boundary information of.
     * @param x1 The horizontal starting position where this zone starts.
     * @param x2 The horizontal ending position where this zone ends.
     * @param y1 The vertical starting position where this zone starts.
     * @param y2 The vertical ending position where this zone ends.
     * @param maxHeight Maximum height which applies to this zone.
     * @return boolean Whether information about this zone was successfully retrieved.
     */
    private bool: zoneInfo(zoneId, &Float: x1, &Float: x2, &Float: y1, &Float: y2, &Float: maxHeight) {
        return zone_info(layerId, zoneId, x1, x2, y1, y2, maxHeight) != 0;
    }

    /**
     * Destroy a zone in this layer, identified by its Id, making sure that players won't be able to
     * enter it anymore. No OnPlayerLeaveZone callbacks will be invoked either.
     *
     * @param zoneId Id of the zone which should be removed from this layer.
     */
    public inline destroyZone(zoneId) {
        zone_destroy(layerId, zoneId);
    }

    /**
     * Visualizes all zones on this layer for the given player Id by creating gang zones on their
     * map, allowing it to be displayed on their minimap. Each zone will appear as a opaque, clear
     * square. The gang zones created by this method cannot be removed at this time.
     *
     * @param playerId Id of the player to visualize the zones for.
     * @param color Color with which the square should be visualized on the map.
     */
    public visualizeForPlayer(playerId, color) {
        new Float: rectangle[4], Float: maxHeight;
        for (new zoneId = 0; zoneId < MAX_GANG_ZONES; ++zoneId) {
            if (this->zoneInfo(zoneId, rectangle[0], rectangle[1], rectangle[2], rectangle[3], maxHeight) == false)
                return;

            new gangZoneId = GangZoneCreate(rectangle[0], rectangle[2], rectangle[1], rectangle[3]);
            GangZoneShowForPlayer(playerId, gangZoneId, color);
        }
    }
};
