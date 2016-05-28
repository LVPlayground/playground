// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

SetPlayerUpForChainsawMassacre ( playerid )
{
    new Float: x = -2361.5000 + float ( random ( 49 )  ) ;
    new Float: y = -119.9000 + float ( random ( 39 )  ) ;
    SetPlayerPos ( playerid, x, y, 35.3203 ) ;
    SetPlayerWorldBounds ( playerid, -2310.0000, -2365.0000, -77.0000, -122.0000 ) ;
    ResetPlayerWeapons ( playerid ) ;
    GiveWeapon ( playerid, 9, 1) ;
    SetPlayerVirtualWorld(playerid,1);
}