// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*                                                                              *
*           Las Venturas Playground v2.90 - Derby handler                      *
*                                                                              *
*   This new derby handler has been written to replace the old derby system.   *
*   it has a lot of new features and is much easier to use. Adding derbys      *
*   to Las Venturas Playground couldn't be easier now!                         *
*                                                                              *
*                                                                              *
*                   Author: James Wilkinson                                    *
*                     2.9x Lead Developer                                      *
*                                                                              *
*                   Date: 08/02/2009  14:05                                    *
*                                                                              *
*                                                                              *
*                   Changelog:                                                 *
*                                                                              *
*       LVP 2.91.11 14/02/2010 Jay                                             *
*                                                                              *
*   - Added speed boost support.                                               *
*                                                                              *
*       LVP 2.91.19 03/04/2010 Jay                                             *
*                                                                              *
*   - Added minimum height support.                                            *
*                                                                              *
*       LVP 2.93.0 - 30/10/2010 Jay                                            *
*                                                                              *
*   - Added support for custom mapped derbies                                  *
*                                                                              *
*       LVP 2.94 - 20/02/2011 Jay                                              *
*                                                                              *
*   - Added more precise position calculating                                  *
*   - Added new textdraw interface to display each players position            *
*   - Vehicles engines are now disabled on derby start instead of freezing     *
*   - Added a new "knocked out" camera affect when falling off a derby         *
*   - Added a new information textdraw showing the objective of the derby      *
*   - Added time remaining in a textdraw                                       *
*   - Added derby_countdown_mode to configure countdown freezing / engine stop *
*   - Added derby pickups and pickup control                                   *
*                                                                              *
*******************************************************************************/


// Defines to declare general limits;
#define MAX_DERBIES                 20                      // How many derbies can LVP hold?
#define MAX_DERBY_SPAWNPOINTS       24                      // Whats the maximum amount of players that can take part in a derby? DON'T CHANGE. THIS IS ALSO DEPENDANT ON THE POS TEXTDRAW
#define MAX_DERBY_OBJECTS           175                     // Maximum object count per derby map.
#define MAX_DERBY_PICKUPS           20                      // How many pickups per derby can their be max?


// Prices, rewards, and signup time.
#define DERBY_WINNING_PRIZE         10000               // How much does the winner of the minigame get?
#define DERBY_SIGNUP_TIME           20                  // How many seconds do players get to signup before it starts?

// Countdown modes
#define DERBY_COUNTDOWN_ENGINE      0                   // Disable players engine during a countdown
#define DERBY_COUNTDOWN_FREEZE      1                   // Freeze the player during a countdown

// Different states
#define DERBY_STATE_NONE            0   // The derby doesn't exist.
#define DERBY_STATE_IDLE            1   // The derby is empty. This state isn't used in player derby states.
#define DERBY_STATE_SIGNUP          2   // The derby is singing up
#define DERBY_STATE_COUNTDOWN       3   // Players are in the derby, and its handling the countdown
#define DERBY_STATE_RUNNING         4   // The derby is running
#define DERBY_STATE_PLAYER_FELL     5   // This derby state is for players only and indicates that they have fell off.

// Additional leave reason (the rest are handled from the minigame core)
#define DERBY_EXIT_FELL             8   // Player has fell below the minimum height limit -- out!


// Derby Pickup Types
// Note: when adding more pickup types: Remember to update the random functionaility in CDerby__LoadPickup!!

#define     DERBY_PICKUP_REPAIR         1240
#define     DERBY_PICKUP_FIX            1242
#define     DERBY_PICKUP_TYRE_POP       1247
#define     DERBY_PICKUP_BARREL         1225
#define     DERBY_PICKUP_NOS            1010
#define     DERBY_PICKUP_RANDOM         1337



#define     INVALID_DERBY_PICKUP_ID     -1
#define     DERBY_PICKUP_TYPE           14  // SA:MP Pickup type ID - 14 - can only be picked up in vehicles.


// Can this derby be ran with just one player? This is used for testing.
#if BETA_TEST == 0
    #define DERBY_ALLOW_SINGLE 0
#else
    #define DERBY_ALLOW_SINGLE 1
#endif

// Defines to make things a little easier when it comes to making them,
// uses the same method as the race handler.

#define derby_create(%1)                                forward CDerby__Initialize__%1(); public CDerby__Initialize__%1()
#define derby_set_id(%1)                                new _iDerbyID = %1
#define derby_add_spawn(%1,%2,%3,%4)                    CDerby__AddSpawn(_iDerbyID,%1,%2,%3,%4)
#define derby_set_interior(%1)                          CDerby__SetInterior(_iDerbyID,%1)
#define derby_set_vehicle(%1)                           CDerby__SetVehicle(_iDerbyID,%1)
#define derby_set_name(%1)                              CDerby__SetName(_iDerbyID,%1)
#define derby_set_bounds(%1,%2,%3,%4)                   CDerby__SetBounds(_iDerbyID,%1,%2,%3,%4)
#define derby_toggle_countdown(%1)                      CDerby__DisableCountdown(_iDerbyID,%1)
#define derby_toggle_blips(%1)                          CDerby__DisableBlips(_iDerbyID,%1)
#define derby_set_timelimit(%1)                         CDerby__SetTimeLimit(_iDerbyID,%1)
#define derby_enable_cannon()                           CDerby__EnableCannons(_iDerbyID)
#define derby_set_height_limit(%1)                      CDerby__SetHeightLimit(_iDerbyID, %1)
#define derby_add_object(%1,%2,%3,%4,%5,%6,%7)          CDerby__AddObject(_iDerbyID,%1,%2,%3,%4,%5,%6,%7)
#define derby_countdown_mode(%1)                        CDerby__SetCountdownMode(_iDerbyID, %1)
#define derby_add_pickup(%1,%2,%3,%4,%5)                CDerby__AddPickup(_iDerbyID,%1,%2,%3,%4,%5)

// Include the pre-created derbies;
#include Resources/Minigames/Derby/Derby0.pwn
#include Resources/Minigames/Derby/Derby1.pwn
#include Resources/Minigames/Derby/Derby2.pwn
#include Resources/Minigames/Derby/Derby3.pwn
#include Resources/Minigames/Derby/Derby4.pwn
#include Resources/Minigames/Derby/Derby5.pwn
#include Resources/Minigames/Derby/Derby6.pwn
#include Resources/Minigames/Derby/Derby7.pwn
#include Resources/Minigames/Derby/Derby8.pwn
#include Resources/Minigames/Derby/Derby9.pwn
#include Resources/Minigames/Derby/Derby10.pwn
#include Resources/Minigames/Derby/Derby11.pwn
#include Resources/Minigames/Derby/Derby12.pwn
#include Resources/Minigames/Derby/Derby13.pwn
#include Resources/Minigames/Derby/Derby14.pwn
#include Resources/Minigames/Derby/Derby15.pwn
#include Resources/Minigames/Derby/Derby16.pwn

// Variables used in this handler.

static g_DerbyNames[MAX_DERBIES][128];          // Stores the derbies name.
static g_DerbiesLoaded;                         // How many derbies are loaded?
static g_DerbyPickupCount[MAX_DERBIES];         // Number of pickups each derby contains.

// These variables determine a players position within a derby
static n_Position[MAX_PLAYERS];
static n_PositionID[MAX_DERBY_SPAWNPOINTS] = {-1, ...};

// This var stores the player information, xyz pos, etc
static Float:g_DerbyPlayerPos[MAX_PLAYERS][4];
// [0] = X
// [1] = Y
// [2] = Z
// [3] = ANG

// Data to store when saving/loading player stuff later
static iPlayerWorld[MAX_PLAYERS];
static iPlayerInterior[MAX_PLAYERS];


// This stores the derby world bounds information
static Float:g_DerbyWorldBounds[MAX_DERBIES][4];
// [0] = xmax
// [1] = xmin
// [2] = ymax
// [3] = ymin

// This variable stores spawnpoint information for a derby

static Float:g_DerbySpawn[MAX_DERBIES][MAX_DERBY_SPAWNPOINTS][4];

// [0] = X
// [1] = Y
// [2] = Z
// [3] = Angle

// This stores pickup information for a derby
static  g_DerbyPickupData[MAX_DERBIES][MAX_DERBY_PICKUPS][8];
// [0] = fPosX
// [1] = fPosY
// [2] = fPosZ
// [3] = Pickup type
// [4] = Pickup ID
// [5] = Respawn time in seconds
// [6] = Picked up time stamp to calculate respawns
// [7] = If the derby pickup is random, this stores the current pickup type!

// This stores the players weapons, useful to reset them for when they signup
// for a derby, so they can be easily loaded later.
static iDerbyWeapon[MAX_PLAYERS][13];
static iDerbyAmmo[MAX_PLAYERS][13];


// These handle each indivdual textdraw associated with a derby.
static  Text:g_DerbyTextdraw[MAX_DERBIES][4];


// These variables store genral derby / derby player information.


static g_DerbyData[MAX_DERBIES][20];/*

General information for the derby;

    [0] - Is the derby valid?
    [1] - The derbies current state
    [2] - How many players have signed up?
    [3] - What vehicle model should this derby use?
    [4] - How many players can the derby hold, max?
    [5] - The derbies interior.
    [6] - Time the derby intialized.
    [7] - The current derby countdown.
    [8] - Are world bounds activated for this derby?
    [9] - Is the derby countdown disabled?
   [10] - Are the player blips enabled?
   [11] - Timelimit, in seconds.
   [12] - Time the derby started.
   [13] - is the derby cannons enabled?
   [14] - Is the derby speed boost enabled?
   [15] - The minimum height limit
   [16] - The amount of objects created in a derby map
   [17] - The remaining number of seconds in this derby.
   [18] - The derby countdown mode
   [19] - Total players who have ever signed up.
   */


static g_DerbyPlayer[MAX_PLAYERS][5];/*

General player information

    [0] - The players state
    [1] - The vehicle ID the player is using for this derby.
    [2] - The derby ID the player is taking part in.
    [3] - Time the player last fired their cannons
    [4] - Time in which a player was knocked out of a pushout derby
    */



// Object data too, of course
enum E_DERBY_OBJECT
{
    Float:derbyObjPos[7],
    Float:derbyObjMovePos[7],
    derbyObjModel,
    DynamicObject: derbyObj,
    derbyObjMoving
}

