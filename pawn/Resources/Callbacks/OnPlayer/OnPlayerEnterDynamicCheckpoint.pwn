// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player enters a checkpoint.
 *
 * @param playerid Id of the player who entered the checkpoint.
 * @param checkpointid Id of the checkpoint.
 */
public OnPlayerEnterDynamicCP(playerid, DynamicCP: checkpointid) {
    CRace__CheckDynamicCP(playerid, checkpointid);

    return 1;
}