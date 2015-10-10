// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

stock SetPlayerUpForKnockout ( playerid )
{
    new Float:x = 764.64 + float ( random ( 5 )  ) ;
    new Float:y = -70.91 + float ( random ( 6 )  ) ;
    SetPlayerInterior ( playerid, 7 ) ;
    SetPlayerPos ( playerid,x,y,1001 ) ;
    ResetPlayerWeapons ( playerid ) ;
    SendClientMessage ( playerid, COLOR_YELLOW, "Let's Fight!" ) ;
    GameTextForPlayer ( playerid, "~y~ Let's Fight!", 3000, 5 ) ;
    GiveWeapon(playerid,1,1);
    SetPlayerTeam(playerid, NO_TEAM);
}