static  derbyObject[MAX_DERBIES][MAX_DERBY_OBJECTS][E_DERBY_OBJECT];


// Functions;



// CDerby__Init
// Similar to the race handler, this is called from OnGameModeInit and sets & loads each
// derby data accordingly. It also handles the derby menus.

CDerby__Init()
{
    // First, create the derby menu:
//  DerbyMenu = CreateMenu("Derby:", 1, 0.0, 200.0, 120.0, 250.0);

    for(new i = 0; i < MAX_DERBIES; i++)
    {
        CDerby__InitializeMap(i);

        new szFunctionName[256];
        format( szFunctionName, sizeof( szFunctionName ), "CDerby__Initialize__DERBY%d", i );
        if(CallLocalFunction( szFunctionName, "" ))
        {
            // First of all set some flags to determine the derby as valid
            g_DerbyData[i][0] = true;
            g_DerbiesLoaded++;
            CDerby__SetState(i, DERBY_STATE_IDLE);

            // Set the appropriate time limit flag
            if(CDerby__IsTimeLimitActive(i))
            {
                g_DerbyData[i][17] = CDerby__GetTimeLimit(i);
            }


            // Load the textdraws associated with this derby
            CDerby__InitializeTextdraw(i);

            // And now we add rows to the derby menu to show the name of the derby.
//          AddMenuItem(DerbyMenu, 0, CDerby__GetName(i));
        }
    }
    if (g_DerbiesLoaded == 0)
        printf("[DerbyController] ERROR: Could not load any derbies.");
}



// CDerby__Start
// This function starts a derby. It returns true if the start was successful
// and false if it wasn't.

CDerby__Start(iDerbyID)
{

    // Although shouldn't be necessary, an extra piece of error checking
    // to ensure the derby being started is valid.
    if(!CDerby__IsValid(iDerbyID))
        return 0;

    // If the derby is not in the signup process, we can't start it!
    if(CDerby__GetState(iDerbyID) != DERBY_STATE_SIGNUP)
    {
        return 0;
    }

    g_DerbyData[iDerbyID][19] = g_DerbyData[iDerbyID][2];

    // Load the derby map first so we can update the stream for each player
    CDerby__LoadDerbyMap(iDerbyID);

    // Load the pickups to
    CDerby__LoadPickups(iDerbyID);

    // Now we have to find out which players have signed up for this derby,
    // and create the derby vehicle, and set the relevant information.
    new iSpawnID;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
        {
            continue;
        }

        if(CDerby__GetPlayerState(i) != DERBY_STATE_SIGNUP)
        {
            continue;
        }

        if(CDerby__GetPlayerDerby(i) != iDerbyID)
        {
            continue;
        }

        #if DERBY_ALLOW_SINGLE == 0
            // First of all, check if enough players have signed up. If not, end the derby.
            if(CDerby__GetPlayerCount(iDerbyID) <= 1)
            {
                ShowBoxForPlayer(i, "Not enough players have signed up for this derby. You have been refunded.");
                CDerby__PlayerExit(i, LONELY);
                GiveRegulatedMoney(i, MinigameParticipation);
                return 1;
            }
        #endif


        // Just update the streamer first
        Streamer_UpdateEx(i, g_DerbySpawn[iDerbyID][iSpawnID][0], g_DerbySpawn[iDerbyID][iSpawnID][1], g_DerbySpawn[iDerbyID][iSpawnID][2]);


        // Now we set a few vars and stuff, and handle
        // the players spawn.
        CDerby__SavePlayerData(i);
        SetPlayerVirtualWorld(i, iDerbyID);

        // Make sure we reset the time limit countdown for the textdraw too
        if(CDerby__IsTimeLimitActive(iDerbyID))
        {
            g_DerbyData[iDerbyID][17] = CDerby__GetTimeLimit(iDerbyID);
        }

        if(!CDerby__GetObjectCount(iDerbyID) || !CDerby__IsCountDownEnabled(iDerbyID))
        {
            CDerby__PlayerVehicle(i, iDerbyID, iSpawnID);
            iSpawnID++;
        }
        else
        {
            new playerid = i;
            Streamer_UpdateEx(playerid, g_DerbySpawn[iDerbyID][iSpawnID][0], g_DerbySpawn[iDerbyID][iSpawnID][1], g_DerbySpawn[iDerbyID][iSpawnID][2]);
            SetPlayerPos(playerid, g_DerbySpawn[iDerbyID][iSpawnID][0], g_DerbySpawn[iDerbyID][iSpawnID][1], g_DerbySpawn[iDerbyID][iSpawnID][2]);
            TogglePlayerControllable(playerid, 0);
            iSpawnID++;
        }

        CDerby__SetPlayerState(i,DERBY_STATE_COUNTDOWN);
        SetPlayerInterior(i,CDerby__GetInterior(iDerbyID));
        CDerby__SetPlayerBlip(i);

        CDerby__ShowTextdrawsForPlayer(iDerbyID, i, true);

        Streamer_Update(i);

        new str[128];
        format(str,128,"* You are taking part in the %s. Use /leave to leave the derby at any time.",CDerby__GetName(iDerbyID));
        SendClientMessage(i,COLOR_ORANGE,str);

        if(CDerby__IsCannonEnabled(iDerbyID))
        {
            SendClientMessage(i, COLOR_YELLOW,"* Tip: Press the CTRL / LMB to fire the vehicles cannons.");
        }

        if(CDerby__IsHeightLimitEnabled(iDerbyID))
        {
            SendClientMessage(i, COLOR_YELLOW, "* Push the other players off the edge!");
            GameTextForPlayer(i, "~y~Push the other players off the edge!", 5000, 6);
        }

        DisablePlayerCheckpoint(i);


        // Now set the world bounds for player:
        if(g_DerbyData[iDerbyID][8])
        {
            SetPlayerWorldBounds(i,
                g_DerbyWorldBounds[iDerbyID][0],
                g_DerbyWorldBounds[iDerbyID][1],
                g_DerbyWorldBounds[iDerbyID][2],
                g_DerbyWorldBounds[iDerbyID][3]);

        }
        // Finally freeze the player. This is done last to compensate for lag.
//      TogglePlayerControllable(i, false);
    }

    // If a derby timelimit is active, we need to store the time
    // the derby started.
    // UPDATE: This flag is now used to
    // disable state change error checking if a derby has only
    // just started. (prevents a bug that the handler thinks
    // the player has left the derby before they've even started it)
    //if(CDerby__IsTimeLimitActive(iDerbyID))
    //{
    g_DerbyData[iDerbyID][12] = Time->currentTime();
//  }



    // Now we just set some flags which declare the derby as running 
    g_DerbyData[iDerbyID][7] = 5;
    g_DerbyData[iDerbyID][6] = 0;
    CDerby__SetState(iDerbyID, DERBY_STATE_COUNTDOWN);
    return 1;
}


// CDerby__End
// This function ends a derby.
CDerby__End(iDerbyID, iTimeUp = 0)
{

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
        {
            continue;
        }

        if(CDerby__GetPlayerState(i) == DERBY_STATE_NONE)
        {
            continue;
        }

        if(CDerby__GetPlayerDerby(i) == iDerbyID)
        {
            if(iTimeUp != 0)
            {
                CDerby__PlayerExit(i, TOOSLOW);
            }
            else
            {
                CDerby__PlayerExit(i, FINISH);
            }
        }
    }
    CDerby__SetState(iDerbyID, DERBY_STATE_IDLE);

    g_DerbyData[iDerbyID][2] = 0;
    g_DerbyData[iDerbyID][12] = 0;
    g_DerbyData[iDerbyID][19] = 0;

    CDerby__UnloadDerbyMap(iDerbyID);
    CDerby__UnloadPickups(iDerbyID);
    CDerby__ResetTextdraws(iDerbyID);

    // Make sure we reset the time limit countdown for the textdraw too
    if(CDerby__IsTimeLimitActive(iDerbyID))
    {
        g_DerbyData[iDerbyID][17] = CDerby__GetTimeLimit(iDerbyID);
    }

}


// CDerby__SignPlayerUp
// This function puts a player into a derby. Used from the /derby command.

CDerby__SignPlayerUp(iPlayerID,iDerbyID)
{
    // Is the derby already running?
    if(CDerby__GetState(iDerbyID) != DERBY_STATE_SIGNUP)
    {
        return 0;
    }

    // Has the player already signed up for a derby?
    if(CDerby__GetPlayerState(iPlayerID) != DERBY_STATE_NONE)
    {
        return 0;
    }

    if(g_DerbyData[iDerbyID][2] >= MAX_DERBY_SPAWNPOINTS)
    {
        return 0;
    }

    // Now we sign the player up.
    CDerby__SetPlayerState(iPlayerID,DERBY_STATE_SIGNUP);

    // assign the players position to the default
    // signup ID. This is for use in our textdraw
    // and so at the start everyone is positioned 1st
    n_Position[iPlayerID] = g_DerbyData[iDerbyID][2];

    g_DerbyData[iDerbyID][2]++;
    CDerby__SetPlayerDerby(iPlayerID, iDerbyID);
    return 1;
}





