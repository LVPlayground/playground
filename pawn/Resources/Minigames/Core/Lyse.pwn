// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
            Las Venturas Playground v2.91   


        Based off the rivershell minigame, Lyse (Local Yocal Sports edition)
        involves the same objective and rules as rivershell, but instead of
        boats uses vehicles.


            Author: James "Jay" Wilkinson
            Date:   16th August 2009


*******************************************************************************/
#define LYSE_STATE_NONE             0 
#define LYSE_STATE_SIGNUP           1
#define LYSE_STATE_RUNNING          2 

#define LYSE_VEHICLE_COUNT 88
#define LYSE_CAPS_TO_WIN        3               // How many captures are needed to win?
#define LYSE_VIRTUAL_WORLD      5000000          // What virtual world do we use?
#define LYSE_MINIMUM_SIGNUPS        2           // How many people have to signup for Lyse for it to start?
#define LYSE_BLUETEAM_MAPICON       31          // Map icon IDs used here
#define LYSE_GREENTEAM_MAPICON      32
#define TEXTDRAW_PHASE_NONE             0
#define TEXTDRAW_PHASE_BASE             1
#define TEXTDRAW_PHASE_TRUCK            2
#define TEXTDRAW_PHASE_COMPLETE         3

new iLyseState;                          // Stores the global state of Lyse.

enum E_LYSE_PLAYER
{
    iPlayerState,                   // Store the players state
    iPlayerLyseTeam,                    // Obviously we need to store the players team to.
    Float:f_LyseX,
    Float:f_LyseY,
    Float:f_LyseZ,
    iLysePlayerSkin,
    iLysePlayerWorld,
    iLyseTextdrawPhase
}

new g_LyseWWTW_PlayerData[MAX_PLAYERS][E_LYSE_PLAYER];
new g_LysePlayers;                                           // How many people have signed up? You can also use CLyse__PlayerCount
new iCalcTeam;                                               // Used in CLyse__SetPlayerTeam to calculate a team for a player.
new iTeamCount[2];                                           // Stores the amount of players in each team.
new iLyseStartTime;                                          // Stores the time in which Lyse was started.
new iTeamCaptures[2];                                        // How many times has each team captured a vehicle?
new iLyseObjectivePlayer[2] = {Player::InvalidId, ...};       // What player is currently capturing the vehicle for each team?

// Maintain the Vehicle Ids which have been spawned by LYSE.
new lyseBlueTeamVehicleId = Vehicle::InvalidId;
new lyseGreenTeamVehicleId = Vehicle::InvalidId;
new lyseSpawnedVehicles[LYSE_VEHICLE_COUNT + 8 /** overflow protection **/] = {Vehicle::InvalidId, ...};

new Text3D:iLyseObjectiveBlue    =   Text3D:INVALID_3DTEXT_ID;
new Text3D:iLyseObjectiveGreen   =   Text3D:INVALID_3DTEXT_ID;
new Text3D:iLysePlayerText[MAX_PLAYERS] = {Text3D:INVALID_3DTEXT_ID};
new Text:LyseTextdraw = Text:INVALID_TEXT_DRAW;
new Text:LyseObjectiveTextdraw[3] = {Text:INVALID_TEXT_DRAW, ...};

// Locations for spawn points for the Blue team
new Float:gTeam1RandomPlayerSpawns[4][3] =
{
    {1253.6213,368.9244,19.5614},
    {1263.1244,369.7004,19.5547},
    {1246.1509,368.8576,19.5547},
    {1256.1157,364.1463,19.5614}
};

// Locations for spawn points for the green team
new Float:gTeam2RandomPlayerSpawns[4][3] =
{
    {2508.5364,123.0080,26.4863},
    {2507.9368,131.3073,26.6412},
    {2512.0205,128.9519,26.8512},
    {2497.5527,123.0576,26.6734}
};

// Random locations for the objective vehicle to spawn for the green team
new Float:gTeam1CapCarSpawns[3][4] =
{
    {1225.2269,302.1154,24.5547,133.5687},
    {1252.3326,250.5466,24.5547,24.2379},
    {1218.9547,187.7312,24.1417,338.1774}
};

// Random locations for the objective vehicle to spawn for the blue team
new Float:gTeam2CapCarSpawns[3][4] =
{
    {2496.3718,4.6243,30.7704,180.3226},
    {2518.0750,-20.9396,30.7207,359.2587},
    {2552.4460,9.5014,30.8401,92.5670}
};

// CLyse__GetPlayerTeamObjectivePlayer
// Returns the player currently capturing the vehicle
CLyse__GetObjectivePlayer(iTeamID)
{
    return iLyseObjectivePlayer[iTeamID];
}

// CLyse__SetObjectivePlayer
// Set's the player ID for the player capturing the current vehicle
CLyse__SetObjectivePlayer(iTeamID, iPlayerID)
{
    iLyseObjectivePlayer[iTeamID] = iPlayerID;
}
// CLyse__SetState
// Set's the current game state of Lyse.
CLyse__SetState(iState)
{
    iLyseState = iState;
}
// CLyse__GetState
// returns the state that Lyse is in.
CLyse__GetState()
{
    return iLyseState;
}

// CLyse__SetPlayerState
// Set the state of a player.
CLyse__SetPlayerState(iPlayerID, iState)
{
    g_LyseWWTW_PlayerData[iPlayerID][iPlayerState] = iState;
}
// CLyse__GetPlayerState
// Get the state of a player
CLyse__GetPlayerState(iPlayerID)
{
    return g_LyseWWTW_PlayerData[iPlayerID][iPlayerState];
}

// CLyse__SetTextdrawPhase
// Set the textdraw phase for the player.
CLyse__SetTextdrawPhase(playerid, iphase)
{
    g_LyseWWTW_PlayerData[playerid][iLyseTextdrawPhase] = iphase;
    CLyse__UpdateTextdraw();
}
// CLyse__GetTextdrawPhase
// return the textdraw phase ID for the player.
CLyse__GetTextdrawPhase(playerid)
{
    return g_LyseWWTW_PlayerData[playerid][iLyseTextdrawPhase];
}

