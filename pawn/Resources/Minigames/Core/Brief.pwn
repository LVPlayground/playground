// Copyright 2006-2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*
Las Venturas Playground v2.90 Capture the brief minigame
This is a minigame that can only be triggered
by admins similar to killtime and chase, only offeres the
optinal choice of players to either join in or not for a small fee,
unlike chase/killtime which actually forces players to join in.

Author: Jay
*/

#define BRIEF_STATE_EMPTY           0
#define BRIEF_STATE_SIGNUP          1
#define BRIEF_STATE_RUNNING         2

#define BRIEF_VEHICLE_COUNT 24
#define BRIEF_DEBUG   0

new Float:BriefLoc[17] [ 3 ] =
{
    {0.0,0.0,0.0}, // Actually, Im leaving that in. That farm is not a bad place!
    {-833.4559,1491.4667,18.0273},
    {400.4245,2462.9167,16.5000},
    {-2796.7441,-1516.6399,139.1306},
    {-1022.7620,-682.3366,32.0078},
    {2653.7334,-1998.9243,13.5547},
    {707.8637,-1420.7826,13.5391},
    {-72.0181,-1126.4183,1.0781},
    {-1102.5094,-1653.3473,76.3672},
    {-2919.8850,469.1647,4.9141},
    {-678.3765,2056.2664,60.1875},
    {-657.1574,2325.9514,138.5040},
    {-1017.9278,1989.2240,120.6467},
    {2240.2412,-1315.8085,23.9844},
    {2774.8000,-2417.4785,13.6368},
    {369.8773,-2000.6139,7.6719},
    {546.5622,1463.7151,4.0038}
};



#define BRIEF_WORLD 202

#define BRIEF_ALLOW_SINGLE_PLAY 0

#define AIRPORT_HANGER 1282.1766,1329.8073,10.8203


new signedUpCount;
new briefCasePlayer;
new DynamicObject: BriefCase;
new iBriefColor[MAX_PLAYERS];
new iBriefStart;

new briefSpawnedVehicles[BRIEF_VEHICLE_COUNT + 8 /** idiocracy overflow protection **/];

new  DynamicMapIcon: briefMapIcons[2];           // Map icons for the helicopter and minigun pickup
new  briefPickups[3] = {-1, ...};            // Information pickup and Minigun pickup

#define     BRIEF_ELEMENT_MINIGUN   0
#define     BRIEF_ELEMENT_HELI      1
#define     BRIEF_ELEMENT_I_PICKUP  2

// ------------------------------------------
// Here we go again... :(



// CBrief__ChooseLocation
// This function basically finds a random
// Checkpoint to player the brief minigame
// with.
CBrief__ChooseLocation( &Float:X, &Float:Y, &Float:Z)
{
    new rand = random(sizeof(BriefLoc));
    X = BriefLoc[rand][0];
    Y = BriefLoc[rand][1];
    Z = BriefLoc[rand][2];
    return 1;
}


// CBrief__PositionPlayer
// This function basically positions a player up
// to a random spawnpoint in order to start the
// brief game. 
CBrief__PositionPlayer(playerid)
{
    SetPlayerVirtualWorld(playerid, BRIEF_WORLD);
    SetPlayerInterior(playerid, 0);
    SetCameraBehindPlayer(playerid);
    RemovePlayerFromVehicle(playerid);
    SetPlayerPos(playerid, 1313.5991+ random(6), 1296.2303 + random(6), 10.8203);
    // bla
    return 1;
}

// CBrief__SignPlayerUp
// This function simply signs a player up for
// The minigame when it is in the signup
// State.

CBrief__SignPlayerUp(playerid)
{
    if(briefStatus != BRIEF_STATE_SIGNUP)
    {
        return 0;
    }

    if(isPlayerBrief[playerid])
    {
        return 0;
    }

    isPlayerBrief[playerid] = 1;
    signedUpCount++;

    TakeRegulatedMoney(playerid, CaptureBriefcaseParticipation);
    Responses->respondMinigameSignedUp(playerid, CaptureBriefcaseMinigame, "Capture the Briefcase", 20);

    new message[128];
    format(message, sizeof(message), "~r~~h~%s~w~ has signed up for ~y~Capture the Briefcase~w~ (~p~/brief~w~)", Player(playerid)->nicknameString());
    NewsController->show(message);

    return 1;
}

