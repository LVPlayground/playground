// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*   Las Venturas Playground 2.90 - Rivershell Game. Based of the classic       *
*   SA:MP game that has proven to be quite fun, rivershell is a capture the    *
*   flag type minigame that involves two teams that have to capture eachothers *
*   boat which is parked across the river. The teams should be chosen          *
*   automatically, and should spawn at each side of the river. The score should*
*   be displayed in a neat little textdraw with a limit of say, up to 10.       *
*                                                                              *
*   Author: Jay                                                                *
*   wilkinson_929@hotmail.com                                                  *
*******************************************************************************/

forward CShell__Start();

#define RIVERSHELL_STATE_NONE       0
#define RIVERSHELL_STATE_SIGNUP     1
#define RIVERSHELL_STATE_RUNNING    2

#define TEAM_BLUE 0
#define TEAM_GREEN 1

#define RIVERSHELL_VEHICLE_COUNT 14

#define RIVERSHELL_BLUE 0x6152C200

#define OBJECTIVE_COLOR 0xE2C063FF
#define TEAM_GREEN_COLOR 0x33AA33FF
#define TEAM_BLUE_COLOR 0x1111AAFF

#define CAPS_TO_WIN 1

#define RIVERSHELL_WORLD 16
#define RIVERSHELL_DEBUG 0

new g_RivershellPlayers;
new g_ProcessedVehicles;

new p_Team[MAX_PLAYERS];

new CalcTeam;
new Text:Rivershell = Text:INVALID_TEXT_DRAW;

new gBlueTimesCapped;
new gGreenTimesCapped;

new rivershellBlueTeamVehicleId;
new rivershellGreenTeamVehicleId;
new rivershellSpawnedVehicles[RIVERSHELL_VEHICLE_COUNT + 8 /** overflow protection **/] = {Vehicle::InvalidId, ...};

new gObjectiveGreenPlayer = -1;
new gObjectiveBluePlayer = -1;

new g_RivershellSkin[MAX_PLAYERS];

new CShell__TeamCount[2];

new CShell__Weapon[13];
new CShell__Ammo[13];

// CShell__SignPlayerUp. This function gets called when a player has
// requested a signup for the rivershell game. And if it's okay to do
// so, signs them up!
CShell__SignPlayerUp(playerid)
{
    CShell__Debug("CShell__SignPlayerUp Processing...");
    // Is the game in the signup process?
    if(g_RivershellState != RIVERSHELL_STATE_SIGNUP) return CShell__Debug("Error signing up. Game not in correct process!");
    // is the layer actually connected
    if(!Player(playerid)->isConnected()) return CShell__Debug("Invalid player attempting to sign up.");
    // Have they already signed up?
    if(g_RivershellPlayer[playerid]) return CShell__Debug("Error signing up - Player already signed up!");
    // otherwise, it's all good :>
    CShell__Debug("Player has signed up to the game.");
    g_RivershellPlayer[playerid] = true;
    g_RivershellPlayers++;
    // new str[256];
    // format(str,256,"%s (ID:%d) has signed up for rivershell.",PlayerName(playerid),playerid);
    // Admin(str);
    // Team calculator. Now, this is a nice, easy, system, and also gives the players
    // a sortof chance to pick there team. Basically, if the var is set to 0, they
    // get team BLUE and the var gets set to true. Then, if its set to true, they
    // get team green and its set to false. Nice & easy ;)

    TakeRegulatedMoney(playerid, RivershellParticipation);

    new message[128];
    Responses->respondMinigameSignedUp(playerid, RivershellMinigame, "Rivershell", 20);

    format(message, sizeof(message), "~r~~h~%s~w~ has signed up for ~y~Rivershell~w~ (~p~/rivershell~w~)", Player(playerid)->nicknameString());
    NewsController->show(message);

    format(message,sizeof(message),"%s (Id:%d) has signed up for /rivershell.",PlayerName(playerid),playerid);
    Admin(playerid, message);

    if(!CalcTeam)
    {
        p_Team[playerid] = TEAM_BLUE;
        CalcTeam = true;
        CShell__Debug("Player calculated to team blue.");
    }else if(CalcTeam)
    {
        CalcTeam = false;
        p_Team[playerid] = TEAM_GREEN;
        CShell__Debug("Player calculated to team green.");
    }
    return 1;
}

