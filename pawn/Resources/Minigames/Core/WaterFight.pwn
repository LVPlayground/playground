// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

    Las Venturas Playground v2.94 - Water fight minigame
    Player spawn on a huge glass square thingie and must shoot the plates
    of glass at the positions of other players to break the glass and make them
    fall down, whilst trying to survive themselves.

    Author: James "Jay" Wilkinson
    LVP 2.94 Lead developer

    Special Thanks: iMonk3y for his Getwet Minigame and some co-ords

    Date: 28th October 2011
    21:55

*******************************************************************************/

#define     WATER_FIGHT_STATE_IDLE          0
#define     WATER_FIGHT_STATE_SIGNUP        1
#define     WATER_FIGHT_STATE_COUNTDOWN     2
#define     WATER_FIGHT_STATE_RUNNING       3

#define     WATER_FIGHT_WORLD               2       // World ID the game takes place in

#define     WATER_FIGHT_MAX_OBJECTS         54      //Don't change this

#define     WATER_FIGHT_MIN_PLAYERS         2

#define     WATER_FIGHT_MAX_RUNTIME         60      // Max time the minigame can run for.

#define     WATER_FIGHT_MAX_HEALTH          50000 // Max Health in the minigame.

#define     WATER_FIGHT_MIN_HEALTH          100 // Min Health in the minigame.

static  bool:waterFightSignedUp[MAX_PLAYERS];
static  waterFightPlayers;              // Number of players signed up.

static  waterFightState;
static  waterFightInitTime;             // Store the time the minigame initialized.

static  waterFightCountdown = 5;        // The remaining seconds of the countdown

static  waterFightStartTime;            // Stores the time the minigame started.

// Store all object IDs used in the handler
static  DynamicObject: waterFightObject[WATER_FIGHT_MAX_OBJECTS];

// Credits to iMonkey for his Getwet minigame
static Float:waterFightObjectCoords[WATER_FIGHT_MAX_OBJECTS][7] = {

    { -5309.198120,-199.052383,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.198120,-195.786071,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.198120,-192.510620,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.198120,-189.250564,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.198120,-185.987960,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.198120,-182.727081,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.198120,-179.463394,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.198120,-176.205261,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-176.205261,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-179.468795,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-182.737884,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-185.989654,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-189.259185,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-192.518615,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-195.785491,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.841796,-199.054733,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-199.054733,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-195.782165,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-192.531250,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-189.274765,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-186.003005,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-182.735229,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-179.471069,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.489990,-176.208007,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-176.208007,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-179.479248,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-182.744735,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-186.002944,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-189.274505,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-192.533691,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-195.788970,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.138061,-199.048782,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-199.050140,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-195.790634,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-192.542922,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-189.277542,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-186.013275,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-182.742355,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-179.475021,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.776000,-176.215805,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-176.215805,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-179.485168,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-182.739608,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-186.016723,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-189.277816,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-192.539001,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-195.796325,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.432250,-199.053771,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5287.431274,-202.320648,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5291.781616,-202.320648,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5296.136718,-202.320648,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5300.493652,-202.320648,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5304.848876,-202.320648,22.593704,-90.000000,0.000000,0.000000,150.0 },
    { -5309.201660,-202.320648,22.593704,-90.000000,0.000000,0.000000,150.0 }
};


// Initialize the game, create the objects, and put it into its signup phase
waterFightInitialize()
{
    waterFightInitObjects();
    waterFightSetState(WATER_FIGHT_STATE_SIGNUP);
    waterFightInitTime = Time->currentTime();
}


// 20 seconds have passed. Start the game!
waterFightStart()
{
    waterFightSetState(WATER_FIGHT_STATE_COUNTDOWN);
    waterFightCountdown = 5;
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
        {
            continue;
        }

        if(IsPlayerNPC(i))
        {
            continue;
        }

        if(!waterFightIsPlayerSignedUp(i))
        {
            continue;
        }

        waterFightSpawnPlayer(i);
    }
}

// End the water fight minigame
waterFightEnd()
{
    waterFightDestroyObjects();
    waterFightSetState(WATER_FIGHT_STATE_IDLE);
    waterFightInitTime = 0;
}


// Create the water fight objects
waterFightInitObjects()
{
    for(new i = 0; i < WATER_FIGHT_MAX_OBJECTS; i++)
    {
        waterFightObject[i] = CreateDynamicObject( 1649, waterFightObjectCoords[i][0], waterFightObjectCoords[i][1], waterFightObjectCoords[i][2], waterFightObjectCoords[i][3], waterFightObjectCoords[i][4], waterFightObjectCoords[i][5], WATER_FIGHT_WORLD);
    }
}

// Destroy the objects
waterFightDestroyObjects()
{
    for(new i = 0; i < WATER_FIGHT_MAX_OBJECTS; i++)
    {
        DestroyDynamicObject(waterFightObject[i]);
        waterFightObject[i] = DynamicObject: INVALID_OBJECT_ID;
    }
}


