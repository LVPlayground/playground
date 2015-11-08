// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define map_create(%1)                                  forward CreateMap__%1(); public CreateMap__%1()
#define map_set_id(%1)                                  new nMapID = %1
#define map_set_name(%1)                                SetMapZoneName(nMapID, %1)
#define map_set_spawn(%1,%2,%3,%4)                      SetMapZoneSpawn(nMapID, %1, %2, %3, %4)
#define map_set_checkpoint(%1,%2,%3)                    SetMapZoneCheckpoint(nMapID, %1, %2, %3)
#define map_enable_bunnytrack()                         ToggleMapZoneBunnyTrack(nMapID)
#define map_set_max_players(%1)                         SetMapZoneMaxPlayers(nMapID, %1)
#define map_add_object(%1,%2,%3,%4,%5,%6,%7)            AddMapZoneObject(nMapID, %1, %2, %3, %4, %5, %6, %7)
#define map_add_vehicle(%1,%2,%3,%4,%5,%6,%7,%8)        AddMapVehicle(nMapID, %1, %2, %3, %4, %5, %6, %7, %8)
#define map_add_race_checkpoint(%1,%2,%3)               AddMapZoneCheckpoint(nMapID, %1, %2, %3)
#define map_add_checkpoint(%1,%2,%3)                    AddMapZoneCheckpoint(nMapID, %1, %2, %3)

#define MAX_MAP_AREAS           50              // The max amount of map areas supported. Increase when adding more!
#define MAX_MAP_MODELS          100             //  How many object models per map? Increase when adding more.
#define MAX_MAP_MOVE_OBJECTS    10              // How many objects can be moveable in a map, max? (increase when adding more!)
#define MAP_WORLD_ID                300         // Standard world id
#define MAX_MAP_RACE_CHECKPOINTS    20          // Maximum number of race checkpoints for a map
#define MAP_RACE_COUNTDOWN_START    60          // How many seconds until the map zone race starts. Its 10 just for testing for quickness, but should be 60
#define MAX_MAP_VEHICLES        60

enum mapinfoenum
{
    Map_Name[256],                      // The map's name
    Vehicle_Id[MAX_MAP_VEHICLES],
    Map_MaxPlayers,                     // Max amount of players the map can hold
    Map_Created,                        // Determines if the map exists
    Float:Map_x,                        // the x co-ord for the teleport
    Float:Map_y,                        // The y co-ord for the teleport
    Float:Map_z,                        // the z co-ord for the teleport
    Float:Map_cpX,                      // the x co-ords for the end checkpoint
    Float:Map_cpY,                      // the y co-ord for the end checkpoint
    Float:Map_cpZ,                      // the z co-ord for the end checkpoint
    Map_CPActive,                       // Is the map checkpoint active?
    Float:Map_Ang,                      // The angle of the players teleport pos
    Map_Bunnytrack,                     // Is the map a bunnytrack?
    Map_Object_Models[MAX_MAP_MODELS],  // Stores each object model for a map
    Map_Model_Count,                    // How many models are used in this map?
    Map_World_ID,                        // WorldID
    Text:tMapZoneDisplay,                // Textdraw ID for the textdraw displays associated with each map zone

    // Map race variables
    Map_Race_Cp_Count,                                  // Number of checkpoints associated with a map race
    Map_Race_Players_Finished,                          // Stores the number of players that have finished for calculating the position
    Float:Map_Race_Cp_X[MAX_MAP_RACE_CHECKPOINTS],      // X pos of each map zone checkpoint
    Float:Map_Race_Cp_Y[MAX_MAP_RACE_CHECKPOINTS],      // Y
    Float:Map_Race_Cp_Z[MAX_MAP_RACE_CHECKPOINTS],      // Z
    Map_Race_Countdown,                               // Stores current number of remaining countdown seconds for a map zone race
    DynamicRaceCP: Map_Race_Primary_CP,               // Store the ID of the primary checkpoint ID too ofc
    Map_Player_In_Race[MAX_PLAYERS],                           // Bool to determine if a player is in a race
    Map_Player_CP_Count[MAX_PLAYERS],                          // Number of checkpoints a player has.
    Text:Map_Player_Display_Pos[MAX_PLAYERS],                      // Pos textdraw
    Text:Map_Player_Display_Pos_Ordinal[MAX_PLAYERS],              // Ordinal for the pos textdraw (eg st th rd)
    Text:Map_Player_Display_Checkpoint[MAX_PLAYERS]                // Display for the number of checkpoints the player has passed
};

new     Map_Zone[MAX_MAP_AREAS][mapinfoenum];   // The var for the enum
new     g_MapCount;                                 // Determines how many maps are loaded.
new     g_MapPlayerCount[MAX_MAP_AREAS];        // Determines how many players are at the mapped area.
static  g_MapSeconds[MAX_PLAYERS];                    // Determines how long a player was in a map.
new     Float:g_PlayerPos[MAX_PLAYERS][3];            // Saves the previous pos the player was in.
new     g_MapZone[MAX_PLAYERS] = {-1, ...};                           // The id of the map zone the player is in.
new     g_HSpeedCount[MAX_PLAYERS];                       // The count for the amount of high speed bonuses in 1 jump.
new     g_MapTP[MAX_PLAYERS];                             // How long ago did the player use the /map command?
new m_playerVehicleId[MAX_PLAYERS] = {Vehicle::InvalidId, ...};
static Float:fPlayerMapHealth[MAX_PLAYERS];           // Stores the players vehicle health before they goto a map zone.

InitializeMapZoneTextDrawsForPlayer(playerId) {
    for (new areaId = 0; areaId < MAX_MAP_AREAS; ++areaId) {
        Map_Zone[areaId][Map_Player_Display_Pos][playerId] = Text: INVALID_TEXT_DRAW;
        Map_Zone[areaId][Map_Player_Display_Pos_Ordinal][playerId] = Text: INVALID_TEXT_DRAW;
        Map_Zone[areaId][Map_Player_Display_Checkpoint][playerId] = Text: INVALID_TEXT_DRAW;
    }
}

