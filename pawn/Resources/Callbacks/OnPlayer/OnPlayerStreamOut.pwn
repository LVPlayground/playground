// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player is streamed out from some other player's client.
 *
 * @param playerid Id of the player who has been destreamed.
 * @param forplayerid Id of the player who destreamed the other player.
 */
public OnPlayerStreamOut(playerid, forplayerid) {
    Annotation::ExpandList<OnPlayerStreamOut>(playerid, forplayerid);

    return 1;
}