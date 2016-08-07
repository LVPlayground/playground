// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define WW_VIRTUAL_WORLD 4

SetPlayerUpForWalkWeapon(playerId) {
    SetPlayerVirtualWorld(playerId, WW_VIRTUAL_WORLD);
    SetPlayerWorldBounds(playerId, -1343.2637, -1485.9154, 447.1273, 334.7642);

    new Float: x = -1480.0000 + float(random(100));
    new Float: y = 340.0000 + float(random(80));
    SetPlayerPos(playerId, x, y, 32);

    ClearPlayerMenus(playerId);

    ResetPlayerWeapons(playerId);
    GiveWeapon(playerId, 24, 4000);
    GiveWeapon(playerId, 27, 4000);
    GiveWeapon(playerId, 31, 4000);
    GiveWeapon(playerId, 34, 4000);

    GameTextForPlayer(playerId, "~n~~n~~y~Last man standing:~w~~n~~w~Kill them all! Do not die!", 5000, 3);
}
