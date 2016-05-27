// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player enters a race checkpoint.
 *
 * @param playerid Id of the player who entered the race checkpoint.
 */
public OnPlayerEnterRaceCheckpoint(playerid) {
    PlayerPlaySound(playerid, 1058, 0, 0, 0);

    if (MapZoneCheckpointUpdate(playerid))
        return 1;

    return 1;
}