// AddMapZoneCheckpoint - Add a race checkpoint to the current map zone
// which allows users to progress in the map zone race.
AddMapZoneCheckpoint(n_MapID, Float:fPosX, Float:fPosY, Float:fPosZ)
{
    if(n_MapID < 0 || n_MapID > MAX_MAP_AREAS)
    {
        printf("[Map Zones] ERROR: Unable to add street race checkpoint to map zone %d - INVALID MAP ZONE ID.", n_MapID);
        return;
    }

    // Check to see if we've breached limits
    if(GetNumberOfMapZoneCheckpoints(n_MapID) >= MAX_MAP_RACE_CHECKPOINTS)
    {
        printf("[Map Zones] ERROR: Unable to add mapzone streetrace checkpoint to map zone %d at pos %f, %f, %f - Map zone exceeds maximum number of checkpoints.", n_MapID, fPosX, fPosY, fPosZ);
        return;
    }

    new iCheckpointID = Map_Zone[n_MapID][Map_Race_Cp_Count];

    // Format the checkpoint position data so we can retrieve it later
    Map_Zone[n_MapID][Map_Race_Cp_X][iCheckpointID] = fPosX;
    Map_Zone[n_MapID][Map_Race_Cp_Y][iCheckpointID] = fPosY;
    Map_Zone[n_MapID][Map_Race_Cp_Z][iCheckpointID] = fPosZ;

    Map_Zone[n_MapID][Map_Race_Cp_Count] ++;

    // If this is the primary checkpoint we'll add a race map icon here as well as create
    // a streamed checkpoint at the location for starting the race.
    if(iCheckpointID == 0)
    {
        new n_WorldID = n_MapID + 1000;
        Map_Zone[n_MapID][Map_Race_Primary_CP] = CreateDynamicRaceCP(1, fPosX, fPosY, fPosZ, 0, 0, 0, 20.0, n_WorldID, 0);
        CreateDynamicMapIcon(fPosX, fPosY, fPosZ, 53, 0, n_WorldID, 0);
    }

}

// Return the current number of checkpoints used in a map zone.
GetNumberOfMapZoneCheckpoints(n_MapID)
{
    if(n_MapID < 0 || n_MapID > MAX_MAP_AREAS)
    {
        return 0;
    }

    return Map_Zone[n_MapID][Map_Race_Cp_Count];
}


// Returns 1 if a map zone has an associated race otherwise 0
IsMapZoneRaceEnabled(n_MapID)
{
    if(n_MapID < 0 || n_MapID > g_MapCount)
    {
        return 0;
    }

    if(GetNumberOfMapZoneCheckpoints(n_MapID) > 0)
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

// This function returns the position the player is in
// during the course of the map zone race. It calculates the position based
// on the amount of checkpoints the player has passed. If it's the same as another player
// it will base it on the distance to the finish line.
GetPlayerMapZoneRaceRank(playerid, iMapID)
{
    new iPosition = 1;
    new iPlayerMapID;

    // Increase the position based on the number of players that have already finished.
    iPosition += Map_Zone[iMapID][Map_Race_Players_Finished];

    if(iMapID < 0 || iMapID > g_MapCount)
    {
        return iPosition;
    }

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected() || IsPlayerNPC(i))
        {
            continue;
        }

        if(playerid == i)
        {
            continue;
        }

        iPlayerMapID = GetPlayerMapZone(i);

        if(iPlayerMapID != iMapID)
        {
            continue;
        }

        // Now then, we'll calculate the position based on the amount of checkpoints
        // the player has passed.
        if(Map_Zone[iMapID][Map_Player_CP_Count][i] > Map_Zone[iMapID][Map_Player_CP_Count][playerid])
        {
            iPosition++;
        }
    }

    return iPosition;
}

// This function is called every second and updates the position as well as the
// checkpoint textdraw
UpdateMapZoneRaceDisplay(playerid, iMapID)
{
    new szDisplay[128];
    new iPlayerRank = GetPlayerMapZoneRaceRank(playerid, iMapID);

    // Alright first of all update the position the player is in
    if (Map_Zone[iMapID][Map_Player_Display_Pos][playerid] != Text: INVALID_TEXT_DRAW) {
        format(szDisplay, sizeof(szDisplay), "%d", iPlayerRank);
        TextDrawSetString(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], szDisplay);
    }

    // Now update the ordinal to go with it
    if (Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid] != Text: INVALID_TEXT_DRAW) {
        ordinal(szDisplay, sizeof(szDisplay), iPlayerRank);
        TextDrawSetString(  Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], szDisplay[1]);
    }

    /// Finally the checkpoint count and we can write this off as done :>
    if (Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid] != Text: INVALID_TEXT_DRAW) {
        format(szDisplay, sizeof(szDisplay), "~y~CP %d/%d", Map_Zone[iMapID][Map_Player_CP_Count][playerid], GetNumberOfMapZoneCheckpoints(iMapID));
        TextDrawSetString(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid], szDisplay);
    }
}

// Create all the textdraws for the map race
// Called when the race starts for the player
InitializePlayerMapRaceTextdraws(playerid, iMapID)
{
    // Position display
    Map_Zone[iMapID][Map_Player_Display_Pos][playerid] = TextDrawCreate(563, 364, "1");
    TextDrawBackgroundColor(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], 255);
    TextDrawFont(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], 3);
    TextDrawLetterSize(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], 0.820000, 5.400001);
    TextDrawColor(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], -1);
    TextDrawSetOutline(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], 0);
    TextDrawSetProportional(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], 1);
    TextDrawSetShadow(Map_Zone[iMapID][Map_Player_Display_Pos][playerid], 1);

    // Ordinal display
    Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid] = TextDrawCreate(580.000000, 391.000000, "_");
    TextDrawBackgroundColor(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], 255);
    TextDrawFont(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], 1);
    TextDrawLetterSize(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], 0.500000, 1.800000);
    TextDrawColor(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], -1);
    TextDrawSetOutline(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], 0);
    TextDrawSetProportional(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], 1);
    TextDrawSetShadow(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid], 1);

    // Checkpoint display
    Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid] = TextDrawCreate(564.000000, 354.000000, "Loading...");
    TextDrawBackgroundColor(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid], 255);
    TextDrawFont(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid], 2);
    TextDrawLetterSize(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid], 0.320000, 1.300000);
    TextDrawColor(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid], -1);
    TextDrawSetOutline(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid], 1);
    TextDrawSetProportional(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid], 1);

    // Show them all
    TextDrawShowForPlayer(playerid, Map_Zone[iMapID][Map_Player_Display_Pos][playerid]);
    TextDrawShowForPlayer(playerid, Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid]);
    TextDrawShowForPlayer(playerid, Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid]);
}

// Destroy all associated textdraw displays for a map race
// Called when the player finishes the map race
DestroyPlayerMapRaceTextdraws(playerid, iMapID)
{
    TextDrawDestroy(Map_Zone[iMapID][Map_Player_Display_Pos][playerid]);
    TextDrawDestroy(Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid]);
    TextDrawDestroy(Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid]);

    Map_Zone[iMapID][Map_Player_Display_Pos][playerid] = Text:INVALID_TEXT_DRAW;
    Map_Zone[iMapID][Map_Player_Display_Pos_Ordinal][playerid] = Text:INVALID_TEXT_DRAW;
    Map_Zone[iMapID][Map_Player_Display_Checkpoint][playerid] = Text:INVALID_TEXT_DRAW;
}

// Returns 1 if a player is in any map zone race otherwise 0.
IsPlayerInAnyMapZoneRace(playerid)
{
    return GetPVarInt(playerid, "iPlayerInAnyMapZoneRace");
}