// CLyse__GetPlayerCount
// returns the amount of players signed up / currently active in Lyse.
CLyse__GetPlayerCount()
{
    return g_LysePlayers;
}

// CLyse__SetPlayerTeam
// Set's the team ID of a player in Lyse.
CLyse__SetPlayerTeam(iPlayerID, iTeam)
{
    g_LyseWWTW_PlayerData[iPlayerID][iPlayerLyseTeam] = iTeam;
    iTeamCount[iTeam]++;
}

// CLyse__GetPlayerTeam
// Return the team a player is in.
CLyse__GetPlayerTeam(iPlayerID)
{
    return g_LyseWWTW_PlayerData[iPlayerID][iPlayerLyseTeam];
}

// CLyse__GetPlayerTeamCount
// return the amount of players in a team.
CLyse__GetTeamCount(iTeamID)
{
    return iTeamCount[iTeamID];
}

// CLyse__GeneratePlayerTeam
// Called from CLyse__SignPlayerUp and sets the players appropriate team.
CLyse__GeneratePlayerTeam(iPlayerID)
{
    if(!iCalcTeam)
    {
        CLyse__SetPlayerTeam(iPlayerID, TEAM_BLUE);
        iCalcTeam = true;
    }else if(iCalcTeam)
    {
        iCalcTeam = false;
        CLyse__SetPlayerTeam(iPlayerID, TEAM_GREEN);
    }
}

// CLyse__StorePlayerData
// Store the data pre to a player signing up to Lyse
CLyse__StorePlayerData(iPlayerID)
{
    CShell__SaveGuns(iPlayerID);        // Sue me.

    GetPlayerPos(iPlayerID,
    g_LyseWWTW_PlayerData[iPlayerID][f_LyseX],
    g_LyseWWTW_PlayerData[iPlayerID][f_LyseY],
    g_LyseWWTW_PlayerData[iPlayerID][f_LyseZ]);

    g_LyseWWTW_PlayerData[iPlayerID][iLysePlayerSkin] = GetPlayerSkin(iPlayerID);
    g_LyseWWTW_PlayerData[iPlayerID][iLysePlayerWorld] = GetPlayerVirtualWorld(iPlayerID);
}

// CLyse__LoadPlayerData
// This is called from when a player leaves the minigame and their
// position and stuff needs re-loading.
CLyse__LoadPlayerData(iPlayerID)
{
    ColorManager->releasePlayerMinigameColor(iPlayerID);

    CShell__LoadGuns(iPlayerID);

    SetPlayerPos(iPlayerID,
    g_LyseWWTW_PlayerData[iPlayerID][f_LyseX],
    g_LyseWWTW_PlayerData[iPlayerID][f_LyseY],
    g_LyseWWTW_PlayerData[iPlayerID][f_LyseZ]);

    SetPlayerSkinEx(iPlayerID, g_LyseWWTW_PlayerData[iPlayerID][iLysePlayerSkin]);
    SetPlayerVirtualWorld(iPlayerID, g_LyseWWTW_PlayerData[iPlayerID][iLysePlayerWorld]);
}

// CLyse__Process
// Checks if there is a minigame to start - runs from LVPs main timer every second.
CLyse__Process()
{
    if(CLyse__GetState() == LYSE_STATE_SIGNUP)
    {
        if(iLyseStartTime != 0 && Time->currentTime() - iLyseStartTime > 20)
        {
            CLyse__Start();
        }
        return;
    }


    for (new playerid = 0; playerid <= PlayerManager->highestPlayerId(); playerid++)
    {
        if(!Player(playerid)->isConnected())
        {
            continue;
        }

        if(CLyse__GetPlayerState(playerid) != LYSE_STATE_RUNNING)
            continue;

        if(CLyse__GetTextdrawPhase(playerid) == TEXTDRAW_PHASE_COMPLETE)
            continue;

        new iTeam = CLyse__GetPlayerTeam(playerid);

        new
            Float:fPosX,
            Float:fPosY,
            Float:fPosZ;



        if(iTeam == TEAM_GREEN)
        {
            GetVehiclePos(lyseBlueTeamVehicleId, fPosX, fPosY, fPosZ);

            if(IsPlayerInRangeOfPoint(playerid, 200.0, fPosX, fPosY, fPosZ))
            {
                CLyse__SetTextdrawPhase(playerid, TEXTDRAW_PHASE_TRUCK);
            }

        }else{

            GetVehiclePos(lyseGreenTeamVehicleId, fPosX, fPosY, fPosZ);

            if(IsPlayerInRangeOfPoint(playerid, 200.0, fPosX, fPosY, fPosZ))
            {
                CLyse__SetTextdrawPhase(playerid, TEXTDRAW_PHASE_TRUCK);
            }
        }
    }
}


// CLyse__ResetPlayerData
// Resets the players data when they leave
CLyse__ResetPlayerData(iPlayerID)
{
    ResetPlayerWeapons(iPlayerID);

    SetVehicleToRespawn(GetPlayerVehicleID(iPlayerID));

    RemovePlayerFromVehicle(iPlayerID);

    SetPlayerTeam(iPlayerID, NO_TEAM);

    DisablePlayerCheckpoint(iPlayerID);

    SetPlayerSkillLevel(iPlayerID, WEAPONSKILL_MICRO_UZI, 2000);

    CLyse__SetPlayerState(iPlayerID, LYSE_STATE_NONE);

    CLyse__SetTextdrawPhase(iPlayerID, TEXTDRAW_PHASE_NONE);

    CLyse__UpdateTextdraw();

    // If the player who is capturing the vehicle leaves, we have
    // to reset the var which determines who is capturing it.
    new iTeamID = CLyse__GetPlayerTeam(iPlayerID);

    if(CLyse__GetObjectivePlayer(iTeamID) == iPlayerID)
    {
        CLyse__SetObjectivePlayer(iTeamID, Player::InvalidId);
    }

    if(iLysePlayerText[iPlayerID] != Text3D:INVALID_3DTEXT_ID)
    {
        Delete3DTextLabel(iLysePlayerText[iPlayerID]);
        iLysePlayerText[iPlayerID] = Text3D:INVALID_3DTEXT_ID;
    }

    RemovePlayerMapIcon(iPlayerID, LYSE_BLUETEAM_MAPICON);
    RemovePlayerMapIcon(iPlayerID, LYSE_GREENTEAM_MAPICON);

    TextDrawHideForPlayer(iPlayerID, LyseObjectiveTextdraw[0]);
    TextDrawHideForPlayer(iPlayerID, LyseObjectiveTextdraw[1]);
    TextDrawHideForPlayer(iPlayerID, LyseObjectiveTextdraw[2]);

}