// CBrief__SignPlayerOut
// This function basically does the oppossite
// of CBrief__SignPlayerUp. basically, it signs
// The player out of the minigame, incase they
// Get bored or something.

CBrief__SignPlayerOut(playerid)
{
    if(!isPlayerBrief[playerid])
    {
        return 0;
    }

    if (briefStatus == BRIEF_STATE_RUNNING) {
        DisablePlayerCheckpoint(playerid);
        RemovePlayerFromVehicle(playerid);

        new str[128];
        if(briefCasePlayer == playerid)
        {
            new Float:x,Float:y,Float:z;
            briefCasePlayer = -1;
            format(str,128,"%s has left the game! The briefcase has been dropped at %s's location!",PlayerName(playerid),PlayerName(playerid));
            CBrief__Announce(str);
            DestroyDynamicObject(BriefCase);
            // Create object?
            GetPlayerPos(playerid,x,y,z);
            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(Player(i)->isConnected() && isPlayerBrief[i] && i != playerid)
                {
                    DisablePlayerCheckpoint(i);
                    SetPlayerCheckpoint(i,x,y,z,2.0);
                }
            }
        }

        SetPlayerVirtualWorld(playerid,0);
        SpawnPlayer(playerid);
        ColorManager->releasePlayerMinigameColor(playerid);
    }

    GiveRegulatedMoney(playerid, CaptureBriefcaseParticipation);
    isPlayerBrief[playerid] = 0;
    signedUpCount--;
    return 1;
}


// CBrief__Checkpoint
// This function is called when
// A player enters the brief checkpoint.

CBrief__Checkpoint(playerid)
{
    #if BRIEF_DEBUG == 1
    SendClientMessageToAll(COLOR_GREY,"CBrief__Checkpoint - START");
    #endif
    new str[128];
    if(!IsPlayerInAnyVehicle(playerid))
    {
        if(briefCasePlayer == playerid) // if the player enters the cp with the brief case, aye wollah!
        {
            #if BRIEF_DEBUG == 1
                SendClientMessageToAll(COLOR_GREY,"CBrief__Checkpoint - ENDGAME");
            #endif
            WonMinigame[playerid]++;
            GiveRegulatedMoney(playerid, CaptureBriefcaseVictory);

            format(str, sizeof(str), "You have successfully delivered the briefcase! Here is your $%s.",
                formatPrice(GetEconomyValue(CaptureBriefcaseVictory)));

            SendClientMessage(playerid,COLOR_PINK,str);           
            format(str, sizeof(str), "~y~Capture the Briefcase~w~ has finished: ~r~~h~%s~w~ has deliverd the briefcase!", Player(playerid)->nicknameString());
            NewsController->show(str);
            CBrief__Cancel();
            return 1;
        }

        if(briefCasePlayer > -1) // But if its not the player that enters the cp
        {
            #if BRIEF_DEBUG == 1
                SendClientMessageToAll(COLOR_GREY,"CBrief__Checkpoint - LOSER AT FINISH");
            #endif
            format(str,128,"Stop %s from delivering the brief case to this location.",PlayerName(briefCasePlayer));
            SendClientMessage(playerid,COLOR_PINK,str);
            ShowBoxForPlayer(playerid, str);
            GameTextForPlayer(playerid,"~r~Don't let them deliver the briefcase!",5000,5);
            return 1;
        }

        if(briefCasePlayer == -1) // If nobody has found the briefcase yet.
        {
            #if BRIEF_DEBUG == 1
                SendClientMessageToAll(COLOR_GREY,"CBrief__Checkpoint - PICKING UP BRIEFCASE");
            #endif
            briefCasePlayer = playerid;

            format(str,128,"%s has the briefcase! Stop them before they reach the airport!",PlayerName(playerid));
            CBrief__Announce(str);

            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(!Player(i)->isConnected()) continue;
                if(!isPlayerBrief[i]) continue;
                DisablePlayerCheckpoint(i);
                SetPlayerCheckpoint(i,AIRPORT_HANGER,5.0);
            }
            SendClientMessage(playerid,COLOR_WHITE,"* Deliver this briefcase to the Airport hanger in Las Venturas Airport!");
            GameTextForPlayer(playerid,"~r~Briefcase collected!",5000,6);
            ShowBoxForPlayer(playerid, "Deliver the brief to LV Airport - Marked red on your radar!");

            // Display this player as blue so they're recognizable.
            ColorManager->setPlayerMinigameColor(playerid, COLOR_BLUE);

            if(!IsValidDynamicObject(BriefCase))
            {
                #if BRIEF_DEBUG == 1
                    SendClientMessageToAll(COLOR_GREY,"CBrief__Checkpoint - MAKING OBJECT AGAIN (should not happen)");
                #endif
                new Float:x,Float:y,Float:z;
                BriefCase = CreateDynamicObject(1210,x,y,z,0,0,0, BRIEF_WORLD);

            }
            //AttachObjectToPlayer(BriefCase,playerid,0,0,2,0,0,0);
            return 1;
        }
    }
    else
    {
        GameTextForPlayer(playerid,"~n~~n~~w~Exit your vehicle!",5000,5);
    }
        #if BRIEF_DEBUG == 1
        SendClientMessageToAll(COLOR_GREY,"CBrief__Checkpoint - END");
        #endif
    return 1;
}

