// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

SetPlayerUpForBatfight ( playerid )
{
    new Float: x = 1305.7500 + float ( random ( 84 ) ) ;
    new Float: y = 2107.5000 + float ( random ( 84 ) ) ;
    SetPlayerPos ( playerid, x, y, 11.0234 ) ;
    SetPlayerWorldBounds ( playerid, 1397.1653, 1297.0610, 2198.6494, 2100.2563 ) ; // moet nog verruimd worden aan de straatkant, nu geraak je klem tussen world boundry en het hek ;)
    ResetPlayerWeapons ( playerid ) ;
    GiveWeapon( playerid, WEAPON_BAT, 1) ;
    SetPlayerVirtualWorld(playerid,1);
}