// Called every second from LVPs main timers to check for players falling off,
// or start/end the minigame.
waterFightProcess()
{
    // Check if 15 seconds have passed to start the minigame
    if(waterFightInitTime != 0 && waterFightGetState() == WATER_FIGHT_STATE_SIGNUP)
    {
        if(Time->currentTime() - waterFightInitTime >= 20)
        {
            // Check if enough players have signed up. if not refund the ones that did sign up.
            if (waterFightPlayers < WATER_FIGHT_MIN_PLAYERS)
            {
                for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
                {
                    if(!Player(i)->isConnected())
                    {
                        continue;
                    }

                    if(IsPlayerNPC(i))
                    {
                        continue;
                    }

                    if(!waterFightIsPlayerSignedUp(i))
                    {
                        continue;
                    }

                    ShowBoxForPlayer(i, "Not enough players have signed up for WaterFight. You have been refunded.");
                    waterFightRemovePlayer(i);
                }

                waterFightEnd();
                return;
            }

            waterFightStart();
            waterFightInitTime = Time->currentTime();
        }

        return;
    }

    // Check to process the countdown and start the minigame when it has finished counting.
    // Only start the countdown after 1 second has passed though to allow for everything to properly initialize
    if(waterFightGetState() == WATER_FIGHT_STATE_COUNTDOWN && Time->currentTime() - waterFightInitTime > 1)
    {

        new szCountdownStr[128];
        format(szCountdownStr, 128, "~n~Starting in...~n~%d", waterFightCountdown);

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected())
            {
                continue;
            }

            if(IsPlayerNPC(i))
            {
                continue;
            }

            if(!waterFightIsPlayerSignedUp(i))
            {
                continue;
            }

            if(waterFightCountdown > 0)
            {
                GameTextForPlayer(i, szCountdownStr, 5000, 5);
                PlayerPlaySound(i, 5201, 0, 0, 0);
            }
            else
            {
                TogglePlayerControllable(i, true);
                PlayerPlaySound(i, 3200, 0, 0, 0);
                GameTextForPlayer(i, "~g~go!", 5000, 5);
                SetCameraBehindPlayer(i);
            }
        }

        // Start the minigame
        if(waterFightCountdown == 0)
        {
            // Since we're still here we have enough players to start
            waterFightSetState(WATER_FIGHT_STATE_RUNNING);
            waterFightStartTime = Time->currentTime();
        }
        waterFightCountdown--;
        return;
    }

    // Check the any players have fell off
    if(waterFightGetState() == WATER_FIGHT_STATE_RUNNING)
    {
        // Check to end it
        if(Time->currentTime() -  waterFightStartTime > WATER_FIGHT_MAX_RUNTIME)
        {
            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(!Player(i)->isConnected())
                {
                    continue;
                }

                if(IsPlayerNPC(i))
                {
                    continue;
                }

                if(!waterFightIsPlayerSignedUp(i))
                {
                    continue;
                }
                waterFightRemovePlayer(i);
            }
            waterFightEnd();
            return;
        }

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected())
            {
                continue;
            }

            if(IsPlayerNPC(i))
            {
                continue;
            }

            if(!waterFightIsPlayerSignedUp(i))
            {
                continue;
            }

            new
                Float:fPosX,
                Float:fPosY,
                Float:fPosZ;

            GetPlayerPos(i, fPosX, fPosY, fPosZ);
            if(fPosZ < 2.0)
            {
                waterFightRemovePlayer(i);
                GameTextForPlayer(i, "~r~You're out!", 5000, 5);
            }
        }
    }

    // Check to end the minigame
    if(waterFightGetState() == WATER_FIGHT_STATE_RUNNING)
    {
        if(waterFightPlayers <= 1)
        {
            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(!Player(i)->isConnected())
                {
                    continue;
                }

                if(IsPlayerNPC(i))
                {
                    continue;
                }

                if(!waterFightIsPlayerSignedUp(i))
                {
                    continue;
                }

                new szEndMsg[128];
                format(szEndMsg, sizeof(szEndMsg), "~y~WaterFight~w~ has finished: ~r~~h~%s~w~ has won!", Player(i)->nicknameString());
                NewsController->show(szEndMsg);
                ShowBoxForPlayer(i, "You have won the WaterFight minigame!");
                waterFightRemovePlayer(i);
                WonMinigame[ i ]++;
                waterFightEnd();
                break;
            }
        }
    }
}


// Sign the player up
waterFightSignPlayerUp(playerid)
{
    if(waterFightGetState() != WATER_FIGHT_STATE_SIGNUP)
    {
        return;
    }

    if(waterFightSignedUp[playerid] == true)
    {
        return;
    }

    waterFightPlayers++;
    waterFightSignedUp[playerid] = true;
}

