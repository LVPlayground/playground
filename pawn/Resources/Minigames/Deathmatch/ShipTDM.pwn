// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Cargo Ship Team Deathmatch
//
// A great team-deathmatch like minigame where players spawn on
// the cargoship just east of San Fierro. Players automatically get
// devided in the teams, whereas each team got their own colour
// and skin. Nametags are hidden for people in other teams, creating
// a unique and exciting environment for a coolish minigame.
//
// Author:  Peter Beverloo
//          peter@dmx-network.com
//

#define TEAM_A          0
#define TEAM_B          1

new m_sTDM_Teams[ 2 ];
new m_sTDM_Members[ 2 ][ 100 ];
new m_sTDM_SaveSkin[ MAX_PLAYERS ];
new m_sTDM_PlayerCount = 0;

SetupPlayerForShipTDM( playerid )
{

    // First detect the team this player needs to be placed in;
    new iPlayerTeamID = TEAM_A;

    if (m_sTDM_Teams[ TEAM_A ] > m_sTDM_Teams[ TEAM_B ]) {
        iPlayerTeamID = TEAM_B;
    } else if (m_sTDM_Teams[ TEAM_A ] == m_sTDM_Teams[ TEAM_B ]) {
        iPlayerTeamID = random( 2 );
    }

    SetPlayerVirtualWorld( playerid, 111 );
    ResetPlayerWeapons( playerid );


    // Allrighty, team decided. Place the player in this team;
    // and yeah, I know, theoretically we support 200 players.

    new iTeamMembers = m_sTDM_Teams[ iPlayerTeamID ];
    m_sTDM_Members[ iPlayerTeamID ][ iTeamMembers ] = playerid;
    SetPlayerTeam( playerid, ( 70 + iPlayerTeamID ) );

    ColorManager->setPlayerMarkerHidden(playerid, true);

    new iOtherTeamID = ( iPlayerTeamID == 1 ) ? TEAM_A : TEAM_B;

    m_sTDM_PlayerCount++;
    m_sTDM_Teams[ iPlayerTeamID ] ++;

    // People in the other team are hidden, secret, you don't know
    // who you kill until you figure it out yourself. Naise!

    for (new i = 0; i < m_sTDM_Teams[ iOtherTeamID ]; i++) {
        if (Player(m_sTDM_Members[ iOtherTeamID ][ i ])->isConnected()) {
            ShowPlayerNameTagForPlayer( playerid, m_sTDM_Members[ iOtherTeamID ][ i ], 0 );
            ShowPlayerNameTagForPlayer( m_sTDM_Members[ iOtherTeamID ][ i ], playerid, 0 );
        }
    }

    // Ok, now that's done as well, we have to give the person weapons that
    // are appropriate for a deathmatch mode on this ship. Those are the
    // same for both teams, except for the M4 / AK47, to ensure equallity.

    GiveWeapon( playerid, 23, 75);
    GiveWeapon( playerid, 4, 1);
    GiveWeapon( playerid, ( 30 + iPlayerTeamID ), 200*m_sTDM_PlayerCount);

    // Aight, now just the spawn places left. Obviously, these are seperate
    // and dependant on the team a player is in. Great-ish, 2 static arrays.

    new Float:l_SpawnForTeam1[6][ 3 ] = {
        { -1460.6775, 1480.9409, 8.2578 },
        { -1463.9933, 1480.6542, 8.2578 },
        { -1468.1252, 1481.1332, 8.2578 },
        { -1472.2733, 1483.9171, 8.2578 },
        { -1476.8652, 1489.8525, 8.2578 },
        { -1462.9098, 1496.6130, 8.2578 }
    };

    new Float:l_SpawnForTeam2[6][ 3 ] = {
        { -1423.7911, 1491.2279, 1.8672 },
        { -1427.9479, 1489.9945, 1.8672 },
        { -1434.1146, 1486.3560, 1.8672 },
        { -1428.3120, 1482.7594, 1.8672 },
        { -1431.2108, 1496.2620, 1.8672 },
        { -1425.8505, 1498.2567, 1.8672 }
    };


    new iSpawnPosition = random( 6 );


    if (iPlayerTeamID == 0)
    {
        SetPlayerPos( playerid, l_SpawnForTeam1[ iSpawnPosition ][ 0 ],
            l_SpawnForTeam1[ iSpawnPosition ][ 1 ], l_SpawnForTeam1[ iSpawnPosition ][ 2 ] );

    } else {
        SetPlayerPos( playerid, l_SpawnForTeam2[ iSpawnPosition ][ 0 ],
        l_SpawnForTeam2[ iSpawnPosition ][ 1 ], l_SpawnForTeam2[ iSpawnPosition ][ 2 ] );
    }


    // Allrighty, that's also done, now we need to update the Virtual World
    // of this player to match something kinkey, and most of all, private.
    SetPlayerHealth( playerid, 100 );
    SetPlayerArmour( playerid, 100 );
    // Now we need to give the player a nice skin to go with the team
    // he/she is in, which is needed before the players gets spawned.
    // The same colour for the players of a team.

    m_sTDM_SaveSkin[ playerid ] = GetPlayerSkin( playerid );

    if (iPlayerTeamID == 0) {
        SetPlayerSkinEx(playerid, 122);
        SetPlayerGameColor(playerid, Color::MinigameTransparentRed);
    } else {
        SetPlayerSkinEx(playerid, 111);
        SetPlayerGameColor(playerid, Color::MinigameTransparentBlue);
    }
    return 1;
}