// CLyse__ResetData
// Resets the global data for Lyse, such as team and player counts.
CLyse__ResetData()
{
    g_LysePlayers = 0;
    iLyseStartTime = 0;

    iTeamCount[TEAM_GREEN] = 0;
    iTeamCount[TEAM_BLUE] = 0;

    iTeamCaptures[TEAM_GREEN] = 0;
    iTeamCaptures[TEAM_BLUE] = 0;

    iLyseObjectivePlayer[TEAM_BLUE] = Player::InvalidId;
    iLyseObjectivePlayer[TEAM_GREEN] = Player::InvalidId;

    CLyse__SetState(LYSE_STATE_NONE);
    CLyse__UpdateTextdraw();

    TextDrawDestroy(LyseTextdraw);
    LyseTextdraw = Text:INVALID_TEXT_DRAW;

    if(iLyseObjectiveBlue != Text3D:INVALID_3DTEXT_ID)
    {
        Delete3DTextLabel(iLyseObjectiveBlue);
        iLyseObjectiveBlue = Text3D:INVALID_3DTEXT_ID;
    }

    if(iLyseObjectiveGreen != Text3D:INVALID_3DTEXT_ID)
    {
        Delete3DTextLabel(iLyseObjectiveGreen);
        iLyseObjectiveGreen = Text3D:INVALID_3DTEXT_ID;
    }

}

// CLyse__SetVehicleParams
// Sets the vehicle params up for when a player respawns.
CLyse__SetVehicleParams(iPlayerID)
{
    new iTeam = CLyse__GetPlayerTeam(iPlayerID);
    if(iTeam == TEAM_GREEN) {
        SetVehicleParamsForPlayer(lyseGreenTeamVehicleId, iPlayerID, 1, 1);
        SetVehicleParamsForPlayer(lyseBlueTeamVehicleId, iPlayerID, 1, 0);
    } else{
        SetVehicleParamsForPlayer(lyseBlueTeamVehicleId, iPlayerID, 1, 1);
        SetVehicleParamsForPlayer(lyseGreenTeamVehicleId, iPlayerID, 1, 0);
    }
}

// CLyse__OnVehicleStreamIn
// Called from OnVehicleStreamIn, resets vehicle params.
CLyse__OnVehicleStreamIn(vehicleid, forplayerid)
{
    if(vehicleid == lyseGreenTeamVehicleId || vehicleid == lyseBlueTeamVehicleId)
        CLyse__SetVehicleParams(forplayerid);
}

// CLyse__VehicleSpawn
// If an objective vehicle respawns, handles resetting of the objectives
CLyse__VehicleSpawn(vehicleid)
{
    if(vehicleid == lyseGreenTeamVehicleId || vehicleid == lyseBlueTeamVehicleId)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected())
            continue;

            if(CLyse__GetPlayerState(i) != LYSE_STATE_RUNNING)
            continue;

            CLyse__SetVehicleParams(i);
        }
    }
}

CLyse__VehicleDeath(vehicleid) {
    if (vehicleid == lyseGreenTeamVehicleId || vehicleid == lyseBlueTeamVehicleId) {
        SetVehicleToRespawn(vehicleid);
        SetVehicleVirtualWorld(vehicleid, LYSE_VIRTUAL_WORLD);
    }

    for (new vehicleIndex = 0; vehicleIndex < LYSE_VEHICLE_COUNT; ++vehicleIndex) {
        if (vehicleid == lyseSpawnedVehicles[vehicleIndex]) {
            SetVehicleToRespawn(vehicleid);
            SetVehicleVirtualWorld(vehicleid, LYSE_VIRTUAL_WORLD);
        }
    }
}

// CLyse__SignPlayerUp
// Sign a player up for the minigame whilst it's in it's signup state.
CLyse__SignPlayerUp(playerid)
{
    // Has the player already signed up?
    if(CLyse__GetPlayerState(playerid) != LYSE_STATE_NONE)
    {
        return;
    }

    // Check is lyse is in the signup phase. If not, obiously we need to
    // start it.
    if(CLyse__GetState() == LYSE_STATE_NONE)
    {
        CLyse__Start();
    }


    g_LysePlayers++;

    CLyse__GeneratePlayerTeam(playerid);

    CLyse__SetPlayerState(playerid, LYSE_STATE_SIGNUP);
}

// CLyse__SignPlayerOut
// signs the player out from the minigame. Either by leaving completely
// if the game is in progress or signing out before it starts.
CLyse__SignPlayerOut(playerid)
{
    if(CLyse__GetPlayerState(playerid) == LYSE_STATE_NONE)
    {
        return 0;
    }

    if(CLyse__GetPlayerState(playerid) == LYSE_STATE_SIGNUP)
    {
        GiveRegulatedMoney(playerid, LyseSignUpCost);
        g_LysePlayers--;
        CLyse__SetPlayerState(playerid, LYSE_STATE_NONE);
        return 1;
    }

    if(CLyse__GetPlayerState(playerid) == LYSE_STATE_RUNNING)
    {
        new iTeam = CLyse__GetPlayerTeam(playerid);

        CLyse__ResetPlayerData(playerid);
        CLyse__LoadPlayerData(playerid);
        g_LysePlayers--;

        iTeamCount[iTeam]--;

        if(CLyse__GetTeamCount(iTeam) <= 0)
        {
            new notice[128];
            if(iTeam == TEAM_BLUE)
            {
                format(notice, sizeof(notice), "~y~Local Yocal Sports Edition~w~ has finished: ~g~~h~Green Team~w~ have won!");
                NewsController->show(notice);
            }else{
                format(notice, sizeof(notice), "~y~Local Yocal Sports Edition~w~ has finished: ~b~~h~Blue Team~w~ have won!");
                NewsController->show(notice);
            }
            CLyse__End();
        }

    }
    return 1;
}

