// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player enters a race checkpoint.
 *
 * @param playerid Id of the player who entered the race checkpoint.
 * @param checkpointid Id of the race checkpoint.
 */
public OnPlayerEnterDynamicRaceCP(playerid, checkpointid) {
    CheckMapZoneDynamicCheckpoint(playerid, checkpointid);

    return 1;
}