// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

OnPlayerLVPConnect(playerid) {
    if (playerid >= MAX_PLAYERS) {
        new message[128];
        format(message, sizeof(message), "*** Warning: Buffer overflow detected for playerId %d.", playerid);
        SendClientMessageToAllEx(Color::Warning, message);
        Kick(playerid);
        return 1;
    }

    ResetDeathFloodCountForPlayer(playerid);
    SetInvolvedInJavaScriptGame(playerid, false);

    ResetPlayerStats(playerid);

    RemoveBuildingForPlayer(playerid, 1302, 0.0, 0.0, 0.0, 6000.0);
    RemoveBuildingForPlayer(playerid, 1209, 0.0, 0.0, 0.0, 6000.0);
    RemoveBuildingForPlayer(playerid, 955, 0.0, 0.0, 0.0, 6000.0);
    RemoveBuildingForPlayer(playerid, 1775, 0.0, 0.0, 0.0, 6000.0);
    RemoveBuildingForPlayer(playerid, 1776, 0.0, 0.0, 0.0, 6000.0);
    RemoveBuildingForPlayer(playerid, 620, 1043.1797, 1660.6484, 6.2188, 0.25);

#if Feature::DisableFights == 0
    CFightClub__OnConnect(playerid);
#endif

    CDrink__Connect(playerid);
    CCrush__Connect(playerid);
    InitializeMapZoneTextDrawsForPlayer(playerid);
    DisablePlayerCheckpoint(playerid);

    if (!strcmp(Player(playerid)->nicknameString(), iRecordName, false))
        iServerChampion = playerid;

    GetPlayerName(playerid, PlayerInfo[playerid][playerName], 32);
    iRconLoginAttempts[playerid] = 0;

    return 1;
}