// CShell__SignPlayerOut. Gets called when a player requests a leave
// from the game and manages the process.
CShell__SignPlayerOut(playerid)
{
    CShell__Debug("SignPlayerOut processing...");
    // Is the game actually running or in the signup process?
    if(g_RivershellState == RIVERSHELL_STATE_NONE) return CShell__Debug("Error signing player out - Game not running.");
    // is the player connected?
    if(!Player(playerid)->isConnected()) return CShell__Debug("Invalid player signout.");
    // has he/she actually signed up?
    if(!g_RivershellPlayer[playerid]) return CShell__Debug("Error signing player out - Not signed up.");
    // Otherwise, we sign them out, spawn them, and decrease the count for the amount
    // of players who are taking part in the game.
    g_RivershellPlayer[playerid] = false;
    g_RivershellPlayers--;
    new iTeam = p_Team[playerid];

    CShell__Debug("SignPlayerOut process successfull.");

    if (g_RivershellState == RIVERSHELL_STATE_SIGNUP)
        GiveRegulatedMoney(playerid, RivershellParticipation);

    if(g_RivershellState == RIVERSHELL_STATE_RUNNING)
    {

        ResetPlayerWeapons(playerid);

        RemovePlayerFromVehicle(playerid);

        SetPlayerTeam(playerid, NO_TEAM);

        ColorManager->releasePlayerMinigameColor(playerid);
        TimeController->releasePlayerOverrideTime(playerid);

        SetPlayerVirtualWorld(playerid,false);

        SetVehicleParamsForPlayer(rivershellGreenTeamVehicleId,playerid,false,false);

        SetVehicleParamsForPlayer(rivershellBlueTeamVehicleId,playerid,false,false);

        RemovePlayerMapIcon(playerid,12);

        RemovePlayerMapIcon(playerid,13);

        DisablePlayerCheckpoint(playerid);

        SetPlayerSkinEx(playerid,g_RivershellSkin[playerid]);

        SetPlayerRandomSpawnPos(playerid);

        CShell__LoadGuns(playerid);

        TextDrawHideForPlayer(playerid,Rivershell);

        g_VirtualWorld[playerid] = 0;

        CShell__TeamCount[iTeam]--;

        if(CShell__TeamCount[iTeam] <= 0)
        {
            new notice[128];
            if (iTeam == TEAM_BLUE) {
                format(notice, sizeof(notice), "~y~Rivershell~w~ has finished: ~g~~h~Green Team~w~ have won!");
                NewsController->show(notice);
                CShell__End();
            } else {
                format(notice, sizeof(notice), "~y~Rivershell~w~ has finished: ~b~~h~Blue Team~w~ have won!");
                NewsController->show(notice);
                CShell__End();
            }
        }

    }
    return 1;
}
// CShell__CheckStatus. This gets called every second from LVP's main timer.
// it checks if the game is okay to process with running, and if not, ends it.
CShell__CheckStatus()
{
    // If the game is running and there are less than two players, we need to end
    // it so that it just plainly doesn't suck playing alone.

    if(g_RivershellState == RIVERSHELL_STATE_RUNNING && g_RivershellPlayers < 2)
        return CShell__End();

    return 1;
}
// CShell__End. This is called when the game is about to end, and manages
// the process by settings relevant vars and sending an explination
// message as to why it ended.
CShell__End()
{
    CShell__Debug("CShell__End processing...");
    // is the game actually running?
    if(g_RivershellState == RIVERSHELL_STATE_NONE) return CShell__Debug("Error ending game - Not running.");
    // we set the new state as empty

    // Now, we need to set the vehicles, whether they need destroying or w/e
    CShell__ProcessVehicles();

    CShell__TeamCount[TEAM_BLUE] = 0;
    CShell__TeamCount[TEAM_GREEN] = 0;
    // now we loop through players, and anyone that was taking part need to
    // be respawned.
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected()) continue;
        if(!g_RivershellPlayer[i]) continue;
        g_RivershellPlayers = false;
        g_RivershellPlayer[i] = false;

        if (g_RivershellState == RIVERSHELL_STATE_SIGNUP) {
            GiveRegulatedMoney(i, RivershellParticipation);
            ShowBoxForPlayer(i, "Not enough players have signed up for Rivershell. You have been refunded.");
        }

        // if the game is running then the player must be taking part. We need to
        // respawn them out of it in which case.
        if(g_RivershellState == RIVERSHELL_STATE_RUNNING)
        {
            SetPlayerVirtualWorld(i,0);
            RemovePlayerFromVehicle(i);
            RemovePlayerFromVehicle(i);
            DisablePlayerCheckpoint(i);
            ColorManager->releasePlayerMinigameColor(i);
            TimeController->releasePlayerOverrideTime(i);
            SetPlayerTeam(i,NO_TEAM);
            RemovePlayerMapIcon(i,12);
            RemovePlayerMapIcon(i,13);
            SetPlayerVirtualWorld(i,false);
            SetVehicleParamsForPlayer(rivershellGreenTeamVehicleId,i,false,false);
            SetVehicleParamsForPlayer(rivershellBlueTeamVehicleId,i,false,false);
            SetPlayerSkinEx(i,g_RivershellSkin[i]);
            SetPlayerRandomSpawnPos(i);
            CShell__LoadGuns(i);
            TextDrawHideForPlayer(i,Rivershell);
            g_VirtualWorld[ i ] = 0;
        }
    }
    g_RivershellState = RIVERSHELL_STATE_NONE;
    CShell__TextdrawUpdate();
    CShell__Debug("CShell__End process successfull.");
    return 1;
}
// CShell__SignupProcess. This gets called when a rivershell signup starts
// and manages the process of signing up for the game.
CShell__SignupProcess(playerid)
{
    CShell__Debug("CShell__SignupProcess processing...");
    // is the game okay to proceed to the signup state?
    if(g_RivershellState != RIVERSHELL_STATE_NONE) return CShell__Debug("Error going to signup process - Game already running.");
    // Otherwise, we padvertise that the game is starting with a gametext as usual
    // and a basic news message. We also update the games state and reset the player counts.
    g_RivershellState = RIVERSHELL_STATE_SIGNUP;
    g_RivershellPlayers = false;

    SetTimer("CShell__Start",20*1000,0);

    Announcements->announceMinigameSignup(RivershellMinigame, "Rivershell", "/rivershell", 250, playerid);
    GameTextForAllEx("~y~Rivershell~w~ is now signing up!~n~Want to join? ~r~/rivershell~w~!", 5000, 5);

    return 1;
}