// Returns 1 if a map zone race is in progress otherwise 0.
IsMapZoneRaceInProgress(iMapID)
{
    // Is the primary checkpoint is valid then it can't be in progress.
    if(IsValidDynamicRaceCP(Map_Zone[iMapID][Map_Race_Primary_CP]))
        return 0;
    else
        return 1;
}

// returns 1 if a map zone race is in the countdown phase otherwise 0
IsMapZoneRaceInCountdownPhase(iMapID)
{
    if(Map_Zone[iMapID][Map_Race_Countdown] == -1)
        return 0;
    else
        return 1;
}

// This function is called when a player enters the primary map zone
// checkpoint. It prompts them to initially start the race.
OnPlayerEnterPrimaryMapZoneCheckpoint(playerid, iMapID)
{
    // Player is already in a race, no need to send a msg.
    if(IsPlayerInAnyMapZoneRace(playerid))
        return;

    new szDisplayMsg[128];

    // Alright a player has entered the primary checkpoint.
    // First of all just check to see if we just need to add them to the race
    // incase it's in the "signup" phase

    // UPDATE: We now automatically enter them into the race if its in a countdown phase woei \o/
    if(IsMapZoneRaceInCountdownPhase(iMapID))
    {
        Map_Zone[iMapID][Map_Player_In_Race][playerid] = 1;
        SetPVarInt(playerid, "iPlayerInAnyMapZoneRace", 1);

        format(szDisplayMsg, sizeof(szDisplayMsg), "~y~%s Map Race:~n~~w~Checkpoints: %d~n~ Starting in %d seconds.", Map_Zone[iMapID][Map_Name], GetNumberOfMapZoneCheckpoints(iMapID), Map_Zone[iMapID][Map_Race_Countdown]);
        ShowBoxForPlayer(playerid, szDisplayMsg);
        GameTextForPlayer(playerid, szDisplayMsg, 5000, 6);
    }
    else    // Prompt them to start the race.
    {
        format(szDisplayMsg, sizeof(szDisplayMsg), "~y~%s Map Race:~n~~w~Checkpoints: %d~n~/race to start!", Map_Zone[iMapID][Map_Name], GetNumberOfMapZoneCheckpoints(iMapID));
        ShowBoxForPlayer(playerid, szDisplayMsg);
        GameTextForPlayer(playerid, szDisplayMsg, 5000, 6);
    }
}

// This function is called from OnPlayerEnterDynamicRaceCheckpoint
// and checks for when a player enters the first initial race checkpoint.
// When they do, we prompt for them to start the race.
CheckMapZoneDynamicCheckpoint(playerid, DynamicRaceCP: checkpointid)
{
    for(new iMapID = 0; iMapID < g_MapCount; iMapID++)
    {
        if(!IsMapZoneRaceEnabled(iMapID))
            continue;

        if(checkpointid == Map_Zone[iMapID][Map_Race_Primary_CP])
        {
            OnPlayerEnterPrimaryMapZoneCheckpoint(playerid, iMapID);
            break;
        }
    }
}

// This is called when a player enters a race checkpoint during
// a map zone race
CheckMapZoneRaceCheckpoint(playerid, iMapID)
{
    // If the race is in progress it could be the dynamic race checkpoint so we don't process.
    if(!IsMapZoneRaceInProgress(iMapID))
        return;

    // Just make doubely sure that the player is defintely not in the dynamic
    // race checkpoint
    if(IsPlayerInDynamicRaceCP(playerid, Map_Zone[iMapID][Map_Race_Primary_CP]))
        return;

    // Alright the player is in the race. Just process the next race checkpoint
    // and we're done here for now.
    ShowMapZoneCheckpointForPlayer(playerid, iMapID);
}

#if Feature::DisableRaces == 0

// This function is called when a player types the /race command
// And handles starting or joining of the race
CheckMapZoneRaceCmd(playerid)
{
    if(!IsPlayerInMapZone(playerid))
        return 0;

    new iMapID = GetPlayerMapZone(playerid);

    // Does the map zone have any associated races with it?
    if(!IsMapZoneRaceEnabled(iMapID))
        return 0;
    /*

    // Is the player in the start checkpoint?
    UPDATE: THIS FAILS. POSSIBLY AN ISSUE IN THE STREAMER... LOOK INTO IT!
    FOR NOW WE'LL JUST CHECK IF THEY'RE IN ANY RACE CP
    if(!IsPlayerInDynamicRaceCP(playerid, Map_Zone[iMapID][Map_Race_Primary_CP]))
    {
        ShowBoxForPlayer(playerid, "You need to enter the ~r~checkpoint~w~ before starting a map zone race.");
        return 1;
    }*/

    if(!IsPlayerInRaceCheckpoint(playerid))
    {
        ShowBoxForPlayer(playerid, "You need to enter the ~r~checkpoint~w~ before starting a map zone race.");
        return 1;
    }

    // The player is already in this race. Do nothing and return 1 so the
    // rest of the /race command doesn't process.
    if(Map_Zone[iMapID][Map_Player_In_Race][playerid] == 1)
        return 1;

    // Whoow. we're still here. The player is genuinely in the checkpoint and has typed /race. Nice

    new minigame[128], command[12];
    format(minigame, sizeof(minigame), "%s jump", Map_Zone[iMapID][Map_Name]);
    format(command, sizeof(command), "/jump %d", iMapID);

    // Alright the player is wishing to join the race
    if(IsMapZoneRaceInCountdownPhase(iMapID))
    {
        Responses->respondMinigameSignedUp(playerid, RaceMinigame, minigame, MAP_RACE_COUNTDOWN_START);

        new message[128];
        format(message, sizeof(message), "~r~~h~%s~w~ has signed up for ~y~%s race~w~ (~p~%s~w~)",
            Player(playerid)->nicknameString(), minigame, command);
        NewsController->show(message);

        Map_Zone[iMapID][Map_Player_In_Race][playerid] = 1;
        SetPVarInt(playerid, "iPlayerInAnyMapZoneRace", 1);
    }
    else
    {
        new gameText[128];
        format(gameText, sizeof(gameText), "~y~%s race~w~ is now signing up!~n~Want to join? ~r~%s~w~!", minigame, command);
        GameTextForAllEx(gameText, 5000, 5);

        Announcements->announceMinigameSignup(RaceMinigame, minigame, command, 0, playerid);
        Responses->respondMinigameSignedUp(playerid, RaceMinigame, minigame, MAP_RACE_COUNTDOWN_START);

        new message[128];
        format(message, sizeof(message), "~r~~h~%s~w~ has signed up for ~y~%s race~w~ (~p~%s~w~)",
            Player(playerid)->nicknameString(), minigame, command);
        NewsController->show(message);

        Map_Zone[iMapID][Map_Race_Countdown] = MAP_RACE_COUNTDOWN_START;
        Map_Zone[iMapID][Map_Player_In_Race][playerid] = 1;
        SetPVarInt(playerid, "iPlayerInAnyMapZoneRace", 1);
    }
    return 1;
}