// CDerby__PlayerExit
// This function is called when a player leaves a derby.
// It handles relevant data resets for both the player and the derby itself
// and loads all associated data for the player such as their previous position
// and weapons.
CDerby__PlayerExit(iPlayerID, iReason)
{
    // Has the player signed up for any derbies, or taking part?
    if(CDerby__GetPlayerState(iPlayerID) == DERBY_STATE_NONE)
    {
        return 0;
    }

    // If the player has already been knocked out there is no need to proceed
    if(CDerby__GetPlayerState(iPlayerID) == DERBY_STATE_PLAYER_FELL)
    {
        return 0;
    }

    // Right, first we get the derby ID the player is taking part in...
    new iDerbyID = CDerby__GetPlayerDerby(iPlayerID);

    if(!CDerby__IsValid(iDerbyID))
    {
        return 0;
    }

    // Make sure we destroy the vehicle the player was using
    if(iReason != SIGNOUT && iReason != DERBY_EXIT_FELL)
    {
        CDerby__DestroyPlayerVehicle(iPlayerID);
    }

    // Restore the players position etc if they leave or get knocked out
    if(iReason != SIGNOUT && iReason != DISCONNECT && iReason != KILLED && iReason != DERBY_EXIT_FELL)
    {
        CDerby__LoadPlayerData(iPlayerID);
    }

    // Give the player a refund if they sign out.
    if(iReason == SIGNOUT)
    {
        GiveRegulatedMoney(iPlayerID, MinigameParticipation);
    }

    if(iReason != SIGNOUT && iReason != DISCONNECT)
    {
        ResetWorldBounds(iPlayerID);
    }

    // Now we handle the messages;
    if(iReason != TOOSLOW && iReason != SIGNOUT && CDerby__GetState(iDerbyID) == DERBY_STATE_RUNNING)
    {
        new szMessage[128];

        // Has the player won?
        if(g_DerbyData[iDerbyID][2] == 1)
        {
            format(szMessage, sizeof(szMessage), "~y~%s~w~ has finished: ~r~~h~%s~w~ has won!", CDerby__GetName(iDerbyID), Player(iPlayerID)->nicknameString());
            NewsController->show(szMessage);

            new const prize = GetEconomyValue(MinigameVictory, g_DerbyData[iDerbyID][19] /* participants */);
            new message[128];

            format(message, sizeof(message), "* You won the derby and received $%s!", formatPrice(prize));
            SendClientMessage(iPlayerID, Color::Green, message);

            GiveRegulatedMoney(iPlayerID, MinigameVictory, g_DerbyData[iDerbyID][19] /* participants */);

            WonMinigame[iPlayerID]++;
        }
    }

    if(iReason == TOOSLOW)
    {
        new szMessage[128];
        format(szMessage,128,"* Times up! Nobody won the %s.", CDerby__GetName(iDerbyID));
        SendClientMessage(iPlayerID, Color::Red, szMessage);
    }

    // Now decrease the amount of players taking part in this derby
    g_DerbyData[iDerbyID][2] --;

    // Player fell below the minimum height
    // If this does occur, we add a nice new special affect
    // which shows a "knocked out" gametext message
    // and zooms out on the players vehicle for 5 seconds.
    if(iReason == DERBY_EXIT_FELL)
    {

        CDerby__SetPlayerState(iPlayerID, DERBY_STATE_PLAYER_FELL);

        new szMessage[128];
        format(szMessage, 128, "* You fell off the %s derby.", CDerby__GetName(iDerbyID));
        SendClientMessage(iPlayerID, Color::Red, szMessage);

        GameTextForPlayer(iPlayerID, "~r~knocked out!", 5000, 6);

        // Store the time the player was knocked out so we can later
        // remove them from the actual derby.
        g_DerbyPlayer[iPlayerID][4] = GetTickCount();

        // Alright now apply a birdseye view for the victim for a few seconds.
        new
            Float:fPosX, Float:fPosY, Float:fPosZ;

        GetPlayerPos(iPlayerID, fPosX, fPosY, fPosZ);
        SetPlayerCameraPos(iPlayerID, fPosX, fPosY, fPosZ + 10);
        SetPlayerCameraLookAt(iPlayerID, fPosX, fPosY, fPosZ);

    //  return 1;

    }
    else
    {
        // Yay still here.
        // Check if we need to remove this player and reset their data etc
        CDerby__RemovePlayerFromDerby(iPlayerID);
    }


    if(iReason != TOOSLOW)
    {
        // Right, if there is only one player left in a derby, we have to
        // end it. (but only if CDerby__End hasn't already been called!)
        if(CDerby__GetPlayerCount(iDerbyID) <= 0 && iReason == SIGNOUT)
        {
            CDerby__End(iDerbyID);
        }
        else if (CDerby__GetPlayerCount(iDerbyID) <= 1 && iReason != SIGNOUT)
        {
            CDerby__End(iDerbyID);
        }
    }
    return 1;
}

// CDerby__InitPlayerData
// Called from OnPlayerConnect and simply updates the player derby flag to
// -1 so IsPlayerInAnyDerby works and resets the players state to prevent
// unwanted players from being teleported to a derby
CDerby__InitPlayerData(iPlayerID)
{
    CDerby__SetPlayerDerby(iPlayerID, -1);
    CDerby__SetPlayerState(iPlayerID, DERBY_STATE_NONE);
}


// CDerby__RemovePlayerFromDerby
// This function is called from CDerby__PlayerExit
// and removes the player from the derby.
CDerby__RemovePlayerFromDerby(iPlayerID, bool:n_LoadData = false)
{
    // Right, first we get the derby ID the player is taking part in...
    new iDerbyID = CDerby__GetPlayerDerby(iPlayerID);

    // LVP 2.94 Buffer underflow fix;
    // CDerby::GetPlayerDerby often returns -1
    // and CDerby::IsValid checks this value against an array

    if(!CDerby__IsValid(iDerbyID))
    {
        SendClientMessage(iPlayerID, Color::Red, "Unable to sign out of derby (invalid derby id for player).");
        return;
    }


    // Now if the player is knocked out we may need to load their data
    if(n_LoadData == true)
    {
        CDerby__LoadPlayerData(iPlayerID);
    }


    // Just reset the data. easy :)

    CDerby__ShowTextdrawsForPlayer(iDerbyID, iPlayerID, false);
    CDerby__SetPlayerDerby(iPlayerID, -1);
    CDerby__SetPlayerState(iPlayerID, DERBY_STATE_NONE);
//  g_DerbyData[iDerbyID][2]--; // The ranks are updated in CDerby__PlayerExit (for the knocked out affect)
    TogglePlayerControllable(iPlayerID, true);
    CDerby__SetPlayerBlip(iPlayerID);
    g_DerbyPlayer[iPlayerID][3] = 0;

    ResetWorldBounds(iPlayerID);

    CDerby__DestroyPlayerVehicle(iPlayerID);
    g_DerbyPlayer[iPlayerID][4] = 0;

}



// CDerby__Intialize
// This function handles the process of the derby beginning, and going
// into the signup process.

CDerby__Intialize(iDerbyID)
{
    if(CDerby__GetState(iDerbyID) != DERBY_STATE_IDLE)
    {
        return 0;
    }

    g_DerbyData[iDerbyID][6] = Time->currentTime();

    CDerby__SetState(iDerbyID,DERBY_STATE_SIGNUP);
    return 1;
}


// CDerby__CreateTextdraw
// This function creates all relevant textdraws associated
// with this derby. It is called from initialization.
CDerby__InitializeTextdraw(iDerbyID)
{
    if(!CDerby__IsValid(iDerbyID))
    {
        printf("[Derby] Unable to initialize textdraw for derby %d: Invalid derby ID.", iDerbyID);
        return;
    }

    new szTextString[128];

    // #1 Basic information textdraw - "take out the other vehicles" etc.

    // First of all format the message accordingly.
    // If this is a pushoff derby, the message is slightly more informative.
    if(CDerby__IsHeightLimitEnabled(iDerbyID))
    {
        format(szTextString, 128, "~b~LAST MAN STANDING~n~~w~Push the other ~y~%s's off the edge.", VehicleModel(GetVehicleModel(CDerby__GetVehicle(iDerbyID)))->nameString());
    }
    else
    {
        format(szTextString, 128, "Take out the other ~y~%s~w~'~y~s~w~.", VehicleModel(CDerby__GetVehicle(iDerbyID))->nameString());
    }

    g_DerbyTextdraw[iDerbyID][0] = TextDrawCreate(200, 361, szTextString);
    TextDrawBackgroundColor(g_DerbyTextdraw[iDerbyID][0], 255);
    TextDrawFont(g_DerbyTextdraw[iDerbyID][0], 1);
    TextDrawLetterSize(g_DerbyTextdraw[iDerbyID][0], 0.32, 1.5);
    TextDrawColor(g_DerbyTextdraw[iDerbyID][0], -1);
    TextDrawSetOutline(g_DerbyTextdraw[iDerbyID][0], 0);
    TextDrawSetProportional(g_DerbyTextdraw[iDerbyID][0], 1);
    TextDrawSetShadow(g_DerbyTextdraw[iDerbyID][0], 1);



    // #2 - The "box" textdraw.
    // This shows other players' data accordingly such as their position
    // but is slightly more dynamic ;)

    // Start with the initial name in the titlebar of the box

    format(szTextString, 128, "~p~%s", CDerby__GetName(iDerbyID));

    g_DerbyTextdraw[iDerbyID][1] = TextDrawCreate(520.000000, 301.000000, szTextString);
    TextDrawBackgroundColor(g_DerbyTextdraw[iDerbyID][1], 255);
    TextDrawFont(g_DerbyTextdraw[iDerbyID][1], 1);
    TextDrawLetterSize(g_DerbyTextdraw[iDerbyID][1], 0.239999, 1.199997);
    TextDrawColor(g_DerbyTextdraw[iDerbyID][1], -1);
    TextDrawSetOutline(g_DerbyTextdraw[iDerbyID][1], 0);
    TextDrawSetProportional(g_DerbyTextdraw[iDerbyID][1], 1);
    TextDrawSetShadow(g_DerbyTextdraw[iDerbyID][1], 1);
    TextDrawUseBox(g_DerbyTextdraw[iDerbyID][1], 1);
    TextDrawBoxColor(g_DerbyTextdraw[iDerbyID][1], 255);
    TextDrawTextSize(g_DerbyTextdraw[iDerbyID][1], 621.000000, 0.000000);



    // Now proceed to the actual player data textdraw. For now we'll just add "..." messages where the names are supposed to be.

    g_DerbyTextdraw[iDerbyID][2] = TextDrawCreate(520.000000, 316.000000, "#1~y~ ...~n~~w~#2 ~y~...~n~~w~#3 ~y~...~n~~w~#4~y~...~n~~w~...");
    TextDrawBackgroundColor(g_DerbyTextdraw[iDerbyID][2], 255);
    TextDrawFont(g_DerbyTextdraw[iDerbyID][2], 1);
    TextDrawLetterSize(g_DerbyTextdraw[iDerbyID][2], 0.209999, 1.099998);
    TextDrawColor(g_DerbyTextdraw[iDerbyID][2], -1);
    TextDrawSetOutline(g_DerbyTextdraw[iDerbyID][2], 0);
    TextDrawSetProportional(g_DerbyTextdraw[iDerbyID][2], 1);
    TextDrawSetShadow(g_DerbyTextdraw[iDerbyID][2], 1);
    TextDrawUseBox(g_DerbyTextdraw[iDerbyID][2], 1);
    TextDrawBoxColor(g_DerbyTextdraw[iDerbyID][2],  0x00000033);
    TextDrawTextSize(g_DerbyTextdraw[iDerbyID][2], 621.000000, -3.000000);


    //--
    // And finally, the time remaining textdraw.

    szTextString = "";



    // First of all with this one, we need to calculate the position
    // of the actual textdraw just incase there are more than 4 players
    // participating in the derby. In which event there would be some
    // textdraw clashing because of my bad designing :)
    // if there are > 4 decrease the height of the time remaining textdraw
    // by 8 units

    new iLineBreaks;

    if(CDerby__GetNumberOfSpawns(iDerbyID) > 4)
    {
       iLineBreaks = CDerby__GetNumberOfSpawns(iDerbyID) - 4;
    }

    // Alright now format the actual countdown
    if(CDerby__IsTimeLimitActive(iDerbyID))
    {
        format(szTextString, 128, "Time remaining: ~g~--:--");
    }
    else
    {
        format(szTextString, 128, "Time remaining: ~g~%s", ConvertTime(CDerby__GetTimeLimit(iDerbyID)));
    }

    g_DerbyTextdraw[iDerbyID][3] = TextDrawCreate(520.000000, 360.000000 + iLineBreaks * 9.5, szTextString);
    TextDrawBackgroundColor(g_DerbyTextdraw[iDerbyID][3], 255);
    TextDrawFont(g_DerbyTextdraw[iDerbyID][3], 1);
    TextDrawLetterSize(g_DerbyTextdraw[iDerbyID][3], 0.240000, 1.099999);
    TextDrawColor(g_DerbyTextdraw[iDerbyID][3], -1);
    TextDrawSetOutline(g_DerbyTextdraw[iDerbyID][3], 0);
    TextDrawSetProportional(g_DerbyTextdraw[iDerbyID][3], 1);
    TextDrawSetShadow(g_DerbyTextdraw[iDerbyID][3], 1);
    TextDrawUseBox(g_DerbyTextdraw[iDerbyID][3], 1);
    TextDrawBoxColor(g_DerbyTextdraw[iDerbyID][3], 255);
    TextDrawTextSize(g_DerbyTextdraw[iDerbyID][3], 621.000000, 0.000000);


    // All done with our textdraws \o/
}