// Remove the player from the minigame. Either they have been knocked out or
// they have /left
waterFightRemovePlayer(playerid, bool:bLoadData = true)
{
    if(waterFightSignedUp[playerid] == false)
    {
        return;
    }
    SetPlayerHealth(playerid, WATER_FIGHT_MIN_HEALTH);
    waterFightPlayers--;
    waterFightSignedUp[playerid] = false;

    if (waterFightGetState() == WATER_FIGHT_STATE_SIGNUP)
        GiveRegulatedMoney(playerid, MinigameParticipation);

    if(waterFightGetState() == WATER_FIGHT_STATE_RUNNING && bLoadData == true)
    {
        SetPlayerTeam(playerid, NO_TEAM);
        waterFightLoadData(playerid);
    }
}

waterFightOnDisconnect(playerid)
{
    waterFightRemovePlayer(playerid);
}

// Return the status of a player (i.e. have they signed up or not)
waterFightIsPlayerSignedUp(playerid)
{
    if(waterFightSignedUp[playerid] == true)
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

// return 1 if the player is playing the minigame otherwise 0
waterFightIsPlayerPlaying(playerid)
{
    if(waterFightGetState() != WATER_FIGHT_STATE_RUNNING)
    {
        return 0;
    }
    return waterFightIsPlayerSignedUp(playerid);
}

// Spawn the player on top of the water fight object thingie.
waterFightSpawnPlayer(playerid)
{
    waterFightSaveData(playerid);

    SetPlayerVirtualWorld(playerid, WATER_FIGHT_WORLD);
    ResetPlayerWeapons(playerid);

    SetPlayerHealth(playerid, WATER_FIGHT_MAX_HEALTH);
    SetPlayerArmour(playerid, 0);
    SetPlayerTeam(playerid, 1);

    GiveWeapon(playerid, 25, 9000);

    TogglePlayerControllable(playerid, 0);

    // Position the player.
    new iRandSpawn = random(WATER_FIGHT_MAX_OBJECTS);
    SetPlayerPos(playerid, waterFightObjectCoords[iRandSpawn][0], waterFightObjectCoords[iRandSpawn][1], waterFightObjectCoords[iRandSpawn][2]+1);

    ShowBoxForPlayer(playerid, "LAST MAN STANDING:~n~Use the ~y~Shotgun~w~ to shoot the glass and make other players fall into the water.");
    Streamer_Update(playerid);

    SetPlayerCameraPos( playerid, -5298.4814,-218.4391,42.1386);
    SetPlayerCameraLookAt(playerid, -5298.1616,-189.6903,23.6564);

}

// This is called from OnPlayerStateChange.
// If the player playing water fight and their state changes they are
// removed from the minigame.
waterFightStateChange(playerid)
{
    if(waterFightIsPlayerPlaying(playerid))
    {
        waterFightRemovePlayer(playerid);
    }
}

// Svae the players game state prior to the minigame starting.
waterFightSaveData(playerid)
{
    SavePlayerGameState(playerid);
}

// Retireve previously saved data. Useful for when the minigame has ended
waterFightLoadData(playerid)
{
    LoadPlayerGameState(playerid);
}


// Set the current state of the minigame. See the defines at the top
waterFightSetState(iState)
{
    waterFightState = iState;
}

// Return the current state of the minigame
waterFightGetState()
{
    return waterFightState;
}

// Called when a player types /waterfight cmd
OnWaterFightCmdText(playerid)
{
    if(IsPlayerInMinigame(playerid))
    {
        ShowBoxForPlayer(playerid, "You have already signed up for another minigame. Use /leave or /signout first.");
        return 1;
    }

    if (ShipManager->isPlayerWalkingOnShip(playerid))
    {
        ShowBoxForPlayer(playerid, "You should get off the ship to use this command!");
        return 1;
    }

    if(waterFightGetState() > WATER_FIGHT_STATE_SIGNUP)
    {
        ShowBoxForPlayer(playerid, "Water fight is currently in progress! Try again later!.");
        return 1;
    }

    new const price = GetEconomyValue(MinigameParticipation);
    if(GetPlayerMoney(playerid) < price)
    {
        ShowPlayerBox(playerid, "It costs $%d to join Water fights!", price);
        return 1;
    }

    TakeRegulatedMoney(playerid, MinigameParticipation);

    new szAdminMsg[128];

    // Start the minigame
    if (waterFightGetState() == WATER_FIGHT_STATE_IDLE) {
        waterFightInitialize();
        Announcements->announceMinigameSignup(WaterFightMinigame, "WaterFight", "/waterfight", price, playerid);
        GameTextForAllEx("~y~WaterFight~w~ is now signing up!~n~Want to join? ~r~/waterfight~w~!", 5000, 5);
    }
    Responses->respondMinigameSignedUp(playerid, WaterFightMinigame, "WaterFight", 20);
    format(szAdminMsg, sizeof(szAdminMsg), "~r~~h~%s~w~ has signed up for ~y~WaterFight~w~ (~p~/waterfight~w~)", Player(playerid)->nicknameString());
    NewsController->show(szAdminMsg);

    format(szAdminMsg, 128, "%s (Id:%d) has signed up for /waterfight.", PlayerName(playerid), playerid);
    Admin(playerid, szAdminMsg);
    waterFightSignPlayerUp(playerid);

    return 1;
}
