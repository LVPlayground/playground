// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player exits a menu.
 *
 * @param playerid Id of the player that exited the menu.
 */
public OnPlayerExitedMenu(playerid) {
    g_PlayerMenu[playerid] = 0;

    CHideGame__onExitedMenu(playerid);

    if (GetPlayerMenu(playerid) == BombMenu[0] || GetPlayerMenu(playerid) == BombMenu[1]) {
        RemovePlayerFromBombShop(playerid);
        CBomb__ResetVehicleData(GetPlayerVehicleID(playerid));
        SendClientMessage(playerid, Color::Error, "You left the bombshop and cancelled the bomb selection!");
        SendClientMessage(playerid, Color::Error, "We DON'T give refunds.");
    }

    TogglePlayerControllable(playerid, true);

    return 1;
}