// CDerby__ShowTextdrawsForPlayer
// This function shows / hides all relevant textdraws associated
// with this derby for the player.
CDerby__ShowTextdrawsForPlayer(iDerbyID, iPlayerID, bool:show)
{
    if(show == true)
    {
        for(new i = 0; i < 4; i++)
        {
            TextDrawShowForPlayer(iPlayerID, g_DerbyTextdraw[iDerbyID][i]);
        }
    }
    else
    {
        for(new i = 0; i < 4; i++)
        {
            TextDrawHideForPlayer(iPlayerID, g_DerbyTextdraw[iDerbyID][i]);
        }
    }
}

// CDerby__UpdateTextdraw
// This function is called every second to update some textdraws
// such as the time remaining and the position each player is in.


CDerby__UpdateTextdraw(iDerbyID)
{
    if(!CDerby__IsValid(iDerbyID) || CDerby__GetState(iDerbyID) != DERBY_STATE_RUNNING)
    {
        return;
    }

    new szTextString[512];

    // First of all update the countdown
    if(CDerby__IsTimeLimitActive(iDerbyID))
    {
        format(szTextString, 128, "Time remaining:~g~ %s", ConvertTime(g_DerbyData[iDerbyID][17]));
        TextDrawSetString(g_DerbyTextdraw[iDerbyID][3], szTextString);
    }

    //--

    // Now the messy stuff. Calculate each indivdual players position based
    // on their vehicle health

    new Float:v_health;
    new Float:v_health2;

    // Reset the position data
    for(new i = 0; i < CDerby__GetNumberOfSpawns(iDerbyID); i++)
    {
        n_PositionID[i] = -1;
    }

    for (new playerid = 0; playerid <= PlayerManager->highestPlayerId(); playerid++)
    {
        if(!Player(playerid)->isConnected() || IsPlayerNPC(playerid) || CDerby__GetPlayerDerby(playerid) != iDerbyID)
        {
            continue;
        }

        // Okay we need to reset the position and recalculate it
        n_Position[playerid] = 0;

        GetVehicleHealth(GetPlayerVehicleID(playerid), v_health);

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected() || IsPlayerNPC(i) || CDerby__GetPlayerDerby(i) != iDerbyID)
            {
                continue;
            }

            GetVehicleHealth(GetPlayerVehicleID(i), v_health2);

            // Alright someone has higher v health than this guy, increase their position by 1 \o
            if(v_health2 >= v_health)
            {
                n_Position[playerid]++;
            }

            // WORK OUT WHAT TO DO IF THEY'RE THE SAME VEHICLE HEALTH!!!!
            else if (v_health2 == v_health)
            {
              //  n_Position[playerid] =
            }
        }

        if(n_Position[playerid] < 0 || n_Position[playerid] > MAX_DERBY_SPAWNPOINTS)
        {
            SendClientMessage(playerid, Color::Red, "Derby Handler Error: Unable to update position (Array limit breached)");

        }
        else
        {
            n_PositionID[n_Position[playerid]] = playerid;
        }
    }



    // Alright we've calculated each players position.
    // Now we just need to format this into the textdraw
    szTextString = "";


    for(new i = 1; i < CDerby__GetNumberOfSpawns(iDerbyID)+1; i++)
    {
        if(!IsPlayerConnected(n_PositionID[i]))
        {
            format(szTextString, 256, "%s#%d~y~ ...~n~~w~", szTextString, i);
        }
        else
        {
            format(szTextString, 256, "%s#%d~y~ %s~n~~w~", szTextString, i, PlayerName(n_PositionID[i]));
        }
    }

    TextDrawSetString(g_DerbyTextdraw[iDerbyID][2], szTextString);

}

// CDerby__ResetData
// We have to reset the textdraws when a derby ends ofc
CDerby__ResetTextdraws(iDerbyID)
{
    // Reset the textdraws first off
    TextDrawSetString(g_DerbyTextdraw[iDerbyID][3], "Time remaining:~g~ --");
    TextDrawSetString(g_DerbyTextdraw[iDerbyID][2], "#1~y~ ...~n~~w~#2 ~y~...~n~~w~#3 ~y~...~n~~w~#4 ~y~...~n~~w~...");
}

// CDerby__KeyStateChange
// This function is called from OnPlayerKeyStateChange, and handles derby
// cannons and speed boosts.
CDerby__KeyStateChange(iPlayerID, newkeys)
{
    // Is the player taking part in a derby?
    if(CDerby__GetPlayerState(iPlayerID) != DERBY_STATE_RUNNING)
    {
        return 0;
    }

    new iDerbyID = CDerby__GetPlayerDerby(iPlayerID);

    // Are the derby cannons enabled?
    if(CDerby__IsCannonEnabled(iDerbyID))
    {

        new
            Float:x,
            Float:y,
            Float:z;

        // First, we need the Z height of the player.
        GetPlayerPos(iPlayerID,x,y,z);

        GetXYInFrontOfPlayer(iPlayerID,x,y,35.0);

        // now check if the newkeys are control, and if so create
        // the explosion ;)
        if(((newkeys & KEY_ACTION) == KEY_ACTION || ((newkeys & 4) == 4)) && GetPlayerState(iPlayerID) == PLAYER_STATE_DRIVER)
        {
            // Should only work every 3 seconds...

            if(Time->currentTime() - g_DerbyPlayer[iPlayerID][3] > 2)
            {
                // CreateExplosion(x,y,z,9,2.3);
                CreateExplosion(x,y,z,1,1.0);
                g_DerbyPlayer[iPlayerID][3] = Time->currentTime();
            }
        }
        return 1;
    }

    // Now check for speed boosts.
    if(CDerby__IsSpeedBoostEnabled(iDerbyID))
    {

        return 1;
    }

    return 1;
}

// CDerby__StateChange
// This function is called from OnPlayerStateChange, and handles the derby stuff.
CDerby__StateChange(iPlayerID, newstate, oldstate)
{
    // Right, first we get the derby ID the player is taking part in...
    new iDerbyID = CDerby__GetPlayerDerby(iPlayerID);

    // Is the player on any derby?
    if(!CDerby__IsValid(iDerbyID))
    {
        return;
    }

    // Is the derby in progress?
    if(CDerby__GetState( iDerbyID ) < DERBY_STATE_COUNTDOWN)
    {
        return;
    }

    // If this derby has only just started, ignore state changes to compensate for lag.
    if(Time->currentTime() - g_DerbyData[iDerbyID][12] < 4)
    {
        return;
    }

    // Okay the only instance that a player should be entering a new vehicle
    // as a drive is when the derby starts. Therefore we need
    // to disable the vehicle engine.
    // Update: we'll add an additional check to make sure the derby is in the countdown phase
    if(newstate == PLAYER_STATE_DRIVER)
    {
        if(CDerby__GetCountdownMode(iDerbyID) == DERBY_COUNTDOWN_ENGINE)
        {
            SetVehicleParamsEx(GetPlayerVehicleID(iPlayerID), 0, 0, 0, 0, 0, 0, 0);
        }
        else if(CDerby__GetCountdownMode(iDerbyID) == DERBY_COUNTDOWN_FREEZE)
        {
            TogglePlayerControllable(iPlayerID, false);
        }
    }



    // They left their vehicle. baadd - remove them from the minigame
    if(oldstate == PLAYER_STATE_DRIVER)
    {
        CDerby__PlayerExit(iPlayerID, ONFOOT);
    }
    // Oh no, they died.
    if(newstate == PLAYER_STATE_WASTED)
    {
        CDerby__PlayerExit(iPlayerID, KILLED);
    }
}




// CDerby__Disconnect
// This is called from OnPlayerDisconnect. If a player is taking part in a
// derby and leaves the server, this takes them out of the derby.

CDerby__Disconnect(iPlayerID)
{
    if(CDerby__GetPlayerState(iPlayerID) >= DERBY_STATE_SIGNUP)
    {
        CDerby__PlayerExit(iPlayerID, DISCONNECT);
    }
}


// CDerby__Process
// Called every second, this function manages things like starting derbies,
// managing signups, and showing a 10 second countdown for a player to get
// back in their derby vehicle.

