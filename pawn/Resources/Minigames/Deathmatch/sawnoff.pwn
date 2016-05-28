// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

SetPlayerUpForSawnoff( playerid )
{
    new Float: x = -1480.0000 + float( random ( 100 ));
    new Float: y = 340.0000 + float( random ( 80 ));
    SetPlayerPos( playerid, x, y, 32 ) ;

    SetPlayerHealth(playerid, 100);
    SetPlayerArmour(playerid, 100);
    SetPlayerWorldBounds( playerid, -1343.2637, -1485.9154, 447.1273, 334.7642 );
    ResetPlayerWeapons( playerid );

    SetPlayerWeather(playerid, 10);

    TimeController->setPlayerOverrideTime(playerid, 12, 0);

    if(iPlayerSawnoffWeapon[playerid] == 1)
    {
        GiveWeapon( playerid, 32, 4000);
    } else if(iPlayerSawnoffWeapon[playerid] == 2)
    {
        GiveWeapon(playerid, 28, 4000);
    } else
    {
        GiveWeapon(playerid, 32, 4000);
        SendClientMessage(playerid, COLOR_GREEN, "You've been automatically given a Tec9 as spawnweapon for the sawnoff minigame,");
        SendClientMessage(playerid, COLOR_GREEN, "because you didn't set a spawnweapon. Please use /my minigame to do this.");
    }

    GiveWeapon( playerid, 26, 3000);
    SetPlayerVirtualWorld(playerid,3);
}