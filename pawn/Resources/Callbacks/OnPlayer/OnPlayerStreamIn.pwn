// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player is streamed by some other player's client.
 *
 * @param playerid Id of the player who has been streamed.
 * @param forplayerid Id of the player who streamed the other player in.
 */
public OnPlayerStreamIn(playerid, forplayerid) {
    if (PlayerInfo[playerid][playerIsHidden] != 0)
        ShowPlayerNameTagForPlayer(forplayerid, playerid, 0);

    return 1;
}