CDerby__Process() {
    for (new iDerbyID = 0; iDerbyID < g_DerbiesLoaded; iDerbyID++) {
        if (g_DerbyData[iDerbyID][0] /* is valid */ == 0)
            continue;

        new derbyState = g_DerbyData[iDerbyID][1];
        if (derbyState == DERBY_STATE_SIGNUP) {
            new signupTime = Time->currentTime() - g_DerbyData[iDerbyID][6] /* start time */; 
            if (signupTime >= DERBY_SIGNUP_TIME ||
                g_DerbyData[iDerbyID][2] /* player count */ == CDerby__GetMaxPlayers(iDerbyID)) {
                CDerby__Start(iDerbyID);
                continue;
            }
        }

        else if (derbyState == DERBY_STATE_COUNTDOWN) {
            if (!g_DerbyData[iDerbyID][9] /* countdown enabled */) {
                new str[128];
                format(str,128,"~w~%d",g_DerbyData[iDerbyID][7]);

                new iSpawnID;

                for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
                    if (!Player(i)->isConnected() || g_DerbyPlayer[i][2] != iDerbyID)
                        continue;

                    if (g_DerbyData[iDerbyID][7] /* current countdown */ == 4) {
                        CDerby__PlayerVehicle(i, iDerbyID, iSpawnID);
                        iSpawnID++;
                    }

                    if (g_DerbyData[iDerbyID][7] /* current countdown */ <= 0) {
                        if (!IsPlayerInAnyVehicle(i)) {
                            CDerby__PlayerExit(i, ONFOOT);
                            continue;
                        }

                        GameTextForPlayer(i,"~g~Go Go Go!",1000,6);
                        PlayerPlaySound(i,1057,0,0,0);
                        CDerby__SetState(iDerbyID, DERBY_STATE_RUNNING);
                        CDerby__SetPlayerState(i, DERBY_STATE_RUNNING);
                        TogglePlayerControllable(i, true);

                        if (CDerby__GetCountdownMode(iDerbyID) == DERBY_COUNTDOWN_ENGINE) {
                            if (GetVehicleModel(g_DerbyPlayer[i][1]) != 0) {
                                SetVehicleParamsEx(g_DerbyPlayer[i][1], 1, 1, 0, 1, 0, 0, 0);
                            } else {
                                CDerby__PlayerExit(i, ONFOOT);
                                SendClientMessage(i, Color::Red, "* An error occured and your vehicle was destroyed.");
                            }
                        }
                        continue;
                    }

                    GameTextForPlayer(i, str, 1000, 6);
                    PlayerPlaySound(i, 1058, 0, 0, 0);
                }

                g_DerbyData[iDerbyID][7]--; /* current countdown */

            } else {
                for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
                    if (!Player(i)->isConnected() || g_DerbyPlayer[i][2] != iDerbyID)
                        continue;

                    GameTextForPlayer(i,"~g~Go for it!",1000,6);
                    PlayerPlaySound(i,1057,0,0,0);
                    CDerby__SetState(iDerbyID,DERBY_STATE_RUNNING);
                    CDerby__SetPlayerState(i,DERBY_STATE_RUNNING);

                    // Don't forget to enable the engine or unfreeze the player!
                    if (CDerby__GetCountdownMode(iDerbyID) == DERBY_COUNTDOWN_ENGINE) {
                        if (GetVehicleModel(g_DerbyPlayer[i][1]) != 0) {
                            SetVehicleParamsEx(g_DerbyPlayer[i][1], 1, 1, 0, 1, 0, 0, 0);
                        } else {
                            CDerby__PlayerExit(i, ONFOOT);
                            SendClientMessage(i, Color::Red, "* An error occured and your vehicle was destroyed.");
                        }
                    }
                    else if (CDerby__GetCountdownMode(iDerbyID) == DERBY_COUNTDOWN_FREEZE) {
                        TogglePlayerControllable(i, true);
                    }
                }
            }
        }

        else if (derbyState == DERBY_STATE_RUNNING) {


            if (g_DerbyData[iDerbyID][11]   /* time limit */ > 0 &&
                g_DerbyData[iDerbyID][17]-- /* time remaining **/ <= 0) {
                CDerby__End(iDerbyID, true);
            } else {
                CDerby__UpdateTextdraw(iDerbyID);
                CDerby__CheckPickupRespawns(iDerbyID);
            }
        }
    }
}

// CDerby__PlayerProcess
// Similar to CDerby__Process, this function is called every second.
// It checks for players who are in a derby have gone below the minimum height limit.

CDerby__PlayerProcess(iPlayerID)
{

    if(CDerby__GetPlayerState(iPlayerID) < DERBY_STATE_RUNNING)
    {
        // Player is not on a derby.
        return;
    }

    new iDerbyID = CDerby__GetPlayerDerby(iPlayerID);

    // Player is not on a derby
    if(!CDerby__IsValid(iDerbyID))
    {
        return;
    }

    // Is the height limit restriction in place?

    if(!CDerby__IsHeightLimitEnabled(iDerbyID))
    {
        return;
    }



    // First check: If the player has been knocked out of this height derby
    // then we may have to process the special affect if 5 seconds have passed
    // and remove them from the derby.
    if(CDerby__GetPlayerState(iPlayerID) == DERBY_STATE_PLAYER_FELL)
    {
        if(g_DerbyPlayer[iPlayerID][4] != 0 && (GetTickCount() - g_DerbyPlayer[iPlayerID][4] > 5000))
        {
            CDerby__RemovePlayerFromDerby(iPlayerID, true);
        }
        // If the flag which is supposed to store the time is on 0
        // they something has fucked up so just immediately remove them from the derby
        else if (g_DerbyPlayer[iPlayerID][4] == 0)
        {
            CDerby__RemovePlayerFromDerby(iPlayerID, true);
        }
        return; // no need to proceed if the player has already fallen off.
    }


    // Okay we're still here
    // finally check if the player has gone below the minimum height of this derby
    // and if so knock them out!

    new iMinZ = CDerby__GetHeightLimit(iDerbyID);

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ;

    GetPlayerPos(iPlayerID, fPosX, fPosY, fPosZ);

    #pragma unused fPosX, fPosY

    if(fPosZ < iMinZ)
    {
        CDerby__PlayerExit(iPlayerID, DERBY_EXIT_FELL);
        return;
    }
}

// CDerby__ShowMainDialog
// Shows the main dialog listning all available derbies
CDerby__ShowMainDialog(playerid)
{
    // If a player does not enter the correct parameters
    // then we display a dialog listing all the available derbies.
    new szDialogTxt[1024];

    for(new i = 0; i < CDerby__GetCount(); i++)
    {
        if(!CDerby__IsValid(i))
        {
            continue;
        }

        format(szDialogTxt, sizeof(szDialogTxt), "%s%s\r\n", szDialogTxt, CDerby__GetName(i));
    }
    ShowPlayerDialog(playerid, DIALOG_DERBY_MAIN, DIALOG_STYLE_LIST, "Derbies", szDialogTxt, "Select", "Cancel");
}

// CDerby__OnCommand
// Called from the /derby command to handle signups etc

CDerby__OnCommand(playerid, params[])
{

        // Is the player already taking part in a minigame?
    if(IsPlayerInMinigame(playerid))
    {
        SendClientMessage(playerid,Color::Red,"* You are already taking part in a minigame!");
        return 1;
    }

    if(CDerby__GetPlayerState(playerid) != DERBY_STATE_NONE)
    {
        SendClientMessage(playerid,Color::Red,"* You have already signed up for a destruction derby!");
        return 1;
    }

    if(!IsPlayerMinigameFree(playerid))
    {
        SendClientMessage(playerid,Color::Red,"You have already signed up with a different minigame.");
        return 1;
    }


    new str[256];

    // Have they used the correct params?
    if(!params[0])
    {
        format(str,128,"Usage: /derby [0-%d]",CDerby__GetCount()-1);
        SendClientMessage(playerid,Color::White,str);

        CDerby__ShowMainDialog(playerid);
        return 1;
    }

    new iDerbyID = strval(params);

    // Is the derby ID valid?
    if(iDerbyID < 0 || iDerbyID > CDerby__GetCount()-1)
    {
        SendClientMessage(playerid,Color::Red,"* Invalid derby ID.");
        return 1;
    }

    if(!CDerby__IsValid(iDerbyID))
    {
        SendClientMessage(playerid,Color::Red,"* Invalid derby ID.");
        return 1;
    }

    // Is the derby in progress?
    if(CDerby__GetState(iDerbyID) > DERBY_STATE_SIGNUP)
    {
        format(str,128,"* The %s is currently in progress. Try again later.",CDerby__GetName(iDerbyID));
        SendClientMessage(playerid,Color::Red,str);
        return 1;
    }

    new const price = GetEconomyValue(MinigameParticipation);

    // Does the player have enough money?
    if(GetPlayerMoney(playerid) < price)
    {
        format(str,128,"* You require $%s to sign up for the %s.", formatPrice(price), CDerby__GetName(iDerbyID));
        SendClientMessage(playerid,Color::Red,str);
        return 1;
    }

    // Right, if the derby is idle, we start it.
    if(CDerby__GetState(iDerbyID) == DERBY_STATE_IDLE)
    {
        CDerby__Intialize(iDerbyID);

        format(str, sizeof(str), "/derby %d", iDerbyID);
        Announcements->announceMinigameSignup(DerbyMinigame, CDerby__GetName(iDerbyID), str, price, playerid);
        format(str, sizeof(str), "~y~%s derby~w~ is now signing up!~n~Want to join? ~r~/derby %d~w~!", CDerby__GetName(iDerbyID), iDerbyID);
        GameTextForAllEx(str, 5000, 5);
    }

    // Otherwise just sign the player up.
    CDerby__SignPlayerUp(playerid,iDerbyID);

    format(str,256,"%s (Id:%d) has signed up for /derby %d.",PlayerName(playerid),playerid,iDerbyID);
    Admin(playerid, str);

    Responses->respondMinigameSignedUp(playerid, DerbyMinigame, CDerby__GetName(iDerbyID), 20);
    format(str, sizeof(str), "~r~~h~%s~w~ has signed up for ~y~%s derby~w~ (~p~/derby %d~w~)", Player(playerid)->nicknameString(),
        CDerby__GetName(iDerbyID), iDerbyID);
    NewsController->show(str);

    TakeRegulatedMoney(playerid, MinigameParticipation);
    return 1;
}

// CDerby__GetState
// This function returns the state a derby is in.

CDerby__GetState(iDerbyID)
{
    return g_DerbyData[iDerbyID][1];
}