#endif

// This is called every second and repairs every players vehicle that is currently in a map zone
ProcessMapZoneVehicleRepair(playerid)
{
    if(IsPlayerInMapZone(playerid))
    {
        if(IsPlayerInAnyVehicle(playerid))
            SetVehicleHealth(GetPlayerVehicleID(playerid), 1000);
    }
}

// This is called every second from the main timer
// and accordingly process' all map zone races
ProcessMapZoneRaces()
{
    for(new iMapID = 0; iMapID < g_MapCount; iMapID++)
    {
        if(!IsMapZoneRaceEnabled(iMapID))
            continue;

        // If the race is running update each players individual textdraw
        if(IsMapZoneRaceInProgress(iMapID))
        {
            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(!Player(i)->isConnected() || IsPlayerNPC(i))
                    continue;

                // Is this player taking part in the map zone race?
                if(Map_Zone[iMapID][Map_Player_In_Race][i] == 0)
                    continue;

                UpdateMapZoneRaceDisplay(i, iMapID);
            }
        }

        if(IsMapZoneRaceInCountdownPhase(iMapID)) // Ok, the race is in the countdown phase. We process the countdown!
        {
            new szGameMsg[128];

            if(Map_Zone[iMapID][Map_Race_Countdown] > 10)
            {
                format(szGameMsg, 128, "%s jump race~n~Starting in %d", Map_Zone[iMapID][Map_Name], Map_Zone[iMapID][Map_Race_Countdown]);
            }
            else if (Map_Zone[iMapID][Map_Race_Countdown] > 0 && Map_Zone[iMapID][Map_Race_Countdown] <= 10)
            {
                if (Map_Zone[iMapID][Map_Race_Countdown] > 0 && Map_Zone[iMapID][Map_Race_Countdown] <= 3)
                {
                    format(szGameMsg, 128, "~r~%d", Map_Zone[iMapID][Map_Race_Countdown]);
                }
                else
                {
                    format(szGameMsg, 128, "%d", Map_Zone[iMapID][Map_Race_Countdown]);
                }
            }
            else if (Map_Zone[iMapID][Map_Race_Countdown] == 0)
            {
                // Start the race! woo
                format(szGameMsg, 128, "~g~GO!");
                DestroyDynamicRaceCP(Map_Zone[iMapID][Map_Race_Primary_CP]);
                Map_Zone[iMapID][Map_Race_Primary_CP] = DynamicRaceCP: -1;
            }

            // Alright show the game text msg for all players.
            // We may also need to start the race and show the appropriate checkpoint.
            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(!Player(i)->isConnected() || IsPlayerNPC(i))
                {
                    continue;
                }

                // Is this player taking part in the map zone race?
                if(Map_Zone[iMapID][Map_Player_In_Race][i] == 0)
                {
                    continue;
                }

                GameTextForPlayer(i, szGameMsg, 1000, 6);

                // Start the race!
                if(Map_Zone[iMapID][Map_Race_Countdown] == 0)
                {
                    PlayerPlaySound(i, 3200, 0, 0, 0);
                    ShowMapZoneCheckpointForPlayer(i, iMapID);
                    InitializePlayerMapRaceTextdraws(i, iMapID);
                }
            }
            // right now update the vars containing the number of remaining seconds

             // if it's 0 set the flag to -1 so we no this race is no longer in the countdown phase
            // used in IsRaceInCountdownPhase
            if( Map_Zone[iMapID][Map_Race_Countdown] == 0)
            {
                Map_Zone[iMapID][Map_Race_Countdown] = -1;
            }
            else
            {
                Map_Zone[iMapID][Map_Race_Countdown] --;
            }
        }
    }
}

// This function shows the next appropriate map zone checkpoint for the player.
ShowMapZoneCheckpointForPlayer(playerid, iMapID)
{
    // Just check the map zone ID is valid
    if(iMapID < 0 || iMapID > g_MapCount)
        return;

    // Whow whow just check the player is valid too. Never can be to careful!
    if(!Player(playerid)->isConnected())
        return;

    new iCheckpointID = Map_Zone[iMapID][Map_Player_CP_Count][playerid];

    DisablePlayerRaceCheckpoint(playerid);

    if(iCheckpointID == GetNumberOfMapZoneCheckpoints(iMapID))
    {
        // end of race!
        new iPlayerRank = GetPlayerMapZoneRaceRank(playerid, iMapID);
        RemovePlayerFromMapZoneRace(playerid);
        new szOrdinal[6];
        ordinal(szOrdinal, 6, iPlayerRank);
        ShowPlayerBox(playerid, "Finished Race in %s place!.~n~/leave to exit map zone.", szOrdinal);

        // If the player has won we'll broadcast the win.
        if(iPlayerRank == 1)
        {
            new szNews[128];
            format(szNews, 128, "* %s has won the ~%s jump race!", PlayerName(playerid), Map_Zone[iMapID][Map_Name]);
            SendClientMessageToAllEx(Color::Information, szNews);
        }

        // Increase the number of players that have finished this race so we can calculate the position of other players accordingly
        Map_Zone[iMapID][Map_Race_Players_Finished]++;
        return;
    }

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ,
        Float:fPosNextX,
        Float:fPosNextY,
        Float:fPosNextZ,
        Float:fSize = 7.0,
        iType;

    // Alright first of all calculate the checkpoint type as well as the co-ords for the next checkpoint
    // If this is the last checkpoint in the race we'll show it as the "finish" type (type 1)
    if(iCheckpointID + 1 == GetNumberOfMapZoneCheckpoints(iMapID))
    {
        // This is the last checkpoint. Type is 1
        iType = 1;
        // Just set the next co-ords as 0, 0, 0
        fPosNextX = 0;
        fPosNextY = 0;
        fPosNextZ = 0;
    }
    else
    {
        // Standard race type
        iType = 0;
        // Calculate the co-ords of the next race cp
        fPosNextX = Map_Zone[iMapID][Map_Race_Cp_X][iCheckpointID+1];
        fPosNextY = Map_Zone[iMapID][Map_Race_Cp_Y][iCheckpointID+1];
        fPosNextZ = Map_Zone[iMapID][Map_Race_Cp_Z][iCheckpointID+1];
    }


    // Now calculate the position of this actual checkpoint!
    fPosX = Map_Zone[iMapID][Map_Race_Cp_X][iCheckpointID];
    fPosY = Map_Zone[iMapID][Map_Race_Cp_Y][iCheckpointID];
    fPosZ = Map_Zone[iMapID][Map_Race_Cp_Z][iCheckpointID];

    // Set the race checkpoint itself
    SetPlayerRaceCheckpoint(playerid, iType, fPosX, fPosY, fPosZ, fPosNextX, fPosNextY, fPosNextZ, fSize);

    // Increment the number of checkpoints this player has passed so we can calculate the next one in
    // our sequence later
    Map_Zone[iMapID][Map_Player_CP_Count][playerid]++;
}