// CLyse__Start
// Actually starts the minigame and distrubutes the msgs.

CLyse__Start()
{
    iLyseStartTime = 0;

    if(CLyse__GetPlayerCount() < LYSE_MINIMUM_SIGNUPS)
    {
//      new szMsg[128];
//      format(szMsg, 128, "Not enough players have signed up (minimum: %d).", LYSE_MINIMUM_SIGNUPS);
        CLyse__End();
        return;
    }


    // Ah we're still here. We need to start the minigame then, but first
    // reset the time var so this function only get's called once.


    CLyse__SetState(LYSE_STATE_RUNNING);

    CLyse__HandleVehicles(1);

    // Now we loop through and find everyone who signed up.
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
        continue;

        if(CLyse__GetPlayerState(i) != LYSE_STATE_SIGNUP)
        {
            continue;
        }

        CLyse__SetPlayerState(i, LYSE_STATE_RUNNING);

        CLyse__StorePlayerData(i);

        RemovePlayerFromVehicle(i);

        CLyse__SpawnPlayer(i);

        CLyse__SetTextdrawPhase(i, TEXTDRAW_PHASE_BASE);

        SendClientMessage(i, COLOR_YELLOW, "* Use ! <message> to talk in teamchat.");

        new
            Float:fPosX,
            Float:fPosY,
            Float:fPosZ;

        GetPlayerPos(i, fPosX, fPosY, fPosZ);

        if(CLyse__GetPlayerTeam(i) == TEAM_GREEN)
        {
            iLysePlayerText[i] = Create3DTextLabel("Green Team", COLOR_GREEN, fPosX, fPosY, fPosZ+0.7, 20.0, LYSE_VIRTUAL_WORLD);
            Attach3DTextLabelToPlayer(iLysePlayerText[i], i, 0, 0, 1.0);
        }
        else
        {
            iLysePlayerText[i] = Create3DTextLabel("Blue Team", COLOR_BLUE, fPosX, fPosY, fPosZ+0.7, 20.0, LYSE_VIRTUAL_WORLD);
            Attach3DTextLabelToPlayer(iLysePlayerText[i], i, 0, 0, 1.0);
        }
    }

    // And finally, the textdraws:
    CLyse__UpdateTextdraw();
}





// CLyse__End
// Ends the minigame when there are either not enough players signed up
// or everyone signs out. Or offcourse, somebody could have won.
CLyse__End()
{

    if(CLyse__GetState() == LYSE_STATE_NONE)
    {
        return;
    }

    CLyse__HandleVehicles();

    CLyse__SetState(LYSE_STATE_NONE);

    for (new iPlayerID = 0; iPlayerID <= PlayerManager->highestPlayerId(); iPlayerID++)
    {

        if(!Player(iPlayerID)->isConnected())
        {
            continue;
        }

        if(CLyse__GetPlayerState(iPlayerID) == LYSE_STATE_NONE)
        {
            continue;
        }

        if (CLyse__GetPlayerState(iPlayerID) == LYSE_STATE_SIGNUP)
            ShowBoxForPlayer(iPlayerID,
                "Not enough players have signed up for Local Yocal Sports Edition. You have been refunded.");

        CLyse__SignPlayerOut(iPlayerID);
    }

    CLyse__ResetData();
}



// CLyse__SpawnPlayer
// Spawns the player and gives them there weapons and such.
CLyse__SpawnPlayer(iPlayerID)
{

    ResetPlayerWeapons(iPlayerID);

    if(CLyse__GetPlayerTeam(iPlayerID) == TEAM_GREEN)
    {
        new rand = random(sizeof(gTeam1RandomPlayerSpawns));
        SetPlayerPos(iPlayerID, gTeam1RandomPlayerSpawns[rand][0], gTeam1RandomPlayerSpawns[rand][1], gTeam1RandomPlayerSpawns[rand][2]); // Warp the player
        SetPlayerSkinEx(iPlayerID, 105);
        SetPlayerTeam(iPlayerID, TEAM_GREEN);
        GameTextForPlayer(iPlayerID, "~n~~n~Capture the ~b~blue teams~y~ vehicle~w~~n~Defend ~g~your teams ~y~vehicle~w~!",7000, 3);
        SendClientMessage(iPlayerID, COLOR_YELLOW, "* Capture the blue teams vehicle whilst defending your own!");

        ColorManager->setPlayerMinigameColor(iPlayerID, COLOR_GREEN);
    }


    if(CLyse__GetPlayerTeam(iPlayerID) == TEAM_BLUE)
    {

        new rand = random(sizeof(gTeam2RandomPlayerSpawns));
        SetPlayerPos(iPlayerID, gTeam2RandomPlayerSpawns[rand][0], gTeam2RandomPlayerSpawns[rand][1], gTeam2RandomPlayerSpawns[rand][2]); // Warp the player

        SetPlayerSkinEx(iPlayerID, 44);
        SetPlayerTeam(iPlayerID, TEAM_BLUE);

        ColorManager->setPlayerMinigameColor(iPlayerID, COLOR_BLUE);

        GameTextForPlayer(iPlayerID, "~n~~n~Capture the ~g~green teams~y~ vehicle~w~~n~Defend ~b~your teams ~y~vehicle~w~!",5000,5);
        SendClientMessage(iPlayerID, COLOR_PINK, "* Capture the green teams vehicle whilst defending your own!");
    }



    SetPlayerVirtualWorld(iPlayerID, LYSE_VIRTUAL_WORLD);

    SetPlayerInterior(iPlayerID, 0);

    ResetPlayerGunData(iPlayerID);

    GiveWeapon(iPlayerID, 2, 1);
    GiveWeapon(iPlayerID, 23, 40);
    GiveWeapon(iPlayerID, 32, 300);
    GiveWeapon(iPlayerID, 31, 400);
    GiveWeapon(iPlayerID, 34, 20);
    GiveWeapon(iPlayerID, WEAPON_SHOTGUN, 40);

    SetPlayerArmour(iPlayerID, 0);
    SetPlayerHealth(iPlayerID, 100);

    SetPlayerSkillLevel(iPlayerID, WEAPONSKILL_MICRO_UZI, 0);

    CLyse__SetVehicleParams(iPlayerID);

    SetPlayerMapIcon(iPlayerID, LYSE_BLUETEAM_MAPICON, 2218.0310, 44.8661, 26.2270, 61, 0);
    SetPlayerMapIcon(iPlayerID, LYSE_GREENTEAM_MAPICON, 1324.6581, 235.3336, 19.3017, 62, 0);
}