// CBrief__Death
// This function simply gets called when someone
// Dies who is in the brief minigame. When they do die,
// They drop out of the game.

CBrief__Death(playerid, killerid = Player::InvalidId)
{   
    #if BRIEF_DEBUG == 1
        SendClientMessageToAll(COLOR_GREY,"CBrief__Death - START");
    #endif

    new str[128];


    if(briefCasePlayer == playerid)
    { // DROP THE SOAP
        #if BRIEF_DEBUG == 1
            SendClientMessageToAll(COLOR_GREY,"CBrief__Death - BRIEF CARRIER DEAD");
        #endif
        new Float:x,Float:y,Float:z;
        briefCasePlayer = -1;
        GetPlayerPos(playerid,x,y,z);
        SetDynamicObjectPos(BriefCase,x,y,z+4); // Move it off of the carrier, and on to the ground (up a bit)
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(Player(i)->isConnected() && isPlayerBrief[i] && i != playerid)
            {
                DisablePlayerCheckpoint(i);
                SetPlayerCheckpoint(i,x,y,z,1.5);
            }
        }

        // Specific messages
        if(!Player(killerid)->isConnected())
        { // They suicided? WITH THE CASE?
            format(str,128,"%s has killed himself and dropped the briefcase!",PlayerName(playerid));
            CBrief__Announce(str);

        }
        else 
        { // Someone killed them!
            format(str,128,"%s has killed %s with the briefcase! %s has dropped it at the red marker!",PlayerName(killerid),PlayerName(playerid),PlayerName(playerid));
            CBrief__Announce(str);      
        }

    }

    #if BRIEF_DEBUG == 1
        SendClientMessageToAll(COLOR_GREY,"CBrief__Death - END");
    #endif
        // Reset the playerid's variables
    DisablePlayerCheckpoint(playerid);
    isPlayerBrief[playerid] = false;
    signedUpCount--;
    SetPlayerVirtualWorld(playerid,0);

    // Reset the player's color and time overrides since they're no longer participating.
    ColorManager->releasePlayerMinigameColor(playerid);
    TimeController->releasePlayerOverrideTime(playerid);

    return 1;
}

// CBrief__Initalize.
// This simple function is called when the brief minigame
// goes into the signup state, and manages people signing up
// And stuff.
CBrief__Initalize(playerid)
{
    briefCasePlayer = -1;

    if(briefStatus != BRIEF_STATE_EMPTY)
    {
        return 0;
    }

    signedUpCount = 0; // Initialize is called first, then SignUp
    GameTextForAllEx("~y~Capture the Briefcase~w~ is now signing up!~n~Want to join? ~r~/brief~w~!", 5000, 5);
    Announcements->announceMinigameSignup(CaptureBriefcaseMinigame, "Capture the Briefcase", "/brief", 100, playerid);

    iBriefStart = Time->currentTime();
    briefStatus = BRIEF_STATE_SIGNUP;
    return 1;
}