// CDerby__SetState
// Updates the state of the derby.

CDerby__SetState(iDerbyID,iState)
{
    g_DerbyData[iDerbyID][1] = iState;
}



// CDerby__IsValid
// Returns 1 if a derby is valid, 0 if it isn't.
// Update for 2.94.5: Added an additional check if iDerbyID
// Parameter is below 0 as this function is often checked against this scenario.
CDerby__IsValid(iDerbyID)
{
    // Prevent a buffer overflow
    if(iDerbyID < 0 || iDerbyID > MAX_DERBIES)
    {
        return 0;
    }

    return g_DerbyData[iDerbyID][0];
}






// CDerby__SetName
// Sets the name of a derby.

CDerby__SetName(iDerbyID,szName[])
{
    format(g_DerbyNames[iDerbyID],128,"%s",szName);
}





// CDerby__GetName
// return the name of a derby

CDerby__GetName(iDerbyID)
{
    return g_DerbyNames[iDerbyID];
}



// CDerby__GetPlayerCount()
// Returns the amount of players that have signed up for a derby.

CDerby__GetPlayerCount(iDerbyID)
{
    return g_DerbyData[iDerbyID][2];
}



// CDerby__GetMaxPlayers
// Returns the maximum amount of players that can compete in a derby.

CDerby__GetMaxPlayers(iDerbyID)
{
    return g_DerbyData[iDerbyID][4];
}




// CDerby__SetVehicle
// This function sets the vehicle model for a derby.

CDerby__SetVehicle(iDerbyID,iModel)
{
    if(iModel < 400 || iModel > 612)
        return Vehicle::InvalidId;

    g_DerbyData[iDerbyID][3] = iModel;
    return 1;
}

// CDerby__GetVehicle
// Return the vehicle model used in a derby.

CDerby__GetVehicle(iDerbyID)
{
    return g_DerbyData[iDerbyID][3];
}



// CDerby__SavePlayerData
// This function saves the players info prior to them starting the minigame.
CDerby__SavePlayerData(iPlayerID)
{
    if (LegacyIsPlayerInBombShop(iPlayerID))
        RemovePlayerFromBombShop(iPlayerID);

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ,
        Float:fPosAng;

    GetPlayerPos(iPlayerID,fPosX,fPosY,fPosZ);
    GetPlayerFacingAngle(iPlayerID,fPosAng);

    g_DerbyPlayerPos[iPlayerID][0] = fPosX;
    g_DerbyPlayerPos[iPlayerID][1] = fPosY;
    g_DerbyPlayerPos[iPlayerID][2] = fPosZ;
    g_DerbyPlayerPos[iPlayerID][3] = fPosAng;
    iPlayerWorld[iPlayerID] = GetPlayerVirtualWorld(iPlayerID);
    iPlayerInterior[iPlayerID] = GetPlayerInterior(iPlayerID);

    for(new j = 0; j<13; j++)
    {
        GetPlayerWeaponData(iPlayerID,j,iDerbyWeapon[iPlayerID][j],iDerbyAmmo[iPlayerID][j]);
    }
    ResetPlayerWeapons(iPlayerID);
    return 1;
}


// CDerby__LoadPlayerData
// This loads the saved data, useful for when a player leaves a derby. Returns 1
// if successful, 0 if not.
CDerby__LoadPlayerData(iPlayerID)
{

    if(CDerby__GetPlayerState(iPlayerID) < DERBY_STATE_COUNTDOWN)
    {
        return 0;
    }



    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ,
        Float:fAng;

    fPosX = g_DerbyPlayerPos[iPlayerID][0];
    fPosY = g_DerbyPlayerPos[iPlayerID][1];
    fPosZ = g_DerbyPlayerPos[iPlayerID][2];
    fAng = g_DerbyPlayerPos[iPlayerID][3];

    SetPlayerVirtualWorld(iPlayerID, iPlayerWorld[iPlayerID]);
    SetPlayerPos(iPlayerID,fPosX,fPosY,fPosZ);
    SetPlayerFacingAngle(iPlayerID,fAng);
    SetPlayerInterior(iPlayerID,iPlayerInterior[iPlayerID]);
    SetCameraBehindPlayer(iPlayerID);

    for(new j; j<13; j++)
    {
        GiveWeapon(iPlayerID,iDerbyWeapon[iPlayerID][j],iDerbyAmmo[iPlayerID][j]);
    }

    return 1;
}


// CDerby__PlayerVehicle()
// This function creates the derby vehicle for the player.

CDerby__PlayerVehicle(iPlayerID, iDerbyID, iSpawnID)
{

    if(GetVehicleModel(g_DerbyPlayer[iPlayerID][1]) != 0)
    {
        return;
    }

    new
        Float:x,
        Float:y,
        Float:z,
        Float:ang,
        model,
        iVeh;

    // First of all we get the pos, angle, and vehicle model for creating the vehicle...

    x = g_DerbySpawn[iDerbyID][iSpawnID][0];
    y = g_DerbySpawn[iDerbyID][iSpawnID][1];
    z = g_DerbySpawn[iDerbyID][iSpawnID][2];
    ang = g_DerbySpawn[iDerbyID][iSpawnID][3];
    model = g_DerbyData[iDerbyID][3];


    // Now create the vehicle and warp the player to it.
    iVeh = VehicleManager->createVehicle(model,x,y,z,ang,-1,-1);
    LinkVehicleToInterior(iVeh,CDerby__GetInterior(iDerbyID));
    SetVehicleVirtualWorld(iVeh,iDerbyID);

    if(IsPlayerInAnyVehicle(iPlayerID))
    {
        RemovePlayerFromVehicle(iPlayerID);
        SetPlayerPos(iPlayerID,x,y,z);
    }

    PutPlayerInVehicle(iPlayerID,iVeh,false);
    SetCameraBehindPlayer(iPlayerID);

    // Now store the vehicle ID for the player so we can destroy it later.
    g_DerbyPlayer[iPlayerID][1] = iVeh;

    // We may need to either freeze the player or disable the engine depending
    // on the countdown mode.
    if(CDerby__GetCountdownMode(iDerbyID) == DERBY_COUNTDOWN_ENGINE)
    {
        SetVehicleParamsEx(iVeh, 0, 0, 0, 0, 0, 0, 0);
    }
    else if (CDerby__GetCountdownMode(iDerbyID) == DERBY_COUNTDOWN_FREEZE)
    {
        TogglePlayerControllable(iPlayerID, false);
    }
    else
    {
        TogglePlayerControllable(iPlayerID, true);
    }
}






// CDerby__DestroyPlayerVehicle
// This function destroys a players derby vehicle, useful for when they leave
// the derby.

CDerby__DestroyPlayerVehicle(iPlayerID)
{
    if(g_DerbyPlayer[iPlayerID][1] != 0 && g_DerbyPlayer[iPlayerID][1] != Vehicle::InvalidId)
    {
        if(GetVehicleModel(g_DerbyPlayer[iPlayerID][1]) != 0)
        {
            VehicleManager->destroyVehicle(g_DerbyPlayer[iPlayerID][1]);
            g_DerbyPlayer[iPlayerID][1] = Vehicle::InvalidId;
        }
    }
}

// CDerby__AddObject
// Adds an object to a derby for mapped derby areas.
CDerby__AddObject(iDerbyID, n_ObjectID, Float:fPosX, Float:fPosY, Float:fPosZ, Float:fRotX, Float:fRotY, Float:fRotZ)
{
    if(CDerby__GetObjectCount(iDerbyID) >= MAX_DERBY_OBJECTS)
    {
        return;
    }

    new iObjectID = CDerby__GetObjectCount(iDerbyID);

    g_DerbyData[iDerbyID][16]++;

    derbyObject[iDerbyID][iObjectID][derbyObjPos][0] = fPosX;
    derbyObject[iDerbyID][iObjectID][derbyObjPos][1] = fPosY;
    derbyObject[iDerbyID][iObjectID][derbyObjPos][2] = fPosZ;
    derbyObject[iDerbyID][iObjectID][derbyObjPos][3] = fRotX;
    derbyObject[iDerbyID][iObjectID][derbyObjPos][4] = fRotY;
    derbyObject[iDerbyID][iObjectID][derbyObjPos][5] = fRotZ;

    derbyObject[iDerbyID][iObjectID][derbyObjModel] = n_ObjectID;
}


// Initialize the derby map
// by updating all associated variables
CDerby__InitializeMap(iDerbyID)
{
    for(new i = 0; i < MAX_DERBY_OBJECTS; i++)
    {
        derbyObject[iDerbyID][i][derbyObj] = DynamicObject: INVALID_OBJECT_ID;
    }
}

// Return the amount of objects in a derby map.
CDerby__GetObjectCount(iDerbyID)
{
    return g_DerbyData[iDerbyID][16];
}

// Load the derby map when the derby starts
// Just physically creates the objects. easy
CDerby__LoadDerbyMap(iDerbyID)
{
    // Does this derby have any objects associated with it?
    if(!CDerby__GetObjectCount(iDerbyID))
    {
        return;
    }


    for(new i = 0; i < CDerby__GetObjectCount(iDerbyID); i++)
    {
        if(derbyObject[iDerbyID][i][derbyObj] != DynamicObject: INVALID_OBJECT_ID)
        {
            DestroyDynamicObject(derbyObject[iDerbyID][i][derbyObj]);
        }

        derbyObject[iDerbyID][i][derbyObj] = CreateDynamicObject(
            derbyObject[iDerbyID][i][derbyObjModel],
            derbyObject[iDerbyID][i][derbyObjPos][0],
            derbyObject[iDerbyID][i][derbyObjPos][1],
            derbyObject[iDerbyID][i][derbyObjPos][2],
            derbyObject[iDerbyID][i][derbyObjPos][3],
            derbyObject[iDerbyID][i][derbyObjPos][4],
            derbyObject[iDerbyID][i][derbyObjPos][5],
            iDerbyID, CDerby__GetInterior(iDerbyID));
    }

}

// When a derby ends, we have to unload the map ofcourse.
CDerby__UnloadDerbyMap(iDerbyID)
{
    // Does this derby have any objects associated with it?
    if(!CDerby__GetObjectCount(iDerbyID))
    {
        return;
    }

    for(new i = 0; i < CDerby__GetObjectCount(iDerbyID); i++)
    {
        if(derbyObject[iDerbyID][i][derbyObj] == DynamicObject: INVALID_OBJECT_ID)
        {
            continue;
        }

        DestroyDynamicObject(derbyObject[iDerbyID][i][derbyObj]);
        derbyObject[iDerbyID][i][derbyObj] = DynamicObject: INVALID_OBJECT_ID;
    }

}