// CLuse__HandleVehicles
// Creates or destroys depending ont he situation all the vehicles
// for the minigame.

CLyse__HandleVehicles(iStart = 0)
{

    if(iStart == 1)
    {
        new rand = random(sizeof(gTeam1CapCarSpawns)),
            rand2 = random(sizeof(gTeam2CapCarSpawns)),
            currentVehicleId = 0;

        lyseGreenTeamVehicleId = VehicleManager->createVehicle(403,
            gTeam1CapCarSpawns[rand][0],
            gTeam1CapCarSpawns[rand][1],
            gTeam1CapCarSpawns[rand][2],
            gTeam1CapCarSpawns[rand][3], 16, 86); 

        lyseBlueTeamVehicleId = VehicleManager->createVehicle(403,
            gTeam2CapCarSpawns[rand2][0],
            gTeam2CapCarSpawns[rand2][1],
            gTeam2CapCarSpawns[rand2][2],
            gTeam2CapCarSpawns[rand2][3], 53, 79); 

        SetVehicleVirtualWorld(lyseGreenTeamVehicleId, LYSE_VIRTUAL_WORLD);
        SetVehicleVirtualWorld(lyseBlueTeamVehicleId, LYSE_VIRTUAL_WORLD);

        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(429, 1291.5171, 386.0683, 19.3427, 224.2558, 16, 86);

        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(506, 1289.8990, 339.4082, 19.3367,  62.4070, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(506, 1201.0231, 210.6816, 19.6471, 254.7104, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(558, 1283.6090, 194.3443, 19.6934, 140.9890, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(558, 1333.6827, 289.6975, 19.3389, 248.0371, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(559, 1382.8953, 462.3477, 19.9157, 249.8025, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(451, 1351.9758, 474.8747, 19.9638, 160.9584, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(415, 1436.6161, 352.6960, 18.6253, 246.4098, 16, 86);

        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(429, 2479.9863, -21.7586, 26.8191, 357.6076, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(506, 2447.3662,  11.4693, 26.2659, 271.7852, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(506, 2451.3882,  54.4292, 26.7069, 180.9931, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(558, 2480.5303,  72.1693, 26.2643,  87.3403, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(558, 2450.0662,  86.1454, 26.8901, 271.4482, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(559, 2503.5571, 130.6548, 26.2573, 182.5659, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(559, 2528.5684, 129.9435, 26.2665, 180.5040, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(415, 2358.4480, -57.9099, 27.2476, 359.3354, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(576, 2255.1567, -83.8130, 26.3011, 180.7819, 53, 79);

        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(559, 2543.7505, -21.8345, 27.1899, 52.6054, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(560, 2532.9011, -20.9020, 26.9682, 44.2714, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(559, 1237.1293, 216.0368, 19.4196, 67.2298, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(560, 1233.4669, 210.4867, 19.4207, 71.8665, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(451, 2412.3945,  87.1468, 27.0779, 90.2884, 53, 79);

        // middle cars

        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(532, 1983.6481, 192.9661, 30.2435, 118.7291, -1, -1);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(500, 1535.5183, 211.1319, 22.2397, 250.1303, -1, -1);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(599, 1892.3500,  33.9616, 34.8752,   7.7706, -1, -1);

        // quads

        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1291.5033, 343.9851, 19.3353,  63.9255, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1285.4846, 379.3808, 19.3397, 226.8902, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1364.0281, 261.8433, 19.3482,  67.5361, 16, 86);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 2508.0095, 133.3255, 26.4635, 178.1469, 53, 79);
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 2469.3633, 127.8933, 26.2566, 181.8120, 53, 79);


        // Added for Alpha 3 by Jay bubbles and Lith
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(531, 1224.7551,  118.8283, 21.2345, 254.6510,  91, 2); // tractor
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(478, 1402.0662,  360.0186, 19.3901,  69.9131,  66, 1); // walton
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(411, 1807.3704,  392.4548, 18.9142, 179.5940,  64, 1); // inf
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(508, 1683.4110,  140.2098, 31.5386, 157.8976,   1, 1); // journey
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(468, 1621.8171,  123.1184, 29.7777,   6.8596,  53, 53); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(422, 1372.8728,  195.5608, 19.5471, 342.0869, 101, 25); // bobcat
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(471, 1299.6727,  219.2111, 19.0366,  73.8572, 120, 117); // quad
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(466, 1292.3413,  158.4798, 20.2063,  19.2227,  68, 76); // glendale
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(480, 1315.5568,  -55.2020, 35.7262, 227.4632,   2, 2); // comet
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(521, 2284.5681,  149.4487, 26.0293,  90.6842,  36, 0); // fcr-900
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(506, 2231.2310,  162.8419, 27.0560, 178.0759,  76, 76); // supergt
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(487, 2370.5515,  -82.7026, 26.7864,  90.1778,  26, 57); // maverick
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(489, 2299.8164, -120.1591, 27.5206, 181.2141, 112, 120); // rancher
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(400, 2190.2126,  -80.4154, 27.5611, 271.2640,  36, 1); // landstalker
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(506, 2264.5676,   25.2863, 26.1499,   3.3575,   3, 3); // supergt
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(475, 2074.5833,   51.3809, 26.3820, 177.4740,  17, 1); // sabre
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1794.9661,   96.6175, 33.8665, 151.5436,  36, 105); // nrg
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1801.1050,   93.0129, 33.8633, 147.9125,   3, 8); // nrg-
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1798.1479,   94.7963, 33.8698, 147.0983,   6, 25); // nrg-
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(471, 1295.0985,  276.8420, 19.0285, 244.8069, 120, 113); // quad
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(586, 1225.6625,  303.6250, 19.1187, 145.6433,  13, 1); // wayfaraer
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(429, 2358.3455,  180.7541, 26.8778,  89.9905,  14, 14); // banshee
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(421, 2397.1113,  -51.5517, 27.3125, 359.8849,   4, 1); // washington
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(477, 2551.4063,    1.6613, 26.2305,  89.6086,  36, 1); // zr-350
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(478, 2551.6462,   71.3173, 26.4613, 273.3942,  45, 1); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(531, 1902.4556,  174.3331, 37.1148, 340.2135,  36, 2); // Tractor for lyse
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(468, 1643.3628,  246.3021, 19.0783, 239.9357,  46, 46); // sanchez
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(508, 1544.5389,   16.0214, 24.5138, 283.0125,   1, 1); // journey @ lyse
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(477, 1587.8188,   26.3483, 23.9720,  96.1837,  75, 1); // zr-350
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(489, 1507.0327,  128.5112, 31.4395, 206.2202,  14, 123); // rancher
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(466, 1769.4144,  147.1114, 32.1641, 240.4737,  16, 76); // glendale
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(471, 2072.8247,  129.4624, 23.8501, 177.0605, 120, 112); // quad
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(434, 2035.2435,  292.7893, 34.7060, 358.9280,  12, 12); // hotknife
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(478, 2076.6147,  240.8185, 24.0486, 350.1122,  59, 1); // walton
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(455, 1901.4569,  163.5514, 37.5858, 158.9733,  84, 58); // flatbed
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1924.8856,  159.5040, 39.6783, 337.0789,   3, 3); // NRG-600
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(543, 1444.1188,  143.9858, 21.7834, 124.3484,  32, 8); // sadler
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(408, 1391.9087,  384.0142, 20.3043, 246.2699,  26, 26); // trash
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(412, 1593.6096,  321.8419, 20.8362, 220.7075,  10, 8); // voodoo
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522, 1705.4441,  426.7897, 18.4710, 265.4480,   7, 79); // NRG-500
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(521, 2361.8032,  323.7202, 22.8073, 174.0801,  92, 3); // fcr-900
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(483, 2603.4443,  210.0128, 58.8965, 214.9773,   1, 31); // camper
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(561, 2281.3918,  -51.4840, 26.8279,   4.4924,   8, 17); // stratum
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(531, 1271.3165,  417.6219, 19.1158, 197.7257,  51, 53); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(422, 1291.9508,  344.8536, 19.5529,  62.1832,  97, 25); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(541, 1258.9242,  343.3805, 19.0351, 242.2203,  13, 8); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(463, 1265.2191,  360.9463, 19.0849, 251.2709,  36, 36); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(471, 1264.0343,  307.9445, 19.2352, 156.1274, 120, 114); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(407, 1340.4425,  372.0690, 19.6523, 336.3846,   3, 1); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(422, 1308.1616,  375.8160, 19.3945, 249.6212, 111, 31); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(532, 1396.8147,  185.1656, 20.7319, 242.1335,   0, 0); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(463, 1289.1538,  361.3119, 18.9454, 156.3653,  53, 53); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(483, 1365.0160,  375.4034, 19.6350, 247.2870,   1, 31); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(587, 1317.4611,  372.2577, 19.1364, 246.3013,  40, 1); // euros
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(468, 1277.9640,  172.7834, 19.7026,  60.2551,  53, 53); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(468, 1282.7914,  182.3565, 19.7222,  62.3915,   3,  3); //
        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(471, 1297.3217,  216.1593, 19.0358,  72.3726,  74, 83); //

        lyseSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(522,2476.6206,53.3900,26.3040,94.0562,53,79, -1);

        // Make sure that we haven't spawned too much vehicles.
        if (currentVehicleId != LYSE_VEHICLE_COUNT) {
             printf("WARNING: Too much vehicles have been spawned for the LYSE minigame.");
        }

        // Vehicles created. Time for the 3D Text labels.

        new
            Float:fPosX,
            Float:fPosY,
            Float:fPosZ;

        GetVehiclePos(lyseBlueTeamVehicleId, fPosX, fPosY, fPosZ);
        iLyseObjectiveBlue = Create3DTextLabel("Blue team", COLOR_BLUE, fPosX, fPosY, fPosZ, 30.0, LYSE_VIRTUAL_WORLD);
        Attach3DTextLabelToVehicle(iLyseObjectiveBlue, lyseBlueTeamVehicleId, 0, 0, 3);


        GetVehiclePos(lyseGreenTeamVehicleId, fPosX, fPosY, fPosZ);
        iLyseObjectiveGreen = Create3DTextLabel("Green team", COLOR_GREEN, fPosX, fPosY, fPosZ, 30.0, LYSE_VIRTUAL_WORLD);
        Attach3DTextLabelToVehicle(iLyseObjectiveGreen, lyseGreenTeamVehicleId, 0, 0, 3);



        // Put them in there vworld and we're done here.
        for(new vehicleIndex = 0; vehicleIndex < LYSE_VEHICLE_COUNT; ++vehicleIndex)
            SetVehicleVirtualWorld(lyseSpawnedVehicles[vehicleIndex], LYSE_VIRTUAL_WORLD);
    }
    else
    {
        // Before we destroy the vehicles check they're valid.
        for (new vehicleIndex = 0; vehicleIndex < LYSE_VEHICLE_COUNT; ++vehicleIndex) {
            if (lyseSpawnedVehicles[vehicleIndex] == Vehicle::InvalidId)
                continue;

            VehicleManager->destroyVehicle(lyseSpawnedVehicles[vehicleIndex]);
            lyseSpawnedVehicles[vehicleIndex] = Vehicle::InvalidId;
        }

        if (lyseGreenTeamVehicleId != Vehicle::InvalidId)
            VehicleManager->destroyVehicle(lyseGreenTeamVehicleId);
        if (lyseBlueTeamVehicleId != Vehicle::InvalidId)
            VehicleManager->destroyVehicle(lyseBlueTeamVehicleId);

        lyseGreenTeamVehicleId = Vehicle::InvalidId;
        lyseBlueTeamVehicleId = Vehicle::InvalidId;
    }
    return 1;
}


// CLyse__Initalize
// Called from OnGameModeInit, set's some data and creates the textdraw.
CLyse__Initialize()
{
    new szTextString[128];

    format(szTextString, 128, "~b~Blue team: %d~n~~n~~g~Green team: %d",iTeamCaptures[TEAM_BLUE], iTeamCaptures[TEAM_GREEN]);

    LyseTextdraw = TextDrawCreate(501, 100, szTextString);

    TextDrawAlignment(LyseTextdraw, 0);
    TextDrawBackgroundColor(LyseTextdraw, 0x000000ff);
    TextDrawFont(LyseTextdraw, 1);
    TextDrawLetterSize(LyseTextdraw ,0.399999,1.200000);
    TextDrawColor(LyseTextdraw, 0xffffffff);
    TextDrawSetOutline(LyseTextdraw, 1);
    TextDrawSetProportional(LyseTextdraw, 1);
    TextDrawSetShadow(LyseTextdraw, 1);


    for(new i; i < sizeof(LyseObjectiveTextdraw); i++)
    {
        LyseObjectiveTextdraw[i] = TextDrawCreate(164,416,"_");
        TextDrawAlignment(LyseObjectiveTextdraw[i], 0);
        TextDrawBackgroundColor(LyseObjectiveTextdraw[i], 0x000000ff);
        TextDrawFont(LyseObjectiveTextdraw[i], 1);
        TextDrawLetterSize(LyseObjectiveTextdraw[i], 0.599999, 1.900000);
        TextDrawColor(LyseObjectiveTextdraw[i], 0xffffffff);
        TextDrawSetOutline(LyseObjectiveTextdraw[i], 1);
        TextDrawSetProportional(LyseObjectiveTextdraw[i], 1);
        TextDrawSetShadow(LyseObjectiveTextdraw[i], 1);
    }

    TextDrawSetString(LyseObjectiveTextdraw[0], "Drive to the ~g~Green teams~w~ base, West!");
    TextDrawSetString(LyseObjectiveTextdraw[1], "Drive to the ~b~Blue teams~w~ base, East!");

    TextDrawSetString(LyseObjectiveTextdraw[2], "Get the ~y~truck~w~ back to your teams base.");

}


// CLyse__UpdateTextdraw
CLyse__UpdateTextdraw()
{
    if(!IsValidText(LyseTextdraw))
    CLyse__Initialize();

    new szTextString[128];
    format(szTextString, 128, "~b~Blue team: %d~n~~n~~g~Green team: %d",iTeamCaptures[TEAM_BLUE], iTeamCaptures[TEAM_GREEN]);
    TextDrawSetString(LyseTextdraw, szTextString);


    for (new playerid = 0; playerid <= PlayerManager->highestPlayerId(); playerid++)
    {
        if(CLyse__GetPlayerState(playerid) == LYSE_STATE_RUNNING)
        {
            TextDrawShowForPlayer(playerid, LyseTextdraw);
        }else{
            TextDrawHideForPlayer(playerid, LyseTextdraw);
        }


        TextDrawHideForPlayer(playerid, LyseObjectiveTextdraw[0]);
        TextDrawHideForPlayer(playerid, LyseObjectiveTextdraw[1]);
        TextDrawHideForPlayer(playerid, LyseObjectiveTextdraw[2]);

        new iphase = CLyse__GetTextdrawPhase(playerid);
        switch(iphase)
        {
        case TEXTDRAW_PHASE_BASE:
            {
                if(CLyse__GetPlayerTeam(playerid) == TEAM_BLUE)
                TextDrawShowForPlayer(playerid, LyseObjectiveTextdraw[0]);
                else
                TextDrawShowForPlayer(playerid, LyseObjectiveTextdraw[1]);

            }

        case TEXTDRAW_PHASE_TRUCK:
            {
                TextDrawShowForPlayer(playerid, LyseObjectiveTextdraw[2]);
            }
        }
    }

    if(CLyse__GetState() == LYSE_STATE_NONE)
    TextDrawHideForAll(LyseTextdraw);

}



// CLyse__Checkpoint
// This is called from OnPlayerEnterCheckpoint and handles teh shit
CLyse__Checkpoint(playerid)
{

    new iVehicle = GetPlayerVehicleID(playerid);

    new str[128];

    if(CLyse__GetPlayerTeam(playerid) == TEAM_GREEN)
    {
        format(str,128,"* %s has captured the blue team's vehicle!",PlayerName(playerid));
        CLyse__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);

        format(str,128,"* %s has captured one of your teams vehicle!",PlayerName(playerid));
        CLyse__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);

        iTeamCaptures[TEAM_GREEN]++;

        CLyse__UpdateTextdraw();

        SetVehicleToRespawn(iVehicle);

        DisablePlayerCheckpoint(playerid);

        if(iTeamCaptures[TEAM_GREEN] == LYSE_CAPS_TO_WIN)
        {
            format(str, sizeof(str), "~y~Local Yocal Sports Edition~w~ has finished: ~g~~h~Green Team~w~ have won!");
            NewsController->show(str);
            CLyse__End();
            return;
        }
    }

    else if(CLyse__GetPlayerTeam(playerid) == TEAM_BLUE)
    {   
        format(str,256,"* %s has captured the green team's vehicle!",PlayerName(playerid));
        CLyse__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);

        format(str,256,"* %s has captured one of your teams vehicle!",PlayerName(playerid));
        CLyse__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);

        iTeamCaptures[TEAM_BLUE] ++;

        CLyse__UpdateTextdraw();

        SetVehicleToRespawn(iVehicle);

        DisablePlayerCheckpoint(playerid);

        if(iTeamCaptures[TEAM_BLUE] == LYSE_CAPS_TO_WIN)
        {
            format(str, sizeof(str), "~y~Local Yocal Sports Edition~w~ has finished: ~b~~h~Blue Team~w~ have won!");
            NewsController->show(str);
            CLyse__End();
            return;
        }

    }

}


// CLyse__StateUpdate
// Called from OnPlayerStateChange
CLyse__StateUpdate(playerid,newstate)
{

    if(CLyse__GetPlayerState(playerid) != LYSE_STATE_RUNNING)
    return;

    CLyse__UpdateTextdraw();

    new
    vehicleid,
    str[256];

    if(newstate == PLAYER_STATE_DRIVER)
    {

        vehicleid = GetPlayerVehicleID(playerid);

        if(CLyse__GetPlayerTeam(playerid) == TEAM_GREEN && vehicleid == lyseBlueTeamVehicleId)
        { 

            SetPlayerCheckpoint(playerid,1370.1049,475.6131,19.9169,7.0);

            CLyse__SetObjectivePlayer(TEAM_GREEN, playerid);

            gObjectiveGreenPlayer = playerid;

            format(str,256,"* %s is capturing the blue teams vehicle!",PlayerName(playerid));

            CLyse__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);

            format(str,256,"* %s is capturing your teams vehicle!",PlayerName(playerid));
            CLyse__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);

            GameTextForPlayer(playerid,"~w~Get the vehicle back to your ~n~~r~base!",5000,1);

            SendClientMessage(playerid,COLOR_PINK,"* Get the vehicle back to your base!");

            if(CLyse__GetTextdrawPhase(playerid) != TEXTDRAW_PHASE_COMPLETE)
            CLyse__SetTextdrawPhase(playerid, TEXTDRAW_PHASE_COMPLETE);
            return;
        }

        if(CLyse__GetPlayerTeam(playerid) == TEAM_BLUE && vehicleid == lyseGreenTeamVehicleId)
        { 

            SetPlayerCheckpoint(playerid,2552.1548,14.3830,26.8371,7.0);


            CLyse__SetObjectivePlayer(TEAM_BLUE, playerid);

            GameTextForPlayer(playerid,"~w~Get the vehicle back to your ~n~~r~base!",5000,1);
            SendClientMessage(playerid,COLOR_PINK,"* Get the vehicle back to your base!");

            format(str,256,"* %s is capturing the green vehicle!",PlayerName(playerid));
            CLyse__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);

            format(str,256,"* %s is capturing your teams vehicle!",PlayerName(playerid));
            CLyse__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);

            if(CLyse__GetTextdrawPhase(playerid) != TEXTDRAW_PHASE_COMPLETE)
            CLyse__SetTextdrawPhase(playerid, TEXTDRAW_PHASE_COMPLETE);

            return;
        }
    }
    else if(newstate == PLAYER_STATE_ONFOOT)
    {
        if(CLyse__GetObjectivePlayer(CLyse__GetPlayerTeam(playerid) == playerid))
        {
            CLyse__SetObjectivePlayer(CLyse__GetPlayerTeam(playerid), Player::InvalidId);
            DisablePlayerCheckpoint(playerid);
        }

    }

}

// Called from OnPlayerText, checks for team chat.
CLyse__OnText(playerid, text[])
{
    if(CLyse__GetPlayerState(playerid) != LYSE_STATE_RUNNING)
    return 0;


    if(!strcmp(text[0], "!", true, 1))
    {
        new szTeamMsg[128];

        if(CLyse__GetPlayerTeam(playerid) == TEAM_GREEN)
        {
            format(szTeamMsg, 128, "%s: %s", PlayerName(playerid),  text[1]);
            CLyse__TeamMsg(TEAM_GREEN, COLOR_GREEN, szTeamMsg);
            return 1;
        }

        format(szTeamMsg, 128, "%s: %s", PlayerName(playerid),  text[1]);
        CLyse__TeamMsg(TEAM_BLUE, COLOR_LIGHTBLUE, szTeamMsg);
        return 1;
    }
    return 0;
}


// CLyse__TeamMsg
// Show a msg to a team
CLyse__TeamMsg(iLyseTeam, iLyseColor, szMsg[])
{

    if(iLyseTeam < 0 || iLyseTeam > TEAM_GREEN)
    return;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
        continue;

        if(CLyse__GetPlayerState(i) != LYSE_STATE_RUNNING)
        continue;

        if(CLyse__GetPlayerTeam(i) != iLyseTeam)
        continue;

        SendClientMessage(i, iLyseColor, szMsg);
    }
}


// CLyse__MenuActivate
// Called from OnPlayerSelectedMenuRow, when a player selectes LYSE from the
// minigame menu.
CLyse__MenuActivate(playerid)
{
    return CLyse__OnCommand(playerid);
}

CLyse__OnCommand(playerid){ 
    if(!IsPlayerMinigameFree(playerid))
    {
        ShowBoxForPlayer(playerid, "You're already signed up with a different minigame.");
        return 1;
    }

    if(CLyse__GetState() == LYSE_STATE_RUNNING)
    {
        ShowBoxForPlayer(playerid, "Lyse is already in progress. Try again later.");
        return 1;
    }

    new const price = GetEconomyValue(LyseSignUpCost);

    if(GetPlayerMoney(playerid) < price)
    {
        new message[128];
        format(message, sizeof(message), "You need $%s to sign up for Lyse.", formatPrice(price));
        ShowBoxForPlayer(playerid, message);
        return 1;
    }

    if(CLyse__GetState() == LYSE_STATE_NONE)
    {
        iLyseStartTime = Time->currentTime();
        CLyse__SetState(LYSE_STATE_SIGNUP);
        Announcements->announceMinigameSignup(LocalYocalSportsEditionMinigame,
            "Local Yocal Sports Edition", "/lyse", 250, playerid);
        GameTextForAllEx("~y~Local Yocal Sports Edition~w~ is now signing up!~n~Want to join? ~r~/lyse~w~!", 5000, 5);
    }

    TakeRegulatedMoney(playerid, LyseSignUpCost);
    CLyse__SignPlayerUp(playerid);

    new str[128];
    Responses->respondMinigameSignedUp(playerid, LocalYocalSportsEditionMinigame, "Local Yocal Sports Edition", 20);
    format(str, sizeof(str), "~r~~h~%s~w~ has signed up for ~y~Local Yocal Sports Edition~w~ (~p~/lyse~w~)", Player(playerid)->nicknameString());
    NewsController->show(str);

    format(str, 128, "%s (Id:%d) has signed up for /lyse.",PlayerName(playerid), playerid);
    Admin(playerid, str);

    return 1;
}