// CShell__OnText
// Author: tomozj
// This function will be called when someone types a string. If this function
// returns 1 or true, then OnPlayerText will be cancelled and the text will not
// be shown in the mainchat.
CShell__OnText(playerid, text[])
{
    if(g_RivershellState != RIVERSHELL_STATE_RUNNING || !g_RivershellPlayer[playerid]) {
        // Minigame not active, or player not in the minigame..
        return 0;
    }

    if(!strcmp(text[0], "!", true, 1)) {
        // TEAM CHAT YAYA !!!!!
        new string[256];
        new teamstr[7];
        new teamid = p_Team[playerid];
        if(teamid == TEAM_BLUE) teamstr = "Blue";
        else teamstr = "Green";
        format(string, 256, "* [%s Team] %s: %s", teamstr, PlayerName(playerid), text[1]);
        CShell__TeamMsg(teamid, COLOR_LIGHTBLUE, string);
        return 1;
    }
    return 0;
}
// CShell__TeamMsg. This function manages any team messages that may get sent to
// the team such as boat steals and perhaps team chat.
CShell__TeamMsg(Rteam,color,msg[])
{
    CShell__Debug("CShell__TeamMsg processing...");
    // is it actually a valid team we are sending it to?
    if(Rteam < 0 || Rteam > 1) return CShell__Debug("Error sending team message - Invalid team id.");
    // is the game actually running?
    if(g_RivershellState != RIVERSHELL_STATE_RUNNING) return CShell__Debug("Error sending team message - Game not running.");
    // now send the message to the relevant team members.
    for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
    {
        if(!Player(j)->isConnected()) continue;
        if(!g_RivershellPlayer[j]) continue;
        if(p_Team[j] != Rteam) continue;
        SendClientMessage(j,color,msg);
    }
    CShell__Debug("Team message process complete.");
    return 1;
}