ShipTDM_GetTeam( playerid )
{
    for (new i = 0; i < m_sTDM_Teams[ 0 ]; i++) {
        if (m_sTDM_Members[ 0 ][ i ] == playerid)
            return 0;
    }
    return 1;
}

ShipTDM_CheckFinished( )
{

    if (m_sTDM_PlayerCount <= 1)
    {
        return 1;
    }
    new iPlyCnt[ 2 ];

    for (new i = 0; i < m_sTDM_Teams[ 0 ]; i++)
    {
        if (PlayerInfo[ m_sTDM_Members[ 0 ][ i ] ][ PlayerStatus ] == STATUS_SHIPTDM)
        {
            iPlyCnt[ 0 ] ++;
        }

    }

    for (new j = 0; j < m_sTDM_Teams[ 1 ]; j++)
    {
        if (PlayerInfo[ m_sTDM_Members[ 1 ][ j ] ][ PlayerStatus ] == STATUS_SHIPTDM)
        {
            iPlyCnt[ 1 ] ++;
        }
    }

    printf( "Team 1: %d || Team 2: %d", iPlyCnt[ 0 ], iPlyCnt[ 1 ] );

    if (iPlyCnt[ 0 ] == 0 || iPlyCnt[ 1 ] == 0) return 1;
    return 0;
}

StopPlayerForShipTDM( playerid, reason )
{
    // We need some stuff to do if the player signs out of this minigame,
    // for whatever reason. This mainly is because we mess with teams.
    m_sTDM_PlayerCount --;
    if (m_sTDM_PlayerCount == 0) {
        m_sTDM_Teams[ 0 ] = 0;
        m_sTDM_Teams[ 1 ] = 0;
    }

    if (reason == DISCONNECT || reason == LONELY) return;

    SetPlayerSkinEx( playerid, m_sTDM_SaveSkin[ playerid ] );
    TogglePlayerControllable( playerid, 1 );
    SetPlayerTeam( playerid, NO_TEAM );

    ReleasePlayerGameColor(playerid);
    ColorManager->setPlayerMarkerHidden(playerid, false);

    new iOtherTeamID = 1;
    for (new i = 0; i < m_sTDM_Teams[ 1 ]; i++) {
        if (m_sTDM_Members[ 1 ][ i ] == playerid) {
            iOtherTeamID = 0;
            break;
        }
     }

     // Ok, we've got the team ID now. We need to see everyone from the
     // other team again, which is pretty much all there's left to do.
    for (new i = 0; i < m_sTDM_Teams[ iOtherTeamID ]; i++) {
        if (Player(m_sTDM_Members[ iOtherTeamID ][ i ])->isConnected()) {
            ShowPlayerNameTagForPlayer( playerid, m_sTDM_Members[ iOtherTeamID ][ i ], 1 );
            ShowPlayerNameTagForPlayer( m_sTDM_Members[ iOtherTeamID ][ i ], playerid, 1 );
        }
    }

    // This fixes not respawning in world 0 after you finished playing the tdm
    SetPlayerVirtualWorld(playerid, 0);
    g_VirtualWorld[playerid] = 0;

    // And we're done here. Thank you for participating in this minigame!
}

