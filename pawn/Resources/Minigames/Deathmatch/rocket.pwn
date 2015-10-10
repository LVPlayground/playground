// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

stock SetPlayerUpForRocket( playerid )
{
    new Float: x = -123.0000 - float( random ( 140 ));
    new Float: y = 100.0000 - float( random ( 180 ));
    SetPlayerPos( playerid, x, y, 5 ) ;

    SetPlayerHealth(playerid, 100);
    SetPlayerArmour(playerid, 0);
    SetPlayerWorldBounds( playerid, -121.8499, -263.3261, 102.4352, -91.6753 );
    ResetPlayerWeapons( playerid );

    GiveWeapon( playerid, 35, 3000);

    SetPlayerVirtualWorld(playerid,2);
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        ShowPlayerNameTagForPlayer( i, playerid, 0 );
    }

    ColorManager->setPlayerMarkerHidden(playerid, true);
}