// CDerby__AddSpawn
// This function adds a spawn point for a derby.

CDerby__AddSpawn(iDerbyID,Float:fPosX,Float:fPosY,Float:fPosZ,Float:fAng)
{
    new iSpawnID = g_DerbyData[iDerbyID][4];

    if(iSpawnID >= MAX_DERBY_SPAWNPOINTS)
    {
        printf("[Derby] ERROR: Unable to add spawn point to derby %d (%s): Limits breached.", iDerbyID, CDerby__GetName(iDerbyID));
        return;
    }


    g_DerbySpawn[iDerbyID][iSpawnID][0] = fPosX;
    g_DerbySpawn[iDerbyID][iSpawnID][1] = fPosY;
    g_DerbySpawn[iDerbyID][iSpawnID][2] = fPosZ;
    g_DerbySpawn[iDerbyID][iSpawnID][3] = fAng;

    // We increase the amount of spawn points this derby can hold, max:
    g_DerbyData[iDerbyID][4]++;
}

// CDerby__GetNumberOfSpawns
// return the amount of spawns there are in this derby.
CDerby__GetNumberOfSpawns(iDerbyID)
{
    return g_DerbyData[iDerbyID][4];
}


// CDerby__SetInterior
// This function sets the interior for a derby.

CDerby__SetInterior(iDerbyID,iInteriorID)
{
    g_DerbyData[iDerbyID][5] = iInteriorID;
}





// CDerby__GetInterior
// This returns the interior ID of a derby.

CDerby__GetInterior(iDerbyID)
{
    return g_DerbyData[iDerbyID][5];
}




// CDerby__GetCount
// This returns the amount of loaded derbies.

CDerby__GetCount()
{
    return g_DerbiesLoaded;
}


// CDerby__GetPlayerDerby
// This function returns the ID of the derby the player is taking part in.

CDerby__GetPlayerDerby(iPlayerID)
{
    return g_DerbyPlayer[iPlayerID][2];
}


// CDerby__SetPlayerDerby
// This function sets the derby ID a player is taking part in.
static CDerby__SetPlayerDerby(iPlayerID, iDerbyID)
{
    g_DerbyPlayer[iPlayerID][2] = iDerbyID;
}



// CDerby__GetPlayerState
// This function returns the state of a player.

CDerby__GetPlayerState(iPlayerID)
{
    return g_DerbyPlayer[iPlayerID][0];
}

// CDerby__SetPlayerState
// This function sets a players state for the derby

CDerby__SetPlayerState(iPlayerID,iState)
{
    g_DerbyPlayer[iPlayerID][0] = iState;
}

// CDerby__SetBounds
// This function sets the world boundries for a derby.
CDerby__SetBounds(iDerbyID, Float:fxmax,Float:fxmin,Float:fymax,Float:fymin)
{
    g_DerbyWorldBounds[iDerbyID][0] = fxmax;
    g_DerbyWorldBounds[iDerbyID][1] = fxmin;
    g_DerbyWorldBounds[iDerbyID][2] = fymax;
    g_DerbyWorldBounds[iDerbyID][3] = fymin;
    g_DerbyData[iDerbyID][8] = true;
}

// CDerby__DisableCountdown
// This function disables a countdown for a derby - useful for derbies
// with air vehicles.
CDerby__DisableCountdown(iDerbyID,bool:enable)
{
    if(enable == true)
    {
        g_DerbyData[iDerbyID][9] = false;
    }
    else
    {
        g_DerbyData[iDerbyID][9] = true;
    }
}

// CDerby__SetCountdownMode
// Set the countdown mode, i.e. whether to freeze the player or disable their engine
// when a countdown starts.
CDerby__SetCountdownMode(iDerbyID, n_Mode)
{
    if(n_Mode < DERBY_COUNTDOWN_ENGINE || n_Mode > DERBY_COUNTDOWN_FREEZE)
    {
        printf("[Derby] ERROR: Invalid countdown mode set for derby %d. Mode ID: %d. Valid modes are %d - %d.", iDerbyID, DERBY_COUNTDOWN_ENGINE, DERBY_COUNTDOWN_FREEZE);
        n_Mode = DERBY_COUNTDOWN_FREEZE;
    }
    g_DerbyData[iDerbyID][18] = n_Mode;
}

// CDerby__GetCountdownMode
// Return the countdown mode of a derby.
CDerby__GetCountdownMode(iDerbyID)
{
    return g_DerbyData[iDerbyID][18];
}

// CDerby__IsCountDownEnabled
// This returns 1 if the countdown is enabled, 0 if not.
CDerby__IsCountDownEnabled(iDerbyID)
{
    if(!g_DerbyData[iDerbyID][9])
    {
        return 1;
    }
    return 0;
}

// CDerby__DisableBlips
// This function enables / disables the player blips for the derby, useful for
// stealth.
CDerby__DisableBlips(iDerbyID,bool:enable)
{
    if(enable == true)
    {
        g_DerbyData[iDerbyID][10] = false;
    }
    else
    {
        g_DerbyData[iDerbyID][10] = true;
    }
}

// CDerby__IsBlipsEnabled
// Returns 1 if the player blips are enabled for this derby,
// and 0 if they're disabled.
CDerby__IsBlipsEnabled(iDerbyID)
{
    if(!g_DerbyData[iDerbyID][10])
    {
        return 1;
    }
    return 0;
}


// CDerby__SetPlayerBlip
// This function sets a players blip, disables or enables,
// used for when the derby ends / starts.
CDerby__SetPlayerBlip(playerid)
{
    if(CDerby__GetPlayerState(playerid) <= DERBY_STATE_SIGNUP)
    {
        ColorManager->setPlayerMarkerHidden(playerid, false);

        return 1;
    }
    new iDerbyID = CDerby__GetPlayerDerby(playerid);

    if(!CDerby__IsBlipsEnabled(iDerbyID))
    {
        ColorManager->setPlayerMarkerHidden(playerid, true);
    }
    return 1;
}


// CDerby__SetTimeLimit
// This function sets a time limit for a derby, in seconds.
CDerby__SetTimeLimit(iDerbyID,iSeconds)
{
    g_DerbyData[iDerbyID][11] = iSeconds;
}

// CDerby__GetTimeLimit
// return the amount of seconds that should take place before this derby ends.
CDerby__GetTimeLimit(iDerbyID)
{
    return g_DerbyData[iDerbyID][11];
}

// CDerby__IsTimeLimitActive
// returns 1 if a derby has a timelimit, 0 if it doesn't.
CDerby__IsTimeLimitActive(iDerbyID)
{
    if(g_DerbyData[iDerbyID][11] > 0)
    {
        return 1;
    }
    return 0;
}

// CDerby__IsSpeedBoostEnabled
// Returns 1 if the speed boost is enabled, otherwise 0.
CDerby__IsSpeedBoostEnabled(iDerbyID)
{
    return g_DerbyData[iDerbyID][14];
}


// CDerby__SetHeightLimit
// This function sets a minimum height limit in a derby that
// a player can be before getting knocked out. Useful for sumo derbies.
CDerby__SetHeightLimit(iDerbyID, Float:fHeight)
{
    g_DerbyData[iDerbyID][15] = floatround(fHeight);
}

// CDerby__IsHeightLimitEnabled
// This returns 1 if the height limit is enable, 0 otherwise
CDerby__IsHeightLimitEnabled(iDerbyID)
{
    if(g_DerbyData[iDerbyID][15] == 0)
    {
        return 0;
    }
    return 1;
}

// CDerby__GetHeightLimit
// Returns the height limit for a derby ID.
CDerby__GetHeightLimit(iDerbyID)
{
    return g_DerbyData[iDerbyID][15];
}


// CDerby__AddPickup
// Add a specified pickup type at the location specified
CDerby__AddPickup(iDerbyID, iPickupType, Float:pX, Float:pY, Float:pZ, n_RespawnTime = -1)
{
//  if(!CDerby__IsValid(iDerbyID))
//  {
//      printf("[Derby] Unable to create pickup for derby: %d (Invalid derby ID)", iDerbyID);
//      return;
//  }
//  THIS CHECK WILL NOT WORK. DERBIES ARE NOT DECLARED AS VALID UNTIL THEY ARE
//  FULLY INITIALIZED.



    new iPickupID = CDerby__GetNumberOfPickups(iDerbyID);

    // Have we breached limits?
    if(iPickupID >= MAX_DERBY_PICKUPS - 1 || iPickupID < 0)
    {
        printf("[Derby] Warning: Unable to create pickup type %d for derby %d at position: %f, %f, %f - Derbies can only hold a maximum of %d pickups each!", iPickupType, iDerbyID, pX, pY, pZ, MAX_DERBY_PICKUPS);
        return;
    }

    g_DerbyPickupData[iDerbyID][iPickupID][0] = floatround(pX);
    g_DerbyPickupData[iDerbyID][iPickupID][1] = floatround(pY);
    g_DerbyPickupData[iDerbyID][iPickupID][2] = floatround(pZ);

    g_DerbyPickupData[iDerbyID][iPickupID][3] = iPickupType;

    // Respawn time;
    g_DerbyPickupData[iDerbyID][iPickupID][5] = n_RespawnTime;

    // Reset the flag for the actual pickup SA:MP ID
    if(g_DerbyPickupData[iDerbyID][iPickupID][4] != 0)
    {
        DestroyPickup(g_DerbyPickupData[iDerbyID][iPickupID][4]);
    }

    g_DerbyPickupData[iDerbyID][iPickupID][4] = INVALID_DERBY_PICKUP_ID;

    // Increase the count and we're done
    g_DerbyPickupCount[iDerbyID]++;
}

// CDerby__GetNumberOfPickups
// Return the amount of pickups loaded in a derby.
CDerby__GetNumberOfPickups(iDerbyID)
{
    // Check that it's valid - we can't use CDerby__IsValid
    // because technically the derby isn't valid when we
    // initialize pickups.
    if(iDerbyID < 0 || iDerbyID > MAX_DERBIES)
    {
        return 0;
    }

    // Technically an impossible scenario:
    if(g_DerbyPickupCount[iDerbyID] >= MAX_DERBY_PICKUPS)
    {
        return MAX_DERBY_PICKUPS;
    }

    return g_DerbyPickupCount[iDerbyID];
}