// Cbrief__Cancel
// This function is called when the
// brief minigame gets cancelled for
// whatever reason.
CBrief__Cancel()
{
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected()) continue;
        if(!isPlayerBrief[i]) continue;


        if(briefStatus == BRIEF_STATE_RUNNING)
        {
            RemovePlayerFromVehicle(i);
            SetVehicleToRespawn(GetPlayerVehicleID(i));
            SpawnPlayer(i);
            DisablePlayerCheckpoint(i);
            SetPlayerVirtualWorld(i,0);
            // Release their minigame color and time override since they're no longer playing.
            ColorManager->releasePlayerMinigameColor(i);
            TimeController->releasePlayerOverrideTime(i);
        } else {
            GiveRegulatedMoney(i, CaptureBriefcaseParticipation);
            ShowBoxForPlayer(i, "Not enough players have signed up for Capture the Briefcase. You have been refunded.");
        }

        isPlayerBrief[i] = 0;
    }

    briefCasePlayer = -1;
    signedUpCount = 0;
    briefStatus = BRIEF_STATE_EMPTY;
    DestroyDynamicObject(BriefCase);
    briefInitializeElements(false);
    return 1;
}
// CBrief__StateChange
// This gets called when someones state changes who is on the brief minigame
// to basically stop people from getting in as passenger. If someone looses
// His/her car though, since its in another world, there fucked.

CBrief__StateChange(playerid,newstate)
{
    if(newstate == PLAYER_STATE_ONFOOT)
    {
        if(IsPlayerInCheckpoint(playerid) && isPlayerBrief[playerid] && briefStatus == BRIEF_STATE_RUNNING)
        {
            CBrief__Checkpoint(playerid);
        }
    }
}

// CBrief__Announce
// This simple function sends a message to the people playing the brief minigame.
CBrief__Announce(msg[])
{
    if(briefStatus != BRIEF_STATE_RUNNING) return 0;
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
        {
            continue;
        }

        if(!isPlayerBrief[i])
        {
            continue;
        }

        ShowBoxForPlayer(i, msg);
        SendClientMessage(i, COLOR_WHITE, msg);
    }
    return 1;
}

// CBrief__CheckEmpty
// Called from LVP's main timers, this simply checks if the game is empty, and ends
// it if it is.

CBrief__CheckEmpty()
{
    #if BRIEF_ALLOW_SINGLE_PLAY == 0

    if(signedUpCount <= 1 && briefStatus == BRIEF_STATE_RUNNING)
    {
        CBrief__Cancel();
    }
    #endif

    return 1;
}


// CBrief__MenuActivate
// Called from OnPlayerSelectedMenuRow, to handle the minigame menu
CBrief__MenuActivate(playerid)
{

    if(IsPlayerInMinigame(playerid))
    {
        SendClientMessage(playerid,COLOR_RED,"* You're already in another minigame!");
        return 1;
    }

    if(!IsPlayerMinigameFree(playerid))
    {
        SendClientMessage(playerid,COLOR_RED,"* You have already signed up with a different minigame.");
        return 1;
    }

    if(briefStatus == BRIEF_STATE_RUNNING)
    {
        SendClientMessage(playerid,COLOR_RED,"* The capture the brief minigame is already running!");
        return 1;
    }

    if(isPlayerBrief[playerid])
    {
        SendClientMessage(playerid,COLOR_RED,"* You have already signed up for the capture the brief minigame!");
        return 1;
    }

    if(GetPlayerMoney(playerid) < 100)
    {
        SendClientMessage(playerid,COLOR_RED,"* You need $100 to take part in the game!");
        return 1;
    }


    new str[128];
    if(briefStatus == BRIEF_STATE_EMPTY)
    {
        CBrief__Initalize(playerid);
        format(str,128,"%s (Id:%d) has signed up for /brief.",PlayerName(playerid),playerid);
        Admin(playerid, str);
        CBrief__SignPlayerUp(playerid);
        return 1;
    }
    if(!isPlayerBrief[playerid])
    {
        CBrief__SignPlayerUp(playerid);
        format(str,128,"%s (Id:%d) has signed up for /brief.",PlayerName(playerid),playerid);
        Admin(playerid, str);
        return 1;
    }

    else
    {
        SendClientMessage(playerid,COLOR_RED,"You have already signed up!");
        return 1;
    }
}


// BriefStart
// This gets called when the minigame comes out of the signup
// state, and actually starts.

