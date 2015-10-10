// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player leaves a checkpoint set for that player.
 *
 * @param playerid Id of the player who left the checkpoint.
 */
public OnPlayerLeaveCheckpoint(playerid) {
    PlayerInfo[playerid][playerInCheckpoint] = 0;

    return 1;
}