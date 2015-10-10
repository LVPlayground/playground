// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Las Venturas Playground Zone Manager is a very high performance plugin allowing a gamemode to
 * identify whether a player is in a certain place in San Andreas.
 *
 * Each feature can create its own layer on the San Andreas map, which will contain the zones needed
 * to support that feature's requirements. It's then possible to create one or more zones as part of
 * that layer. The Zone Manager plugin does not impose limitations in the number of layers or zones.
 *
 * A player can only be in one zone per layer at the same time. When the player enters that zone,
 * the OnPlayerEnterZone() callback will be invoked. After the player leaves the zone, the
 * OnPlayerLeaveZone() callback will be invoked. The callbacks will provide the player, layer and
 * zone which are being entered or left.
 *
 * When a player connects, you should call the zone_player_start_tracking() native to make sure the
 * Zone Manager starts tracking the player. The plugin will automatically retrieve the latest
 * positions of each player who's being tracked. When a player disconnects, you should call the
 * zone_player_stop_tracking() native to make sure the player stops being tracked. It's strongly
 * adviced to call zone_reset_players() in OnGameModeInit(), to reset the plugin's state.
 *
 * The Zone Manager plugin is fast enough to handle millions of zones for hundreds of players, while
 * continuing to supply updates to player positions every 125 milliseconds.
 */
native zone_layer_create(layerId);
native zone_layer_destroy(layerId);

native zone_create(layerId, Float: x1, Float: x2, Float: y1, Float: y2, Float: maxHeight);
native zone_destroy(layerId, zoneId);

native zone_info(layerId, zoneId, &Float: x1, &Float: x2, &Float: y1, &Float: y2, &Float: max_height);

native zone_player_start_tracking(playerId);
native zone_player_stop_tracking(playerId);
native zone_reset_players();

forward OnPlayerEnterZone(playerId, layerId, zoneId);
forward OnPlayerLeaveZone(playerId, layerId, zoneId);