CBrief__Start()
{
    #if BRIEF_ALLOW_SINGLE_PLAY == 0
        if(signedUpCount < 2)
        {
            return CBrief__Cancel();
        }
    #endif

    if(briefStatus != BRIEF_STATE_SIGNUP)
    {
        return 0;
    }

    briefInitializeElements(true);

    briefStatus = BRIEF_STATE_RUNNING;
    new Float:x,Float:y,Float:z;
    CBrief__ChooseLocation(x,y,z);
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
            continue;

        if(isPlayerBrief[i])
        {
            CBrief__Debug(i,"Recognized in loop... Beggining settings");
            ResetPlayerWeapons(i);
            SetPlayerHealth(i,100.0);
            SetPlayerArmour(i,100.0);

            ResetPlayerGunData(i);

            GiveWeapon(i,27,25);
            GiveWeapon(i,35,1);
            GiveWeapon(i,34,3);
            GiveWeapon(i,16,6);
            GiveWeapon(i,30,40);
            GiveWeapon(i,29,550);
            GiveWeapon(i,23,400);
            SetPlayerWeather(i,20);
            SetPlayerInterior(i,0);
            SetPlayerVirtualWorld(i,BRIEF_WORLD);

            TimeController->setPlayerOverrideTime(i, 0, 0);

            // Give them a white color to indicate that they're part of the game.
            ColorManager->setPlayerMinigameColor(i, COLOR_WHITE);

            CBrief__PositionPlayer(i);
            SendClientMessage(i,COLOR_WHITE,"--------------------------------------");
            SendClientMessage(i,COLOR_ORANGE,"Get the briefcase marked red on your radar.");
            SendClientMessage(i,COLOR_ORANGE,"The briefcase is worth $2,000,000 and other");
            SendClientMessage(i,COLOR_ORANGE,"players are competing to get it as you read this.");
            SendClientMessage(i,COLOR_ORANGE,"So what are you waiting for? Don't let anyone else get it!");
            SendClientMessage(i,COLOR_ORANGE,"Drive your vehicle carefully because it is the only vehicle you get.");
            SendClientMessage(i,COLOR_WHITE,"--------------------------------------");
            GameTextForPlayer(i,"~r~Get the briefcase!",5000,1);
            ShowBoxForPlayer(i, "Get the ~r~briefcase~w~!");
            CBrief__Debug(i,"Opening airport gate and generating position / colour.");
            OpenAirportGate();
            SetPlayerCheckpoint(i,x,y,z,6.0);
            CBrief__Debug(i,"End of settings...");
        }
    }

    BriefCase = CreateDynamicObject(1210,x,y,z+3,0,0,0);
    return 1;
}