// CShell__Textdraw update. This updates the games textdraw, perhaps when a player
// scores a point or w/e.
CShell__TextdrawUpdate()
{
    if(g_RivershellState != RIVERSHELL_STATE_RUNNING)
    return 0;

    CShell__Debug("CShell__TextdrawUpdate processing...");


    // is the game running? if not, we can't update textdraws!



    if(!IsValidText(Rivershell))
    {
        new str[256];
        format(str,256,"~b~Blue team: %d~n~~n~~g~Green team: %d",gBlueTimesCapped,gGreenTimesCapped);
        Rivershell = TextDrawCreate(501,100,str);
        TextDrawAlignment(Rivershell,0);
        TextDrawBackgroundColor(Rivershell,0x000000ff);
        TextDrawFont(Rivershell,1);
        TextDrawLetterSize(Rivershell,0.399999,1.200000);
        TextDrawColor(Rivershell,0xffffffff);
        TextDrawSetOutline(Rivershell,1);
        TextDrawSetProportional(Rivershell,1);
        TextDrawSetShadow(Rivershell,1);
        for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
        {
            if(!Player(j)->isConnected()) continue;
            if(!g_RivershellPlayer[j]) continue;

            TextDrawShowForPlayer(j,Rivershell);
        }
    }else{
        for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
        {
            if(!Player(j)->isConnected()) continue;
            if(!g_RivershellPlayer[j]) continue;

            TextDrawShowForPlayer(j,Rivershell);
        }

        new str[256];
        format(str,256,"~b~Blue team: %d~n~~n~~g~Green team: %d",gBlueTimesCapped,gGreenTimesCapped);
        TextDrawSetString(Rivershell, str);
    }
    CShell__Debug("Textdraw re-created.");

    CShell__Debug("CShell__TextdrawUpdate process finished.");
    return 1;
}

// CShell__ProcessVehicles. Simply sets up the vehicles to the relevant world
// and position for each team.
CShell__ProcessVehicles()
{
    CShell__Debug("Processing vehicles.");

    // check the minigame is actually running
    if(g_RivershellState != RIVERSHELL_STATE_RUNNING) return CShell__Debug("Error processing vehicles. Game already running!");
    // Are the vehicles already processed?
    if(g_ProcessedVehicles) 
    {
        CShell__Debug("Vehicles already processed. Removing.");
        // if so, we need to destroy them.
        g_ProcessedVehicles = false;

        for (new vehicleIndex = 0; vehicleIndex < RIVERSHELL_VEHICLE_COUNT; ++vehicleIndex)
            VehicleManager->destroyVehicle(rivershellSpawnedVehicles[vehicleIndex]);

        VehicleManager->destroyVehicle(rivershellGreenTeamVehicleId);
        VehicleManager->destroyVehicle(rivershellBlueTeamVehicleId);
    }else{
        CShell__Debug("Proceeding to creation");
        // Otherwise, we create them.
        // OBJECTIVE VEHICLES
        rivershellGreenTeamVehicleId = VehicleManager->createVehicle(454, 2057.0154, -236.5598, -0.2621, 359.4377, 114, 1); // gr Tropic
        rivershellBlueTeamVehicleId  = VehicleManager->createVehicle(454, 2381.9685,  532.4496,  0.2574, 183.2029,  79, 7); // b Tropic

        SetVehicleHealth(rivershellGreenTeamVehicleId, (200+(800*g_RivershellPlayers*0.25)));
        SetVehicleHealth(rivershellBlueTeamVehicleId, (200+(800*g_RivershellPlayers*0.25)));

        SetVehicleVirtualWorld(rivershellGreenTeamVehicleId,RIVERSHELL_WORLD);
        SetVehicleVirtualWorld(rivershellBlueTeamVehicleId,RIVERSHELL_WORLD);

        // We have to assign variables to the first and last vehicle we create
        // so that we know which id's to put in the correct world.
        // GREEN VEHICLES
        new currentVehicleId = 0;

        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2023.5109, -246.4161, -0.1514, 351.0038, 114, 1); // gr dhin
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 1949.2490, -259.5398, -0.2794,  13.3247, 114, 1); // gr ding2fix
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2003.7256, -248.4939, -0.2243,   5.1752, 114, 1); // gr ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 1982.4832, -252.4811, -0.3006, 358.3696, 114, 1); // gr ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 1927.7894, -249.3088, -0.2893, 320.7715, 114, 1); // gr ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 1907.6969, -230.4202, -0.2585, 306.0136, 114, 1); // gr ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(487, 1913.0819, -376.2350, 21.4819, 350.9412, 114, 1); // gr mav

        // BLUE VEHICLES
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2289.7571, 518.4412, -0.2167, 178.8301, 79, 7); // b ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2294.3599, 519.1021, -0.1391, 177.1416, 79, 7); // b ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2298.8411, 518.4229, -0.2333, 181.1228, 79, 7); // b ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2369.9839, 519.0364, -0.3190, 187.9187, 79, 7); // b ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2359.9417, 519.1055, -0.2271, 183.8014, 79, 7); // b ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(473, 2351.4617, 519.1046, -0.1172, 182.8623, 79, 7); // b ding
        rivershellSpawnedVehicles[currentVehicleId++] = VehicleManager->createVehicle(487, 2324.4399, 573.1667,  7.9578, 177.6699, 79, 7); // b mav

        // Make sure that we don't spawn more vehicles than expected. 
        if (currentVehicleId != RIVERSHELL_VEHICLE_COUNT) { 
            printf("WARNING: Too much vehicles have been spawned for the Rivershell minigame."); 
        } 

        g_ProcessedVehicles = true;

        for (new vehicleIndex = 0; vehicleIndex < RIVERSHELL_VEHICLE_COUNT; ++vehicleIndex)
            SetVehicleVirtualWorld(rivershellSpawnedVehicles[vehicleIndex], RIVERSHELL_WORLD);
    }
    return 1;
}
// CShell__Debug. This function simply manages debug statements throughout the game.
CShell__Debug(msg[])
{
    #if RIVERSHELL_DEBUG == 1
    print(msg);
    #else
    #pragma unused msg
    #endif
    return 1;
}

