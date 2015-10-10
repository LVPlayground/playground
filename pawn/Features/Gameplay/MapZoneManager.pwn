// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How much map zones do we expect to be created?
const MaximumNumberOfMapZones = 375;

/**
 * San Andreas is split up in a large number of individual zones. We'd like to track which city each
 * player is in, together with which part of each city the player is in. In order to achieve this, a
 * JSON file contains all the areas, which we'll feed to the zone manager.
 *
 * TODO: Store bounds for each zone and offer a ZoneForArea method.
 * TODO: Teach the Map Zone Manager how to deal with cities.
 * TODO: Fix the PreCompiler to refer to static class members.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class MapZoneManager <zoneId (MaximumNumberOfMapZones)> {
    // Id of invalid map zones, i.e. when the player is not in a zone currently.
    public const InvalidMapZone = -1;

    // Id of the zone layer allocated to handle our zones on the map.
    new static m_zoneLayer;

    // Which zone is a certain player currently located in?
    new static m_zoneForPlayer[MAX_PLAYERS];

    // What is the name of this map zone?
    new m_name[28];

    /**
     * Reads all zone information from a data file and feeds it to the Zone Manager. This will allow
     * us to automatically get updates in regards to which zone a player is in. We only store the
     * name of each zone, as we may have to present this to the player.
     */
    public static __construct() {
        new Node: zoneFile = JSON->parse("data/map_zones.json");
        if (zoneFile == JSON::InvalidNode) {
            printf("[Map Zone Manager] Unable to load the 'data/map_zones.json' data file.");
            return;
        }

        // Create a zone layer in which we'll store our layers.
        m_zoneLayer = ZoneManager->createLayer();

        // Now iterate through all the zones available in the JSON file, read their data and create
        // a zone from them. Assert that the given zone Id is [previous Id] + 1.
        new lastZoneId = -1, Float: zoneArea[5], zoneName[28];
        for (new Node: currentZone = JSON->firstChild(zoneFile); currentZone != JSON::InvalidNode; currentZone = JSON->next(currentZone)) {
            new Node: dataEntry = JSON->firstChild(currentZone);

            for (new areaIndex = 0; areaIndex < sizeof(zoneArea); ++areaIndex) {
                JSON->readFloat(dataEntry, zoneArea[areaIndex]);
                dataEntry = JSON->next(dataEntry);
            }

            JSON->readString(dataEntry, zoneName, sizeof(zoneName));

            new zoneId = ZoneLayer(m_zoneLayer)->createZone(zoneArea[0], zoneArea[1], zoneArea[2], zoneArea[3], zoneArea[4]);
            if (zoneId != (lastZoneId + 1)) {
                printf("[Map Zone Manager] Zone Ids don't seem to be sequential, aborting.");
                JSON->close(zoneFile);
                return;
            }

            if (zoneId >= MaximumNumberOfMapZones) {
                printf("[Map Zone Manager] The 'data/map_zones.json' data file contains too much entries (max: %d).", MaximumNumberOfMapZones);
                JSON->close(zoneFile);
                return;
            }

            // Set the name for this zone, update the last issued Id and proceed.
            MapZoneManager(zoneId)->setName(zoneName);
            lastZoneId = zoneId;
        }

        // Initialize the zone for each player to the invalid player Id.
        for (new playerId = 0; playerId < MAX_PLAYER_ID; ++playerId)
            m_zoneForPlayer[playerId] = InvalidMapZone;

        JSON->close(zoneFile);
    }

    /**
     * This method will be called by the Zone Manager when a player enters a map zone. We'll update
     * their current state and announce it for the Zone Indicator to display an indicator.
     *
     * @param playerId Id of the player who's entering a map zone.
     * @param zoneId Id of the layer *and zone* which they just entered.
     */
    @switch(OnPlayerEnterZone, 100000 /** m_zoneLayer **/)
    public static onPlayerEnterMapZone(playerId, zoneId) {
        if (layerId < 0 || layerId >= MaximumNumberOfMapZones)
            return; // we don't want a buffer overflow here.

        m_zoneForPlayer[playerId] = layerId;
    }

    /**
     * When a player leaves a map zone, we have to reset the zone for that player so we don't get
     * stuck with old data.
     *
     * @param playerId Id of the player who just left a map zone.
     * @param zoneId Id of the layer *and zone* which they just left.
     */
    @switch(OnPlayerLeaveZone, 100000 /** m_zoneLayer **/)
    public static onPlayerLeaveMapZone(playerId, zoneId) {
        m_zoneForPlayer[playerId] = MapZoneManager::InvalidMapZone;
        #pragma unused layerId
    }

    /**
     * Returns a reference to the name of this zone. It may be used by anything to visualize the
     * location in which a player is currently residing.
     *
     * @return string Name of the zone associated with this Id.
     */
    public inline nameString() {
        return m_name;
    }

    /**
     * Updates the name of this map zone to the given value. This should only be called from the
     * constructor as that's where the data is initialized, so make it private.
     *
     * @param name The name which should be assigned to this zone.
     */
    private setName(name[]) {
        format(m_name, sizeof(m_name), "%s", name);
    }

    /**
     * Returns the Id of the zone the given player currently is in, or MapZoneManager.InvalidMapZone
     * constant in case they're not in a zone right now.
     *
     * @param playerId Id of the player for whom we'd like to know the current zone.
     * @return integer The Id of the map zone this player is currently in.
     */
    public static mapZoneForPlayer(playerId) {
        return m_zoneForPlayer[playerId];
    }
};
