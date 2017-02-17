// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Zone Manager allows you to create rectangular zones on the map to support your feature. In
 * order to be able to add zones, first create a new layer and add zones to that. Be sure to remove
 * the layer once your feature no longer needs it as well.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ZoneManager {
    // The Id which invalid layers will receive.
    public const InvalidLayerId = 2147483646; /** INT_MAX - 1 **/

    /**
     * Reset the player state of the Zone Manager when the gamemode initializes.
     */
    public __construct() {
        zone_reset_players();
    }

    /**
     * In order for zones to work for a specific player, they need to be added to the list of
     * tracked players in the plugin itself. We only want to do this for non-NPC players.
     *
     * @param playerId Id of the player who just connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        if (IsPlayerNPC(playerId) == 0)
            zone_player_start_tracking(playerId);
    }

    /**
     * As there is no purpose in tracking players after they've disconnected from the server, stop
     * tracking them in the plugin explicitly.
     *
     * @param playerId Id of the player who left the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (IsPlayerNPC(playerId) == 0)
            zone_player_stop_tracking(playerId);
    }

    /**
     * Allocates a new layer in the Zone Manager which can be used for your feature.
     *
     * @param layerId Id of the layer which should be allocated.
     * @return integer The Id of the newly created layer, available for use.
     */
    public inline createLayer(layerId) {
        return zone_layer_create(layerId);
    }

    /**
     * Removes a layer, indentified by its Id, from the Zone Manager.
     *
     * @param layerId Id of the layer which should be destroyed.
     */
    public inline destroyLayer(layerId) {
        zone_layer_destroy(layerId);
    }
};

/**
 * The OnPlayerEnterZone callback will be invoked by the Zone Manager plugin when a player enters a
 * new zone on a certain layer. We invoke a switch so features can handle this.
 *
 * @param playerId Id of the player who just entered a zone.
 * @param layerId Id of the layer on which that zone is located.
 * @param zoneId Id of the actual zone which they entered.
 */
public OnPlayerEnterZone(playerId, layerId, zoneId) {
    if (Player(playerId)->isConnected() == false)
        return; // the player is not connected, disregard this request

    if (GetPlayerState(playerId) == PLAYER_STATE_SPECTATING)
        return; // the player is spectating someone who entered the zone, disregard this request

    Annotation::ExpandSwitch<OnPlayerEnterZone>(layerId, playerId, zoneId);
}

/**
 * The OnPlayerLeaveZone callback will be invoked by the Zone Manager plugin when a player leaves
 * a zone they're in. We invoke a switch, with the layer Id as the key, so features can handle it.
 *
 * @param playerId Id of the player who just left a zone.
 * @param layerId Id of the layer on which that zone is located.
 * @param zoneId Id of the actual zone which they left.
 */
public OnPlayerLeaveZone(playerId, layerId, zoneId) {
    if (Player(playerId)->isConnected() == false)
        return; // the player is not connected, disregard this request.

    if (GetPlayerState(playerId) == PLAYER_STATE_SPECTATING)
        return; // the player is spectating someone who left the zone, disregard this request

    Annotation::ExpandSwitch<OnPlayerLeaveZone>(layerId, playerId, zoneId);
}