// CShell__Start. This function starts the game when neccassary and sets
// people who have signed up to there neccassary locations and stuff. it is called
// from a timer after the signup process.
public CShell__Start()
{
    CShell__Debug("CShell__Start processing...");
    // Is the minigame in the correct process to start?
    if(g_RivershellState != RIVERSHELL_STATE_SIGNUP) return CShell__Debug("Error starting rivershell - Not in signup state.");

    // is there enough players?
    if(g_RivershellPlayers < 2) return CShell__End();

    // Now update the state, and process the vehicles.
    g_RivershellState = RIVERSHELL_STATE_RUNNING;
    CShell__ProcessVehicles();
    gBlueTimesCapped = false;
    gGreenTimesCapped = false;
    gObjectiveGreenPlayer = -1;
    gObjectiveBluePlayer = -1;
    CShell__TextdrawUpdate();
    CShell__CheckStatus();
    CShell__TeamCount[TEAM_BLUE] = 0;
    CShell__TeamCount[TEAM_GREEN] = 0;
    // Now we loop through and find everyone who signed up.
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected()) continue;
        if(!g_RivershellPlayer[i]) continue;
        CShell__SaveGuns(i);
        g_RivershellSkin[i] = GetPlayerSkin(i);
        RemovePlayerFromVehicle(i);
        SpawnPlayer(i);
        RemovePlayerFromVehicle(i);
        SetPlayerTeam(i,p_Team[i]);
        SendClientMessage(i, COLOR_GREEN, "* Use the ! prefix to talk to your team.");
        CShell__TeamCount[p_Team[i]]++;
        DisablePlayerCheckpoint(i);
    }
    return 1;
}

// CShell__Spawn - This function manages the rivershell spawns and sets the player in
// the correct position in accordance with his/her team.