// todo
// RemovePlayerFromMapZoneRace
// This function resets all associated variables with players
// taking part in a map zone race. It also checks if there are any players
// left in the map zone race and if not ends it accordingly.
RemovePlayerFromMapZoneRace(playerid, bool:check_end = true)
{
    new iMapID = GetPlayerMapZone(playerid);

    if(iMapID < 0 || iMapID > g_MapCount)
        return;

    // Is the player in the race?
    if(!Map_Zone[iMapID][Map_Player_In_Race][playerid])
        return;

    DestroyPlayerMapRaceTextdraws(playerid, iMapID);

    // Still here woo. Reset the data!
    Map_Zone[iMapID][Map_Player_CP_Count][playerid] = 0;
    Map_Zone[iMapID][Map_Player_In_Race][playerid] = 0;
    SetPVarInt(playerid, "iPlayerInAnyMapZoneRace", 0);

    if(check_end == true)
    {
        if(GetNumberOfPlayersInMapZoneRace(iMapID) == 0)
            ResetMapZoneRaceData(iMapID);
    }
}

// This function resets all relevant map zone data
ResetMapZoneRaceData(iMapID)
{
    DestroyDynamicRaceCP(Map_Zone[iMapID][Map_Race_Primary_CP]);
    // recreate the primary cp
    Map_Zone[iMapID][Map_Race_Primary_CP] = CreateDynamicRaceCP(1, Map_Zone[iMapID][Map_Race_Cp_X][0], Map_Zone[iMapID][Map_Race_Cp_Y][0], Map_Zone[iMapID][Map_Race_Cp_Z][0], 0, 0, 0, 20.0, iMapID, 0);

    // Now just reset all the race data and we're done
    Map_Zone[iMapID][Map_Race_Countdown] = -1;
    Map_Zone[iMapID][Map_Race_Players_Finished] = 0;

    // One last check to reset data
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(Map_Zone[iMapID][Map_Player_In_Race][i])
            RemovePlayerFromMapZoneRace(i, false);
    }
}

GetNumberOfPlayersInMapZoneRace(iMapID)
{
    new iCount = 0;
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
            continue;

        if(IsPlayerNPC(i))
            continue;

        if(!Map_Zone[iMapID][Map_Player_In_Race][i])
            continue;

        iCount++;
    }
    return iCount;
}

// Function: AddMapZoneObject
// Add an object to the map zone. This is useful to determine which
// object models are in place for preloading objects later (to bypass a SA-MP bug)
DynamicObject: AddMapZoneObject(n_MapID, n_Model, Float:fPosX, Float:fPosY, Float:fPosZ, Float:fRX, Float:fRY, Float:fRZ)
{
    if(n_MapID < 0 || n_MapID > MAX_MAP_AREAS)
    {
        printf("[Map Zones] Error adding object to map %d (Map ID limit breach)", n_MapID);
        return DynamicObject: -1;
    }

    // First of all store how many different object models are in this map zone
    new n_ModelCount = Map_Zone[n_MapID][Map_Model_Count];

    // If the map zone has more than 1 model, check if this is a new unique model
    // and if it is store it so we can preload it later.
    if(n_ModelCount > 0)
    {
        for(new i = 0; i < n_ModelCount; i++)
        {
            // this object model is already stored. No need to proceed here.
            if(n_Model == Map_Zone[n_MapID][Map_Object_Models][i])
            {
                break;
            }

            // We're at the end of the loop. Time to add this new object model
            // to the array so we can preload it for the player later.
            if(i == n_ModelCount - 1)
            {
                if(Map_Zone[n_MapID][Map_Model_Count] >= MAX_MAP_MODELS)
                {
                    printf("[Map Zones] Error adding map object %d for map %d: Object Models Breached.", n_Model, n_MapID);
                    return DynamicObject: -1;
                }

                Map_Zone[n_MapID] [Map_Object_Models] [n_ModelCount] = n_Model;
                Map_Zone[n_MapID][Map_Model_Count]++;
                break;
            }
        }
    }
    else
    {
        Map_Zone[n_MapID] [Map_Object_Models] [0] = n_Model;
        Map_Zone[n_MapID][Map_Model_Count]++;
    }

    new n_WorldID = n_MapID + 1000;
    return CreateDynamicObject(n_Model, fPosX, fPosY, fPosZ, fRX, fRY, fRZ, n_WorldID, -1, -1, 14500);
}

// Function: SetMapZoneName
// Sets the name of the map zone
// @parameter int TheMap
// @parameter string TheName
SetMapZoneName(n_MapID, szName[])
{
    if(n_MapID < 0 || n_MapID > MAX_MAP_AREAS)
        return;

    format(Map_Zone[n_MapID][Map_Name], 256, "%s", szName);
}

// Function: SetMapZoneSpawn
// Set the spawn position of the map zone.
// @parameter float X, Y, Z, Angle
SetMapZoneSpawn(n_MapID, Float:fPosX, Float:fPosY, Float:fPosZ, Float:fAng)
{
    if(n_MapID < 0 || n_MapID > MAX_MAP_AREAS)
        return;

    Map_Zone[n_MapID][Map_x] = fPosX;
    Map_Zone[n_MapID][Map_y] = fPosY;
    Map_Zone[n_MapID][Map_z] = fPosZ;

    Map_Zone[n_MapID][Map_Ang] = fAng;
}

// Function: SetMapZoneCheckpoint
// Set the checkpoint position
// @parameter float X, Y, Z
SetMapZoneCheckpoint(n_MapID, Float:fPosX, Float:fPosY, Float:fPosZ)
{
    if(n_MapID < 0 || n_MapID > MAX_MAP_AREAS)
        return;

    Map_Zone[n_MapID][Map_cpX] = fPosX;
    Map_Zone[n_MapID][Map_cpY] = fPosY;
    Map_Zone[n_MapID][Map_cpZ] = fPosZ;
}

// Function: SetMapMaxPlayer
// Set the maximum amount of players in a map zone
// @parameter int TheMap
// @parameter int MaxPlayers
SetMapZoneMaxPlayers(n_MapZone, n_MaxPlayers)
{
    if(n_MapZone < 0 || n_MapZone > MAX_MAP_AREAS)
    {
        return;
    }

    Map_Zone[g_MapCount][Map_MaxPlayers] = n_MaxPlayers;
}

// Function: IsPlayerInMapZone(playerid)
// Returns 1 if the player is in a map zone, and 0 if there not.
IsPlayerInMapZone(playerid)
{
    // Is the player connected?
    if(!Player(playerid)->isConnected())
    {
        return 0;
    }

    // If the var is more than -1, then they are at a zone.
    if(g_MapZone[playerid] == -1)
    {
        return 0;
    }

    return 1;
}

// Function: GetPlayerMapZone
// Returns the map zone a player is in
GetPlayerMapZone(playerid)
{
    return g_MapZone[playerid];
}