// CDerby__LoadPickups
// Load the pickups from the specified derby ID
// Used when the derby starts and has relevant error checking too
CDerby__LoadPickups(iDerbyID)
{
    if(!CDerby__IsValid(iDerbyID))
    {
        printf("[Derby] Error loading pickup for derby %d (Derby ID not valid)", iDerbyID);
        return;
    }

    // No point loading any pickups if there are none!!
    if(CDerby__GetNumberOfPickups(iDerbyID) < 1)
    {
       return;
    }

    // Just loop through the number of pickups in this derby
    // and literally create the actual pickup. Quick error check
    // to see if we need to destroy it first in any event in case
    // of any incorrect loads or w/e
    for(new i = 0; i < CDerby__GetNumberOfPickups(iDerbyID); i++)
    {
        CDerby__LoadPickup(iDerbyID, i);
    }   // done - all pickups created
}

// CDerby__LoadPickup
// This function actually loads a specified pickup ID. It's called
// from CDerby__LoadPickups and when a pickup respawns.
CDerby__LoadPickup(iDerbyID, iPickupID)
{
    // Prevent any over/underflows
    if(iPickupID < 0 || iPickupID > MAX_DERBY_PICKUPS || iDerbyID < 0 || iDerbyID > MAX_DERBIES)
    {
        return;
    }

    if(g_DerbyPickupData[iDerbyID][iPickupID][4] != INVALID_DERBY_PICKUP_ID)
    {
        DestroyPickup(g_DerbyPickupData[iDerbyID][iPickupID][4]);   // Bit of error checking to prevent duplicate pickups
    }

    g_DerbyPickupData[iDerbyID][iPickupID][6] = 0;  // Reset the time stamp for pickup respawns

    new iPickupType = g_DerbyPickupData[iDerbyID][iPickupID][3];

    if(iPickupType == DERBY_PICKUP_RANDOM)
    {
        switch(random(5))
        {
            case 0:
            {
                iPickupType = DERBY_PICKUP_REPAIR;
            }

            case 1:
            {
                iPickupType = DERBY_PICKUP_FIX;
            }

            case 2:
            {
                iPickupType = DERBY_PICKUP_TYRE_POP;
            }

            case 3:
            {
                iPickupType = DERBY_PICKUP_BARREL;
            }

            case 4:
            {
                iPickupType = DERBY_PICKUP_NOS;
            }

            default:
            {
                iPickupType = DERBY_PICKUP_NOS;
            }
        }
        g_DerbyPickupData[iDerbyID][iPickupID][7] = iPickupType;  // We have to store the pickup type in another index since its a random pickup type
    }
    g_DerbyPickupData[iDerbyID][iPickupID][4] = CreatePickup(iPickupType, DERBY_PICKUP_TYPE, g_DerbyPickupData[iDerbyID][iPickupID][0], g_DerbyPickupData[iDerbyID][iPickupID][1], g_DerbyPickupData[iDerbyID][iPickupID][2], iDerbyID); // Every derby virtual world is equal to the derby ID in this handler.
}

// CDerby__UnloadPickups
// Obviously we may need to destroy pickups when a derby ends too
CDerby__UnloadPickups(iDerbyID)
{
    for(new i = 0; i < CDerby__GetNumberOfPickups(iDerbyID); i++)
    {
        // Wait, does this pickup exist? (Quite an impossible scenario but meh)
        if(g_DerbyPickupData[iDerbyID][i][4] == INVALID_DERBY_PICKUP_ID)
        {
            continue;
        }

        DestroyPickup(g_DerbyPickupData[iDerbyID][i][4]);
        g_DerbyPickupData[iDerbyID][i][4] = INVALID_DERBY_PICKUP_ID;    // Destroyed \o/
    }
}


// CDerby__CheckPlayerPickupPickup
// Called from OnPlayerPickupPickup to check
// for when a player gets any pickup. If the player gets
// a derby pickup it calls the relevant function and returns 1.
CDerby__CheckPlayerPickupPickup(playerid, pickupid)
{
    new iDerbyID = CDerby__GetPlayerDerby(playerid);

    if(iDerbyID < 0 || iDerbyID > MAX_DERBIES)
    {
        return 0;
    }

    if(!CDerby__IsValid(iDerbyID))  // player isn't in a derby. We're done here!
    {
        return 0;
    }

    if(CDerby__GetState(iDerbyID) != DERBY_STATE_RUNNING)   // The derby the player is in isn't running. done here
    {
        return 0;
    }

    if(CDerby__GetNumberOfPickups(iDerbyID) < 1)    // This derby has no pickups. We're done here too
    {
        return 0;
    }

    // Alright loop through all pickups in the derby and see if any match with this pickupid.
    for(new i = 0; i < CDerby__GetNumberOfPickups(iDerbyID); i++)
    {
        // Pickup isn't valid
        if(g_DerbyPickupData[iDerbyID][i][4] == INVALID_DERBY_PICKUP_ID)
        {
            continue;
        }
        // Yey we have a match! \o/
        if(pickupid == g_DerbyPickupData[iDerbyID][i][4])
        {
            CDerby__OnPlayerPickupPickup(playerid, iDerbyID, i);
            return 1;
        }
    }
    return 0;
}

// CDerby__OnPlayerPickupPickup
// Called when a player picks up a derby pickup
CDerby__OnPlayerPickupPickup(playerid, iDerbyID, iDerbyPickupID)
{
    // Prevent any over/underflows
    if(iDerbyID < 0 || iDerbyID > MAX_DERBIES || iDerbyPickupID < 0 || iDerbyPickupID > MAX_DERBY_PICKUPS)
    {
        return;
    }

    // Alright first of all get the pickup type and calculate what we have to do here.
    new iPickupType = g_DerbyPickupData[iDerbyID][iDerbyPickupID][3];

    if(iPickupType == DERBY_PICKUP_RANDOM)  // In random pickups we store the current pickup ID in a seperate index
    {
        iPickupType = g_DerbyPickupData[iDerbyID][iDerbyPickupID][7];
    }

    // Play a little sound affect
    PlayerPlaySound(playerid, 1133, 0, 0, 0);

    // Now destroy the pickup before we do anythign so no other players can get it.
    DestroyPickup(g_DerbyPickupData[iDerbyID][iDerbyPickupID][4]);
    g_DerbyPickupData[iDerbyID][iDerbyPickupID][4] = INVALID_DERBY_PICKUP_ID;

    // Handle pickup respawning ofc too
    if(g_DerbyPickupData[iDerbyID][iDerbyPickupID][5] != -1)
    {
        g_DerbyPickupData[iDerbyID][iDerbyPickupID][6] = Time->currentTime();
    }

    switch(iPickupType)
    {
        case DERBY_PICKUP_REPAIR:
        {
            SetVehicleHealth(GetPlayerVehicleID(playerid), 1000);
            GameTextForPlayer(playerid, "~n~~n~~n~~g~Vehicle health", 5000, 5);
        }

        case DERBY_PICKUP_FIX:
        {
            SetVehicleHealth(GetPlayerVehicleID(playerid), 1000);
            RepairVehicle(GetPlayerVehicleID(playerid));
            GameTextForPlayer(playerid, "~n~~n~~n~~g~Vehicle repair", 5000, 5);
        }

        case DERBY_PICKUP_TYRE_POP:
        {
             GameTextForPlayer(playerid, "~n~~n~~n~~r~Pop!", 5000, 5);

             new
                panels,
                doors,
                lights,
                tires;

            GetVehicleDamageStatus(GetPlayerVehicleID(playerid), panels, doors, lights, tires);
            UpdateVehicleDamageStatus(GetPlayerVehicleID(playerid), panels, doors, lights, 15); // Pop all the vehicle tyres
        }

        case DERBY_PICKUP_BARREL:
        {
             GameTextForPlayer(playerid, "~n~~n~~n~~r~Barrel", 5000, 5);
             CreateExplosion(g_DerbyPickupData[iDerbyID][iDerbyPickupID][0], g_DerbyPickupData[iDerbyID][iDerbyPickupID][1], g_DerbyPickupData[iDerbyID][iDerbyPickupID][2], 1, 20);
        }

        case DERBY_PICKUP_NOS:
        {
            if(VehicleModel(GetVehicleModel(GetPlayerVehicleID(playerid)))->isNitroInjectionAvailable())
            {
                GameTextForPlayer(playerid, "~n~~n~~n~~g~Nitro", 5000, 5);
                AddVehicleComponent(GetPlayerVehicleID(playerid), 1009);
            }
        }
    }
}

// CDerby__CheckPickupRespawns
// This function is called every second from the main
// CDerby__Process timers to check to respawn any pickups.
CDerby__CheckPickupRespawns(iDerbyID)
{
    // Some error checking first of all to see if this derby is valid and that it has (respawning) pickups
    if(!CDerby__IsValid(iDerbyID))
    {
        return;
    }

    if(CDerby__GetNumberOfPickups(iDerbyID) < 1)
    {
        return;
    }

    // Loop through each pickup associated with this derby and first of all
    // check that the pickup id should respawn
    for(new i = 0; i < CDerby__GetNumberOfPickups(iDerbyID); i++)
    {
        if(g_DerbyPickupData[iDerbyID][i][5] == -1) // Pickup isn't set to respawn. we're done here \o/
        {
            continue;
        }

        if(g_DerbyPickupData[iDerbyID][i][6] == 0)  // No timestamp is associated to to the pickup. That means it hasn't been picked up yet \o/
        {
            continue;
        }

        // Alright now check if the pickup needs to respawn.
        if(Time->currentTime() - g_DerbyPickupData[iDerbyID][i][6] > g_DerbyPickupData[iDerbyID][i][5])
        {
            // Cool. The specified respawn time has passed. We can respawn this pickup!
            CDerby__LoadPickup(iDerbyID, i);
            continue;
        }
    }
}

// CDerby__EnableCannons
// This function enables the cannons for the derby, which allows players
// to fire explosions by pressing control.
CDerby__EnableCannons(iDerbyID)
{
    g_DerbyData[iDerbyID][13] = true;
}

// CDerby__IsCannonEnabled
// returns 1 if the derby cannons ar eenabled, 0 otherwise.
CDerby__IsCannonEnabled(iDerbyID)
{
    return g_DerbyData[iDerbyID][13];
}