CShell__Spawn(playerid)
{

    CShell__Debug("CShell__Spawn process started...");
    // Is the game running?
    if(g_RivershellState != RIVERSHELL_STATE_RUNNING) return CShell__Debug("Error processing spawns - Game not running.");
    // is the player playing it?
    if(!g_RivershellPlayer[playerid]) return CShell__Debug("Error processing player spawn - Player not in rivershell.");

    // Now, we reset the weapons, set the correct world, and set them in the relevant
    // position.
    RemovePlayerFromVehicle(playerid);
    ResetPlayerWeapons(playerid);
    SetPlayerVirtualWorld(playerid,RIVERSHELL_WORLD);
    SetPlayerHealth(playerid,100);
    SetPlayerArmour(playerid,100);

    ResetPlayerGunData(playerid);

    GiveWeapon(playerid,29,400);
    GiveWeapon(playerid,31,400);
    GiveWeapon(playerid,33,6);
    GiveWeapon(playerid,25,25);
    GiveWeapon(playerid,6,1);
    SetPlayerWeather(playerid,10);
    SetPlayerInterior(playerid,0);
    SetPlayerMapIcon(playerid,12,2321.8560,527.6138,-0.5004,58,0); // blue team map icon
    SetPlayerMapIcon(playerid,13,1954.3110,-256.1620,-0.5624,62,0); // green team map icon

    TimeController->setPlayerOverrideTime(playerid, 20, 25);

    // now switch the teams, and set the relevant positions and send the relevant messages
    // for each team member.
    switch(p_Team[playerid])
    {
    case TEAM_BLUE:
        {
            SetPlayerPos(playerid,2359.2703,540.5911,1.7969);

            SetPlayerFacingAngle(playerid,180.6476);
            GameTextForPlayer(playerid,"Defend the ~b~BLUE ~w~team's ~y~Reefer~n~~w~Capture the ~g~GREEN ~w~team's ~y~Reefer",6000,5);
            SendClientMessage(playerid,COLOR_PINK,"* Capture the green team's boat whilst defending your own! Both boats are marked yellow.");
            SetVehicleParamsForPlayer(rivershellGreenTeamVehicleId,playerid,1,0);
            SetVehicleParamsForPlayer(rivershellBlueTeamVehicleId,playerid,1,1);
            SetPlayerSkinEx(playerid,154);
            ColorManager->setPlayerMinigameColor(playerid, COLOR_BLUE);
        }
    case TEAM_GREEN:
        {
            SetPlayerPos(playerid,1980.0054,-266.6487,2.9653);

            SetPlayerFacingAngle(playerid,348.9788);
            GameTextForPlayer(playerid,"Defend the ~g~GREEN ~w~team's ~y~Reefer~n~~w~Capture the ~b~BLUE ~w~team's ~y~Reefer",6000,5);
            SendClientMessage(playerid,COLOR_PINK,"* Capture the blue team's boat whilst defending your own! Both boats are marked yellow.");
            SetVehicleParamsForPlayer(rivershellGreenTeamVehicleId,playerid,1,1);
            SetVehicleParamsForPlayer(rivershellBlueTeamVehicleId,playerid,1,0);
            SetPlayerSkinEx(playerid,162);
            ColorManager->setPlayerMinigameColor(playerid, COLOR_GREEN);
        }

    }
    // Now, we just double check the game has enough players:
    CShell__CheckStatus();
    CShell__TextdrawUpdate();
    CShell__Debug("CShell__Spawn process finished.");
    return 1;
}



// CShell__Checkpoint. This is called when a player enters a checkpoint
// and manages the process.
CShell__Checkpoint(playerid)
{
    CShell__Debug("CShell__Checkpoint process started.");
    if(!g_RivershellPlayer[playerid]) return CShell__Debug("Error processing checkpoint - player not in game.");
    if(g_RivershellState != RIVERSHELL_STATE_RUNNING) return CShell__Debug("Error processing checkpoint - Game not running.");

    new playervehicleid = GetPlayerVehicleID(playerid);
    new str[256];
    // Right, if a player enters a checkpoint, there in the green vehicle, and there team is green
    // Then it's a capture.
    if(playervehicleid == rivershellBlueTeamVehicleId && p_Team[playerid] == TEAM_GREEN)
    {   
        format(str,256,"* %s has captured the blue team's boat!",PlayerName(playerid));
        CShell__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);
        format(str,256,"* %s has captured one of your teams boats!",PlayerName(playerid));
        CShell__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);
        gGreenTimesCapped++;
        CShell__TextdrawUpdate();
        SetVehicleToRespawn(playervehicleid);
        if(gGreenTimesCapped == CAPS_TO_WIN) {
            format(str, sizeof(str), "~y~Rivershell~w~ has finished: ~g~~h~Green Team~w~ have won!");
            NewsController->show(str);
            CShell__End();
        }
    }

    else if(playervehicleid == rivershellGreenTeamVehicleId && p_Team[playerid] == TEAM_BLUE)
    {   
        format(str,256,"* %s has captured the green team's boat!",PlayerName(playerid));
        CShell__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);
        format(str,256,"* %s has captured one of your teams boats!",PlayerName(playerid));
        CShell__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);
        gBlueTimesCapped++;
        CShell__TextdrawUpdate();
        SetVehicleToRespawn(playervehicleid);
        if (gBlueTimesCapped == CAPS_TO_WIN) {
            format(str, sizeof(str), "~y~Rivershell~w~ has finished: ~b~~h~Blue Team~w~ have won!");
            NewsController->show(str);
            CShell__End();
        }
    }

    CShell__CheckStatus();
    CShell__TextdrawUpdate();
    CShell__SetVehicleParams();
    CShell__Debug("Checkpoint process finished.");
    return 1;
}