// Initialize all elements for the brief minigame.
// Called
briefInitializeElements(bool:init = true)
{

    if(init == true)
    {
        // First of all init the vehicles
        new currentVehicleSpawn = 0;

        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(522, 1294.7922, 1512.2474, 10.3845, 270.6675, 0, 0); // nrg
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(560, 1328.5912, 1278.7228, 10.5254, 359.2509, 0, 0); // sultan
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(402, 1325.4341, 1278.5778, 10.5812,   0.1149, 0, 0); // buffalo
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(560, 1322.3239, 1278.4459, 10.5256, 359.3489, 0, 0); // sult
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(402, 1309.4573, 1279.3864, 10.5811, 359.4888, 0, 0); // buffalo
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(560, 1306.2756, 1279.0846, 10.5254, 359.1237, 0, 0); // sultan
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(560, 1312.5337, 1279.1021, 10.5247, 359.7400, 0, 0); // sultan
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(463, 1282.4581, 1307.2551, 10.3605, 272.9075, 0, 0); // freeway
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(567, 1281.8204, 1297.3275, 10.6915, 270.0925, 0, 0); // savanna
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(507, 1282.6501, 1287.6699, 10.6447, 270.0067, 0, 0); // elegy
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(437, 1284.6283, 1254.1519, 10.9537, 357.9431, 0, 0); // coach
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(578, 1344.4004, 1226.6958, 11.4446, 272.3427, 0, 0); // dft
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(463, 1282.6266, 1303.1409, 10.3601, 263.2246, 0, 0); // freeway
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(463, 1282.1278, 1300.7966, 10.3609, 269.5436, 0, 0); // freeway
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(475, 1353.4948, 1248.4668, 10.6238, 275.1039, 0, 0); // abre
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(475, 1354.1270, 1242.9294, 10.6248, 273.6325, 0, 0); // sabre
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(475, 1354.8348, 1237.1482, 10.6210, 271.5106, 0, 0); // abre
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(475, 1353.7266, 1231.0126, 10.6259, 268.8815, 0, 0); // sabre
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(496, 1344.9875, 1288.8308, 10.5364,  89.2711, 0, 0); // blista
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(489, 1345.4393, 1295.3221, 10.9646,  89.4502, 0, 0); // rancher
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(496, 1345.2234, 1302.0111, 10.5370,  90.2966, 0, 0); // blista
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(489, 1344.7828, 1310.0685, 10.9629,  91.0086, 0, 0); // rancher
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(496, 1344.7609, 1318.7450, 10.5366,  92.3038, 0, 0); // blista
        briefSpawnedVehicles[currentVehicleSpawn++] = VehicleManager->createVehicle(487, 2924.5654, 2109.3589, 21.9115,  89.3189, 0, 0); // maverick_near_creek north east lv

        // Make sure that we don't spawn more vehicles than expected.
        if (currentVehicleSpawn != BRIEF_VEHICLE_COUNT) {
            printf("WARNING: Too much vehicles have been spawned for the Brief minigame.");
        }

        // Minigun Map icon. Set the type so its visible at all times
        briefMapIcons[BRIEF_ELEMENT_MINIGUN] = CreateDynamicMapIcon(-1154.1053, 839.4493, 34.5781, 6, 0, BRIEF_WORLD, -1, -1, 4000);
        Streamer_SetIntData(STREAMER_TYPE_MAP_ICON, briefMapIcons[BRIEF_ELEMENT_MINIGUN], E_STREAMER_STYLE, 1);

        // Heli map icon
        briefMapIcons[BRIEF_ELEMENT_HELI] = CreateDynamicMapIcon(2924.5654, 2109.3589, 21.9115,3, 0, BRIEF_WORLD, -1, -1, 4000);
        Streamer_SetIntData(STREAMER_TYPE_MAP_ICON, briefMapIcons[BRIEF_ELEMENT_HELI], E_STREAMER_STYLE, 1);

        // Minigun Pickup
        briefPickups[BRIEF_ELEMENT_MINIGUN] = CreatePickup(362, 2, -1154.1053, 839.4493, 34.5781, BRIEF_WORLD);

        // Information pickup
        briefPickups[BRIEF_ELEMENT_I_PICKUP] = CreatePickup(1239, 3, 1295.7896,1350.5293,10.8203, BRIEF_WORLD);

        for(new vehicleIndex = 0; vehicleIndex < BRIEF_VEHICLE_COUNT; ++vehicleIndex)
            SetVehicleVirtualWorld(briefSpawnedVehicles[vehicleIndex], BRIEF_WORLD);

        return;
    }

    // Since we're still here the init parameter is false so we have to destroy everything

    // Destroy the vehicle first
    for(new vehicleIndex = 0; vehicleIndex < BRIEF_VEHICLE_COUNT; ++vehicleIndex)
        VehicleManager->destroyVehicle(briefSpawnedVehicles[vehicleIndex]);

    // Map icons
    for(new i = 0; i < 2; i++)
    {
        DestroyDynamicMapIcon(briefMapIcons[i]);
        briefMapIcons[i] = DynamicMapIcon: -1;
    }

    // Pickups \o
    for(new i = 0; i < 3; i++)
    {
        if(i == BRIEF_ELEMENT_HELI)     // No pickup for the heli!
        {
            continue;
        }

        DestroyPickup(briefPickups[i]);
        briefPickups[i] = -1;
    }
    // doneorz
}

// CBrief__CheckPickup
// Called from OnPlayerPickupPickup and checks if
// the picked up pickup is the information pickup in this minigame
CBrief__CheckPickup(playerid, pickupid)
{
    if(pickupid == briefPickups[BRIEF_ELEMENT_I_PICKUP])
    {
        ShowBoxForPlayer(playerid, "When the briefcase has been collected, the player must bring it back to this destination. It may be a good idea to idle here and wait for the returning player to bring the brief back, so you can kill them and take the briefcase!");
        return 1;
    }
    return 0;
}

// CBrief__Process
// this function is called every second and checks if it is time to start the brief minigame
CBrief__Process()
{
    if(briefStatus == BRIEF_STATE_SIGNUP)
    {
        if(Time->currentTime() - iBriefStart > 25)
        CBrief__Start();
    }
}

CBrief__Debug(playerid,msg[])
{
    #if BRIEF_DEBUG == 1
    SendClientMessage(playerid,COLOR_GREY,msg);
    #else
    #pragma unused playerid,msg
    #endif

    return 1;
}

// end of capture the briefcase.