// Function: AddMapVehicle
// Same params as CreateVehicle. Only difference is, we need to set map vehicles
// to the same virtual world to match the map
AddMapVehicle(mapzid, vehicletype, Float:fPosX, Float:fPosY, Float:fPosZ, Float:fRot, color1 = -1, color2 = -1, respawn_delay = 125)
{
    new iVehicleID = VehicleManager->createVehicle(vehicletype, fPosX, fPosY, fPosZ, fRot, color1, color2);
    new n_WorldID = mapzid + 1000;
    SetVehicleVirtualWorld(iVehicleID, n_WorldID);

    for (new i = 0; i < MAX_MAP_VEHICLES; i++) {
        if (Map_Zone[mapzid][Vehicle_Id][i] != 0) continue;
        else {
            Map_Zone[mapzid][Vehicle_Id][i] = iVehicleID;
            break;
        }
    }

    return 1;

    #pragma unused respawn_delay
}

CMap__VehicleDeath(vehicleId) {
    for (new mapZoneId = 0; mapZoneId < MAX_MAP_AREAS; mapZoneId++) {
        for (new i = 0; i < MAX_MAP_VEHICLES; i++) {
            if (Map_Zone[mapZoneId][Vehicle_Id][i] == vehicleId) {
                new worldId = mapZoneId + 1000;
                SetVehicleToRespawn(vehicleId);
                SetVehicleVirtualWorld(vehicleId, worldId);
            }
        }
    }
}

// Function: OnPlayerEnterMapZone
// Gets called when a player enters a map zone.
OnPlayerEnterMapZone(playerid,mapzid)
{
    // Is the player connected?

    if(!Player(playerid)->isConnected())
        return 0;

    // is the map zone full?

    if(Map_Zone[mapzid][Map_MaxPlayers] != -1
    && g_MapPlayerCount[mapzid] >= Map_Zone[mapzid][Map_MaxPlayers])
    {
        return 0;
    }

    // Now we only get there position if they are not at a mapzone already,
    // just incase they teleport to a new map zone from an existing one!!
    if(!IsPlayerInMapZone(playerid))
    {
        GetPlayerPos(playerid,
        g_PlayerPos[playerid][0],g_PlayerPos[playerid][1],g_PlayerPos[playerid][2]);
    }

    OnPlayerLeaveMapZone(playerid, g_MapZone[playerid]);

    // Now, set the checkpoint at the end of the course, if one is used that is.

    if(!IsMapZoneRaceEnabled(mapzid))
    {
        if(Map_Zone[mapzid][Map_cpX] != 0.0 && Map_Zone[mapzid][Map_cpY] != 0.0 && Map_Zone[mapzid][Map_cpZ] != 0.0)
        {
            SetPlayerRaceCheckpoint(playerid,3,
            Map_Zone[mapzid][Map_cpX],Map_Zone[mapzid][Map_cpY],Map_Zone[mapzid][Map_cpZ],Map_Zone[mapzid][Map_x],Map_Zone[mapzid][Map_y],Map_Zone[mapzid][Map_z],7.0);
            Map_Zone[mapzid][Map_CPActive] = true;
        }
    }

    // Right, set the var for the map zone there at and do the rest of the process.

    g_HSpeedCount[playerid] = 0;

    g_MapZone[playerid] = mapzid;
    PlayerState(playerid)->updateState(MapZonePlayerState);

    g_MapPlayerCount[mapzid]++;

    SetPlayerInterior(playerid, 0);

    SavePlayerGuns(playerid);
    ResetPlayerWeapons(playerid);

    DisablePlayerCheckpoint(playerid);

    new n_WorldID = mapzid + 1000;
    // If they are in a vehicle, we teleport the vehicle they are in to that map
    // zone, otherwise, we just teleport the player =)
    if(IsPlayerInAnyVehicle(playerid) && !Map_Zone[mapzid][Map_Bunnytrack])
    {
        new
            Float:ang,
            veh;

        Streamer_UpdateEx(playerid, Map_Zone[mapzid][Map_x],Map_Zone[mapzid][Map_y],Map_Zone[mapzid][Map_z]);

        veh = GetPlayerVehicleID(playerid);
        m_playerVehicleId[playerid] = veh;

        GetVehicleZAngle(veh,ang);

        SetVehiclePos(veh, Map_Zone[mapzid][Map_x], Map_Zone[mapzid][Map_y], Map_Zone[mapzid][Map_z]+3);

        SetPlayerVirtualWorld(playerid, n_WorldID);

        SetVehicleVirtualWorld( veh, n_WorldID );

        Streamer_UpdateEx(playerid, Map_Zone[mapzid][Map_x],Map_Zone[mapzid][Map_y],Map_Zone[mapzid][Map_z]);

        SetVehicleZAngle(veh,ang);

        GetVehicleHealth(veh, fPlayerMapHealth[playerid]);

        SetVehicleHealth(veh,1000.0);

        LinkVehicleToInterior(veh,0);

        SetVehicleZAngle(veh,Map_Zone[mapzid][Map_Ang]);

        SetCameraBehindPlayer(playerid);
    }
    else    // Player is not in vehicle
    {

        Streamer_UpdateEx(playerid, Map_Zone[mapzid][Map_x],Map_Zone[mapzid][Map_y],Map_Zone[mapzid][Map_z]);

        SetPlayerPos(playerid,Map_Zone[mapzid][Map_x],Map_Zone[mapzid][Map_y],Map_Zone[mapzid][Map_z]+3);

        SetPlayerVirtualWorld(playerid, n_WorldID);

        Streamer_UpdateEx(playerid, Map_Zone[mapzid][Map_x],Map_Zone[mapzid][Map_y],Map_Zone[mapzid][Map_z]);

        SetPlayerHealth(playerid,100);

        SetCameraBehindPlayer(playerid);

        SetPlayerFacingAngle(playerid,Map_Zone[mapzid][Map_Ang]);

    }

    TextDrawShowForPlayer(playerid, Map_Zone[mapzid][tMapZoneDisplay]);
    return 1;
}
// Function: OnPlayerLeaveMapZone
// Gets called when a player leaves a map zone and handles everything.
OnPlayerLeaveMapZone(playerid, mapzid)
{
    // Are they in a map zone?

    if(!IsPlayerInMapZone(playerid))
        return 0;

    // Otherwise we set some vars and decrease the amount of players currently
    // in that map area, then restroe the players pos and stuff.
    DisablePlayerRaceCheckpoint(playerid);

    // Reset map zone race data - no need for any checks here they're all done in the function
    RemovePlayerFromMapZoneRace(playerid);


    g_MapZone[playerid] = -1;
    PlayerState(playerid)->releaseState();

    g_MapPlayerCount[mapzid]--;

    SetPlayerInterior(playerid, 0);

    // Load their weapons
    ResetPlayerWeapons(playerid);
    LoadPlayerGuns(playerid);

    g_MapTP[playerid] = false;

    // If there in a vehicle, we restore that to the pos too.
    if(GetPlayerState(playerid) == PLAYER_STATE_DRIVER)
    {
        new vehid = GetPlayerVehicleID(playerid);
        if (vehid != m_playerVehicleId[playerid])
            SetVehicleToRespawn(vehid);

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected() || !IsPlayerInVehicle(i, vehid) || i == playerid)
                continue;

            SetPlayerVirtualWorld(i, 0);
        }
    }

    SetPlayerPos(playerid,g_PlayerPos[playerid][0]+2,g_PlayerPos[playerid][1]+2,g_PlayerPos[playerid][2]);
    SetPlayerVirtualWorld(playerid, 0);
    if (m_playerVehicleId[playerid] != Vehicle::InvalidId) {
        SetVehicleVirtualWorld(m_playerVehicleId[playerid], 0);
        SetVehicleToRespawn(m_playerVehicleId[playerid]);
        m_playerVehicleId[playerid] = Vehicle::InvalidId;
    }

    TextDrawHideForPlayer(playerid, Map_Zone[mapzid][tMapZoneDisplay]);
    TogglePlayerControllable(playerid, true);
    return 1;
}

