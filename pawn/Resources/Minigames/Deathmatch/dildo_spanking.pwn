// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

stock SetPlayerUpForDildoSpanking ( playerid)
{
    new Float:x = -427.0000 + float ( random ( 5) ) ;
    new Float:y = 2506.0000 + float ( random ( 5) ) ;
    SetPlayerPos ( playerid,x,y,124.3047) ;
    SetPlayerWorldBounds ( playerid,-380.0000,-470.0000,2550.0000,2460.0000) ;
    ResetPlayerWeapons ( playerid) ;
    GiveWeapon ( playerid,WEAPON_DILDO,1) ;
    SetPlayerVirtualWorld(playerid,1);
}