// CShell__StateUpdate. This gets called from OnPlayerState change and manages
// when the player actually gets inside the boat, and sets the checkpoint.
CShell__StateUpdate(playerid,newstate)
{
    CShell__Debug("CShell__StateUpdate process begun.");
    // Is the player in the game?
    if(!g_RivershellPlayer[playerid]) return CShell__Debug("Error processing statechange - player not in game.");
    // is the game running?
    if(g_RivershellState != RIVERSHELL_STATE_RUNNING) return CShell__Debug("Error processing statechange - Game not running.");
    // Has it got enough players?
    CShell__CheckStatus();
    // update our textdraw
    CShell__TextdrawUpdate();
    new
    vehicleid,
    str[256];

    if(newstate == PLAYER_STATE_DRIVER)
    {
        vehicleid = GetPlayerVehicleID(playerid);

        if(p_Team[playerid] == TEAM_GREEN && vehicleid == rivershellBlueTeamVehicleId)
        { 
            SetPlayerCheckpoint(playerid,1982.6150,-220.6680,-0.2432,7.0);
            gObjectiveGreenPlayer = playerid;
            format(str,256,"* %s is capturing the blue teams boat!",PlayerName(playerid));
            CShell__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);
            format(str,256,"* %s is capturing your teams boat!",PlayerName(playerid));
            CShell__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);
            GameTextForPlayer(playerid,"~w~Get the boat back to your ~n~~r~base!",5000,1);
            SendClientMessage(playerid,COLOR_PINK,"* Get the boat back to your base!");
        }

        if(p_Team[playerid] == TEAM_BLUE && vehicleid == rivershellGreenTeamVehicleId)
        { 
            SetPlayerCheckpoint(playerid,2328.2935,531.8324,0.0094,7.0);
            gObjectiveBluePlayer = playerid;
            GameTextForPlayer(playerid,"~w~Get the boat back to your ~n~~r~base!",5000,1);
            SendClientMessage(playerid,COLOR_PINK,"* Get the boat back to your base!");
            format(str,256,"* %s is capturing the green teams boat!",PlayerName(playerid));
            CShell__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,str);
            format(str,256,"* %s is capturing your teams boat!",PlayerName(playerid));
            CShell__TeamMsg(TEAM_GREEN,COLOR_GREEN,str);

        }
    }
    else if(newstate == PLAYER_STATE_ONFOOT)
    {
        if(playerid == gObjectiveGreenPlayer)
        {
            gObjectiveGreenPlayer = (-1);
            DisablePlayerCheckpoint(playerid);
        }

        if(playerid == gObjectiveBluePlayer)
        {
            gObjectiveBluePlayer = (-1);
            DisablePlayerCheckpoint(playerid);
        }
    }
    CShell__Debug("Statechange process finished.");
    return 1;
}

// CShell__SetVehicleParams
// this function sets the objective on both of the
// rivershell vehicles to 1.
CShell__SetVehicleParams()
{
    for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
    {
        if(!Player(j)->isConnected()) continue;
        if(!g_RivershellPlayer[j]) continue;
        switch(p_Team[j])
        {
        case TEAM_BLUE:
            {
                SetVehicleParamsForPlayer(rivershellGreenTeamVehicleId,j,1,0);
                SetVehicleParamsForPlayer(rivershellBlueTeamVehicleId,j,1,1);
            }
        case TEAM_GREEN:
            {
                SetVehicleParamsForPlayer(rivershellGreenTeamVehicleId,j,1,1);
                SetVehicleParamsForPlayer(rivershellBlueTeamVehicleId,j,1,0);
            }
        }
    }
}