// Function: MapZoneCheckpointUpdate
// this gets called from OnPlayerEnterCheckpoint, and manages
// map zones for when a player enters the checkpoint, in other words
// when they have completed it.
MapZoneCheckpointUpdate(playerid)
{
    // Are they in a mapped area?
    if(!IsPlayerInMapZone(playerid))
    {
        return 0;
    }

    if(IsMapZoneRaceEnabled(g_MapZone[playerid]))
    {
        CheckMapZoneRaceCheckpoint(playerid, g_MapZone[playerid]);
        return 1;
    }

    // Otherwise we disable the checkpoint and display the data, oh, and remove
    // them from the map area.

    DisablePlayerRaceCheckpoint(playerid);

    // Calculate their reward
    new reward = 20000;
    new timetaken = Time->currentTime() - g_MapSeconds[playerid];

    g_MapSeconds[playerid] = 0;

    reward = reward - timetaken*100 + g_HSpeedCount[playerid]*10;

    if(reward < 0)
        reward = 0;
    if(reward > 100000)
    {
        reward = 10000;
    }

    // Just for the record, tell them how long they where. Maybe we can spice it up
    // later by saving it and having a record system for each mapped zone.

    new str[256];
    format(str,256,"* You have completed the %s map in %d seconds!",Map_Zone[g_MapZone[playerid]][Map_Name],timetaken);
    SendClientMessage(playerid,COLOR_PINK,str);

    // Format the gametext
    format(str,256,"~w~%s:~n~~y~Speed Bonus:$%d~n~~b~Time Taken: %d seconds~n~~g~Reward: $%d",
    Map_Zone[g_MapZone[playerid]][Map_Name],g_HSpeedCount[playerid]*10,timetaken,reward);
    ShowBoxForPlayer(playerid, str);

    GivePlayerMoney(playerid, reward);

    SetPlayerMapZone(playerid, -1); // -1 removes them from all map zones
    return 1;
}

// Function: LoadMaps
// Called from OnGameModeInit, this simply loads
// all the map zones. Quite important.
LoadMaps()
{
    new szFunc[128];
    new szDisplay[128];

    for(new i = 0; i < MAX_MAP_AREAS; i++)
    {
        format(szFunc, 128, "CreateMap__MAP%d", i);

        if(CallLocalFunction(szFunc, ""))
        {
            g_MapCount++;

            // Create a textdraw display for the map zone which shows to all players in a map zone.
            format(szDisplay, sizeof(szDisplay), "%s~g~ [/jump %d]~n~~y~/nos /vr /flip~n~/leave", Map_Zone[i][Map_Name], i);
            Map_Zone[i][tMapZoneDisplay] = TextDrawCreate(40.000000, 278.000000, szDisplay);
            TextDrawBackgroundColor(Map_Zone[i][tMapZoneDisplay], 255);
            TextDrawFont(Map_Zone[i][tMapZoneDisplay], 1);
            TextDrawLetterSize(Map_Zone[i][tMapZoneDisplay], 0.270000, 1.400000);
            TextDrawColor(Map_Zone[i][tMapZoneDisplay], -1);
            TextDrawSetOutline(Map_Zone[i][tMapZoneDisplay], 0);
            TextDrawSetProportional(Map_Zone[i][tMapZoneDisplay], 1);
            TextDrawSetShadow(Map_Zone[i][tMapZoneDisplay], 1);

            // Set the countdown variable to -1 which determines that the
            // race is not in the countdown phase
            Map_Zone[i][Map_Race_Countdown] = -1;
            continue;
        }
    }
    if (g_MapCount == 0)
        printf("[MapZoneController] ERROR: Could not load any map zones.");
}

// Function: SetPlayerMapZone
// Sets the player to a new map zone id.
SetPlayerMapZone(playerid, mapid)
{
    // is the player connected?
    if(!Player(playerid)->isConnected())
    {
        return 0;
    }
    // is the map zone id valid?
    if(mapid < -1 || mapid > g_MapCount)
        return 0;

    // If the mapid is -1, that means we are taking them out of all map zones,
    // so we call OnPlayerLeaveMapZone =)
    if(mapid == -1)
    {
        OnPlayerLeaveMapZone(playerid, g_MapZone[playerid]);
    }
    else
    {
        // otherwise, simple, we just call OnPlayerEnterMapZone. Easy stuff =)
        OnPlayerEnterMapZone(playerid,mapid);
    }
    return 1;
}

// Function: OnMapConnect
// Called from OnPlayerConnect & sets a few vars and things.
OnMapConnect(playerid)
{
    g_MapZone[playerid] = -1;
    g_HSpeedCount[playerid] = 0;
}

new iMapZoneJumpDialogID[MAX_MAP_AREAS];

#if Feature::DisableRaces == 0
new iMapZoneJumpDialogItems = 0;
new szMapZoneRaceDialog[512];
#endif

#if Feature::DisableRaces == 0