// CShell__VehicleSpawn
// this function is called from OnVehicleSpawn and manages the setting
// of objectives for the rivershell boats, it is also called from OnVehicleDeath.
CShell__VehicleSpawn(vehicleid)
{
    // if the vehicle id is one of the boats which should have a vehicle objective, then
    // we set the vehicle objective, simple.
    if (vehicleid == rivershellGreenTeamVehicleId || vehicleid == rivershellBlueTeamVehicleId) {
        SetVehicleVirtualWorld(vehicleid, RIVERSHELL_WORLD);
        SetVehicleHealth(vehicleid, (200+(800*g_RivershellPlayers*0.25)));
        CShell__SetVehicleParams();
    }
}

// CShell__VehicleDeath
// Respawns the vehicles in the proper vworld
CShell__VehicleDeath(vehicleid) {
    for (new i; i<RIVERSHELL_VEHICLE_COUNT; i++) {
        if (vehicleid == rivershellSpawnedVehicles[i]) {
            SetVehicleToRespawn(vehicleid);
            SetVehicleVirtualWorld(vehicleid, RIVERSHELL_WORLD);
        }
    }

    // if the vehicle id is one of the boats which should have a vehicle objective, then
    // we set the vehicle objective, simple.
    if (vehicleid == rivershellGreenTeamVehicleId || vehicleid == rivershellBlueTeamVehicleId) {
        SetVehicleToRespawn(vehicleid);
        SetVehicleVirtualWorld(vehicleid, RIVERSHELL_WORLD);
        CShell__SetVehicleParams();

        // Lets send a message to everyone playing that the team boat has been destroyed
        if (vehicleid == rivershellGreenTeamVehicleId) {
            CShell__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,"Your team has destroyed the boat of the attackers!");
            CShell__TeamMsg(TEAM_GREEN,RIVERSHELL_BLUE,"Your boat has been destroyed!");
        }    
        else {
            CShell__TeamMsg(TEAM_GREEN,RIVERSHELL_BLUE,"Your team has destroyed the boat of the attackers!");
            CShell__TeamMsg(TEAM_BLUE,RIVERSHELL_BLUE,"Your boat has been destroyed!");
        }
    }
}

// CShell__SaveGuns
// This function simply stores the players weapons
CShell__SaveGuns(playerid)
{
    for(new i; i<13; i++)
    {
        GetPlayerWeaponData(playerid,i,CShell__Weapon[i],CShell__Ammo[i]);
    }
    return 1;
}

// CShell__LoadGuns
// This function simply loads the saved guns
CShell__LoadGuns(playerid)
{
    ResetPlayerWeapons(playerid);
    for(new i; i<13; i++)
    {
        GiveWeapon(playerid,CShell__Weapon[i],CShell__Ammo[i]);
    }
}

// CShell__MenuActivate
// Handles /minigames menu of rivershell
stock CShell__MenuActivate(playerid)
{

    if(IsPlayerInMinigame(playerid))
    {
        SendClientMessage(playerid,COLOR_RED,"You're already in another minigame!");
        return 1;
    }
    if(!IsPlayerMinigameFree(playerid))
    {
        SendClientMessage(playerid,COLOR_RED,"You have already signed up with a different minigame.");
        return 1;
    }

    if(g_RivershellState == RIVERSHELL_STATE_NONE)
    {
        CShell__SignupProcess(playerid);
        CShell__SignPlayerUp(playerid);
        return 1;
    }

    else if(g_RivershellState == RIVERSHELL_STATE_SIGNUP)
    {
        if(g_RivershellPlayer[playerid])
        {
            SendClientMessage(playerid,COLOR_RED,"You already signed up for rivershell!");
            return 1;
        }
        CShell__SignPlayerUp(playerid);

        return 1;
    }

    else
    {
        SendClientMessage(playerid,COLOR_RED,"Rivershell is already running.");
        return 1;
    }
}