// Shows a dialog listing all the map zones with jump zone races on them
ShowMapZoneJumpRaceDialog(playerid)
{
    // Right, are any jump races stored? If not
    // we'll create a list of em all to show them in a dialog later.
    // If the list is already created then just proceed to showing it in the dialog.
    if(iMapZoneJumpDialogItems == 0)
    {
        for(new i = 0; i < g_MapCount; i++)
        {
            if(Map_Zone[i][Map_Race_Cp_Count] == 0)
            {
                continue;
            }

            // If the string isn't empty make sure we reformat it to include
            // the original content. Ideally we could use strins here but there is a bug
            // with the function - see the userbar handler for more details.
            if(strlen(szMapZoneRaceDialog) > 0)
            {
                // Store the map zone name to the string
                format(szMapZoneRaceDialog, sizeof(szMapZoneRaceDialog), "%s%s\r\n", szMapZoneRaceDialog, Map_Zone[i][Map_Name]);
            }
            else
            {
                format(szMapZoneRaceDialog, sizeof(szMapZoneRaceDialog), "%s\r\n", Map_Zone[i][Map_Name]);
            }

            // Store the map zone id so we can retrieve it in the dialog later
            iMapZoneJumpDialogID[iMapZoneJumpDialogItems] = i;
            iMapZoneJumpDialogItems++;
        }
    }

    if(iMapZoneJumpDialogItems == 0)
    {
        ShowPlayerDialog(playerid, DIALOG_JUMP_RACES, DIALOG_STYLE_MSGBOX, "LVP Jump Races", "No Jump Zone races have been found.", "Close", "");
    }
    else
    {
        ShowPlayerDialog(playerid, DIALOG_JUMP_RACES, DIALOG_STYLE_LIST, "LVP Jump Races", szMapZoneRaceDialog, "Select", "Close");
    }
}

#endif

// Called when a player presses a buttom in the above dialog ^
OnMapZoneJumpDialogResponse(playerid, listitem)
{
    new szCmdString[3];
    format(szCmdString, 3, "%d", iMapZoneJumpDialogID[listitem]);
    return lvp_jump(playerid, szCmdString);
}

// Function: OnJumpDialogResponse
// To be called when the player's chosen a jump.
OnJumpDialogResponse(playerid, listitem)
{
    new par[11];

    format(par, sizeof(par), "%d", listitem);

    lvp_jump(playerid, par);
}

// Command: /jump
// Level: Player
lvp_jump(playerid, params[]) {
    new notice[128];

    ClearPlayerMenus(playerid);
    if (!strlen(params)) {
        new jumpList[512];
        for (new jumpId; jumpId < g_MapCount; jumpId++)
            format(jumpList, sizeof(jumpList), "%s%s\r\n", jumpList, Map_Zone[jumpId][Map_Name]);

        ShowPlayerDialog(playerid, DIALOG_JUMPS_LIST, DIALOG_STYLE_LIST, "Choose a jump!", jumpList, "Begin!", "Cancel");
        return 1;
    }

    new jumpId = Command->integerParameter(params, 0);
    if (jumpId < 0 || jumpId >= g_MapCount) {
        format(notice, sizeof(notice), "Usage: /jump [0 - %d]", g_MapCount-1);
        SendClientMessage(playerid, Color::Error, notice);
        return 1;
    }

    if (!IsPlayerMinigameFree(playerid))
        return ShowBoxForPlayer(playerid, "You're currently signed up for a minigame, use /leave first!");

    if (Time->currentTime() - g_MapTP[playerid] < 5 && !IsPlayerInMapZone(playerid) && Player(playerid)->isModerator() == false)
        return ShowBoxForPlayer(playerid, "You can only teleport to a jumpzone every 5 seconds!");

    if (!IsPlayerInAnyVehicle(playerid))
        return ShowBoxForPlayer(playerid, "You have to be in a vehicle to teleport to a jumpzone!");

    if (VehicleModel(GetVehicleModel(GetPlayerVehicleID(playerid)))->isNitroInjectionAvailable() == false)
        return ShowBoxForPlayer(playerid, "You cannot teleport to a jumpzone in this type of vehicle!");

    if (IsPlayerFighting(playerid))
        return ShowBoxForPlayer(playerid,
            "You can't teleport to a jumpzone because you've recently been in a gunfight! Try again in a few seconds.");

    new numberOfPlayersInVehicle = 0;
    for (new index = 0; index <= PlayerManager->highestPlayerId(); index++) {
        if (Player(index)->isConnected() == false || Player(index)->isNonPlayerCharacter() == true)
            continue;

        if (IsPlayerInVehicle(index, GetPlayerVehicleID(playerid)))
            ++numberOfPlayersInVehicle;
    }

    if (numberOfPlayersInVehicle >= 2)
        return ShowBoxForPlayer(playerid, "You can't teleport to a jumpzone with a passenger in your vehicle!");

    if (Map_Zone[jumpId][Map_MaxPlayers] != -1 && g_MapPlayerCount[jumpId] >= Map_Zone[jumpId][Map_MaxPlayers]
        && Player(playerid)->isAdministrator() == false)
        return ShowBoxForPlayer(playerid, "This jumpzone is full! Try again later.");

    SetPlayerMapZone(playerid, jumpId);

    format(notice, sizeof(notice), "~r~~h~%s~w~ went to ~y~%s~w~ (~p~/jump %d~w~)", Player(playerid)->nicknameString(),
        Map_Zone[jumpId][Map_Name], jumpId);
    NewsController->show(notice);

    if (Map_Zone[jumpId][Map_cpX] != 0.0 && Map_Zone[jumpId][Map_cpY] != 0.0 && Map_Zone[jumpId][Map_cpZ] != 0.0)
        ShowPlayerBox(playerid, "Welcome to the %s jump!~n~Reach the ~r~Corona~w~ for a bonus!", Map_Zone[jumpId][Map_Name]);

    g_MapTP[playerid] = Time->currentTime();

    return 1;
}

// Include the map files;
#include Resources/Maps/MapZones/Jumps/Airport.pwn
#include Resources/Maps/MapZones/Jumps/Highspeed.pwn
#include Resources/Maps/MapZones/Jumps/Explosive.pwn
#include Resources/Maps/MapZones/Jumps/MiniJump.pwn
#include Resources/Maps/MapZones/Jumps/Vinewood.pwn
#include Resources/Maps/MapZones/Jumps/GantBridge.pwn
#include Resources/Maps/MapZones/Jumps/HighJump.pwn
#include Resources/Maps/MapZones/Jumps/Missionary_Hills.pwn
#include Resources/Maps/MapZones/Jumps/LongJump.pwn
#include Resources/Maps/MapZones/Jumps/LosSkyscaptos.pwn
#include Resources/Maps/MapZones/Jumps/TwinChimneys.pwn
#include Resources/Maps/MapZones/Jumps/Simple.pwn
#include Resources/Maps/MapZones/Jumps/Spinner.pwn
#include Resources/Maps/MapZones/Jumps/Dam.pwn
#include Resources/Maps/MapZones/Jumps/LSBuilding.pwn
#include Resources/Maps/MapZones/Jumps/FlayinHigh.pwn
#include Resources/Maps/MapZones/Jumps/LSHigh.pwn
#include Resources/Maps/MapZones/Jumps/Area69.pwn
#include Resources/Maps/MapZones/Jumps/SFAirport.pwn
#include Resources/Maps/MapZones/Jumps/Airstrip.pwn
#include Resources/Maps/MapZones/Jumps/LSAirport.pwn
#include Resources/Maps/MapZones/Jumps/LVAir.pwn
#include Resources/Maps/MapZones/Jumps/Chiliad.pwn