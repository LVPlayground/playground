// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#include Resources/Minigames/Core/Race/Drift.pwn
#include Resources/Minigames/Core/Race/Projectiles/Rocket.pwn

#define MAX_RACES              36
#define MAX_CHECKPOINTS        40
#define MAX_SPAWNPOINTS        8
#define MAX_RACE_NAME          25
#define MAX_RACE_OBJECTS       650
#define MAX_RACE_OBJECT_MODELS 100

#define DEFAULT_RACE_OBJECT_DRAW_DISTANCE 300
#define OBJECT_PRELOAD_PHASE_START        0
#define OBJECT_PRELOAD_PHASE_FINISH       1
#define RACE_OBJECT_PRELOAD_TIME          10
#define RACE_PRICE                        250
#define RACE_SIGNUP_TIME                  20

// -------------------------------------------------------------------------------------------------

// Races are considered to be generic by default. A checkpoint and map icon will be created at the
// first spawn position of the race.
#define RACE_TYPE_GENERIC   0

// Circuit races only exist for the purposes of having a custom menu.
#define RACE_TYPE_CIRCUIT   1

// Knockout races only exist for the purposes of having a custom menu.
#define RACE_TYPE_KNOCKOUT  2

// Drift races calculate position based on drifting points (through the Drift handler) rather than
// through racing time. It imposes a maximum time between two checkpoints. A top 4 position screen
// is displayed to all participants, and a "FINISHED" game text is presented to players when they
// finish a drift. Drifts do not allow players to leave their vehicles. We have five of these.
#define RACE_TYPE_DRIFT     3

// Stunt races exist for the purposes of having a custom menu, and promoting the /flip command.
#define RACE_TYPE_STUNT     4

// Air races only exist for the purposes of having a custom menu.
#define RACE_TYPE_AIR       5

// Boat races only exist for the purposes of having a custom menu.
#define RACE_TYPE_BOAT      6

// Jump zone races only exist for displaying a "Map Zone" entry in the primary race menu.
#define RACE_TYPE_JUMP_ZONE 7

// -------------------------------------------------------------------------------------------------

#define RACE_ALLOW_SINGLE 1

#define RACE_STATE_NONE       0
#define RACE_STATE_IDLE       1
#define RACE_STATE_SIGNUP     2
#define RACE_STATE_COUNTDOWN  3
#define RACE_STATE_RUNNING    4

#define race_start(%1)                      forward CRace__Initialize__%1(); public CRace__Initialize__%1()
#define race_set_id(%1)                     new _raceID = %1
#define race_set_weather(%1)                CRace__SetWeather(_raceID,%1)
#define race_set_time(%1,%2)                CRace__SetTime(_raceID,%1,%2)
#define race_set_name(%1)                   CRace__SetName(_raceID,%1)
#define race_set_maxtime(%1)                CRace__SetMaxTime(_raceID,%1)
#define race_set_vehicle(%1)                CRace__SetVehicle(_raceID,%1)
#define race_set_maydrop(%1)                CRace__MayDrop(_raceID,%1)
#define race_set_laps(%1)                   CRace__SetLaps(_raceID,%1)
#define race_set_airrace(%1)                CRace__SetAirRace(_raceID,%1)
#define race_set_nos(%1)                    CRace__SetNOS(_raceID,%1)
#define race_set_interior(%1)               CRace__SetInterior(_raceID,%1)
#define race_disable_vehicle_damage()       CRace__DisableDamage(_raceID,1)
#define race_disable_checkpoint_markers()   CRace__SetCheckpointType(_raceID,2)
#define race_set_type(%1)                   CRace__SetType(_raceID,%1)
#define race_set_unlimited_nos()            CRace__UnlimitedNitro(_raceID)
#define race_add_checkpoint(%1,%2,%3,%4)        CRace__AddCheckpoint(_raceID,%1,%2,%3,%4)
#define race_add_spawn(%1,%2,%3,%4,%5,%6)       CRace__AddSpawn(_raceID,%1,%2,%3,%4,%5,%6)
#define race_add_object(%1,%2,%3,%4,%5,%6,%7)   CRace__AddObject(_raceID,%1,%2,%3,%4,%5,%6,%7)
#define race_set_object_draw_distance(%1)       CRace__SetObjectDrawDistance(_raceID,%1)

// A variable used to indicate which races have been loaded;
new _RaceLoaded[MAX_RACES];

// Inline these getters for performance reasons, they are hot on profiling.
#define CRace__GetObjectModelCount(%0) g_RaceData[%0][25]
#define CRace__GetObjectCount(%0) g_RaceData[%0][23]
#define CRace__GetDynamicCheckpointID(%0) DynamicCP: g_RaceData[(%0)][38]

// Include the races which are available;
#include "Resources/Minigames/Race/Race1.pwn"
#include "Resources/Minigames/Race/Race2.pwn"
#include "Resources/Minigames/Race/Race3.pwn"
#include "Resources/Minigames/Race/Race4.pwn"
#include "Resources/Minigames/Race/Race5.pwn"
#include "Resources/Minigames/Race/Race6.pwn"
#include "Resources/Minigames/Race/Race7.pwn"
#include "Resources/Minigames/Race/Race8.pwn"
#include "Resources/Minigames/Race/Race9.pwn"
#include "Resources/Minigames/Race/Race10.pwn"
#include "Resources/Minigames/Race/Race11.pwn"
#include "Resources/Minigames/Race/Race12.pwn"
#include "Resources/Minigames/Race/Race13.pwn"
#include "Resources/Minigames/Race/Race14.pwn"
#include "Resources/Minigames/Race/Race15.pwn"
#include "Resources/Minigames/Race/Race16.pwn"
#include "Resources/Minigames/Race/Race17.pwn"
#include "Resources/Minigames/Race/Race18.pwn"
#include "Resources/Minigames/Race/Race19.pwn"
#include "Resources/Minigames/Race/Race20.pwn"
#include "Resources/Minigames/Race/Race21.pwn"
#include "Resources/Minigames/Race/Race22.pwn"
#include "Resources/Minigames/Race/Race23.pwn"
#include "Resources/Minigames/Race/Race24.pwn"
#include "Resources/Minigames/Race/Race25.pwn"
#include "Resources/Minigames/Race/Race26.pwn"
#include "Resources/Minigames/Race/Race27.pwn"
#include "Resources/Minigames/Race/Race28.pwn"
#include "Resources/Minigames/Race/Race29.pwn"
#include "Resources/Minigames/Race/Race30.pwn"
#include "Resources/Minigames/Race/Race31.pwn"
#include "Resources/Minigames/Race/Race32.pwn"
#include "Resources/Minigames/Race/Race33.pwn"
#include "Resources/Minigames/Race/Race34.pwn"
#include "Resources/Minigames/Race/Race35.pwn"

// Variables used internally in our class;
new Float:g_RaceSpawnPositions[ MAX_RACES ][ MAX_SPAWNPOINTS ][ 6 ];
new Float:g_RaceCheckpoints[ MAX_RACES ][ MAX_CHECKPOINTS ][ 4 ];
new g_RaceVehicles[ MAX_RACES ][ MAX_SPAWNPOINTS ];
new g_RaceNames[ MAX_RACES ][ MAX_RACE_NAME ];
new g_RaceData[ MAX_RACES ][ 39 ];
//  |-- [0] - Max. players
//  |-- [1] - Number of checkpoints
//  |-- [2] - Vehicle ID to be used with the race
//  |-- [3] - Maximum amount of time.
//  |-- [4] = Is the player allowed to fall off?
//  |-- [5] = The weather ID for this race
//  |-- [6] = Hour this race takes place in
//  |-- [7] = Minute this race takes place in
//  |-- [8] = Number of laps for this race.
//  |-- [9] = Is this race an airbourne race?
//  |-- [10] = Current Race's State
//  |-- [11] = Time the startups were started.
//  |-- [12] = Player who started this race.
//  |-- [13] = Number of signups for this race.
//  |-- [14] = Current number in-place for the countdown.
//  |-- [15] = Player who currently drive #1
//  |-- [16] = Give the race vehicle NOS?
//  |-- [17] = Players that have already finished the race (even if they /leave or get knocked out)
//  |-- [18] = Interior in which this race takes place
//  |-- [19] = The players that reached the finish.
//  |-- [20] = The players that dropped out.
//  |-- [21] = The amount of players taking part in the race.
//  |-- [22] = Is the race valid?
//  |-- [23] = Number of objects in this race.
//  |-- [24] = Is vehicle damage disabled?
//  |-- [25] = Number of object models in this race
//  |-- [26] = The time the race entered the countdown phase, for object preloading.
//  |-- [27] = The draw distance for race objects (default = 300)
//  |-- [28] = bool to determine if the race objects have loaded in this race or not.
//  |-- [29] = The textdraw which displays when the race is loading
//  |-- [30] = The race checkpoint type
//  |-- [31] = The race type (ie circuit, drift, etc)
//  |-- [32] = Flag to determine if a race should load objects staticly or through the streamer
//  |-- [33] = EMPTY SLOT
//  |-- [34] = If set to one, it indicates that all racers must finish within 30 seconds
//  |-- [35] = Number of players that have crossed the finish line (17 = number of players that have left the race)
//  |-- [36] = Bool to determine if a race has unlimited nitro or not.
//  |-- [37] = EMPTY SLOT
//  |-- [38] = Stores the dynamic checkpoint ID associated with the race at the race start for generic races.

new g_RaceResults[ MAX_RACES ][ MAX_SPAWNPOINTS ];
new g_RaceTimes [ MAX_RACES ][ MAX_SPAWNPOINTS ];
new g_RacePosition[ MAX_RACES ][ MAX_PLAYERS ];

new Text:g_RaceLoadTextdraw;    // The textdraw which displays "loading"
//new Text:g_RaceRadio[2];        // The textdraw for the "Race Radio" display

new g_RacesLoaded = 0;
// new g_RaceMenuCnt = 0;
// new Menu:g_RaceMenus[ 5 ];

new Float:g_RacePlayerPos[ MAX_PLAYERS ][ 5 ];
new g_RacePlayers[ MAX_PLAYERS ][ 10 ];
//  |-- [0] = Player state (race related)
//  |-- [1] = Player Race ID
//  |-- [2] = The time remaining to reach the next checkpoint g_RacePlayers[ playerid ][ 2 ]
//  |-- [3] = Progress in the current race
//  |-- [4] = The player's lap in the current race.
//  |-- [5] = Signup ID for the current race;
//  |-- [6] = Time he/she fell off his/her bike/vehicle.
//  |-- [7] = Absolute start-time for this race.
//  |-- [8] = The phase for the object preloading
//  |-- [9] = The time nitro was last added to the players vehicle is race_enable_unlimitednitro is used


#define RACE_TEXT_DRAWS     7
new Text:g_RacePlayerDisplay [ MAX_PLAYERS ][ RACE_TEXT_DRAWS ];      // Player display, such as position, number of laps, etc

new Text:g_RacePosDisplay[ MAX_RACES ][ 3 ];
// [1] = "TOP 4" Banner
// [2] = Each players name
// [3] = Each players drift score.


// Store object data too
enum E_RACE_OBJECT
{
    Float:g_RaceObjectPos[6],           // X, Y, Z, RX, RY, RZ Pos data
    RaceObjectModel,                    // Model ID
    g_RaceObjectID,                     // Object ID for deletion later
    DynamicObject: g_RacePreloadObjectID[MAX_PLAYERS]        // Preloaded object ID for the player
}

new g_RaceObject[ MAX_RACES ][ MAX_RACE_OBJECTS ][ E_RACE_OBJECT ]; 


// Object model data for preloading
new g_RaceObjectModel[ MAX_RACES][ MAX_RACE_OBJECT_MODELS ];




// CRace__Initialize
// This function should be called from OnGameModeInit, so needed
// race data can be loaded properly such as textdraws 
CRace__Initialize( )
{
    g_RaceLoadTextdraw = TextDrawCreate(270.000000, 270.000000, ">> Loading...");   // DO NOT CHANGE THIS STRING OR AMEND IT IN ANYWAY
    TextDrawBackgroundColor(g_RaceLoadTextdraw, 255);
    TextDrawFont(g_RaceLoadTextdraw, 2);
    TextDrawLetterSize(g_RaceLoadTextdraw, 0.509999, 2.199999);
    TextDrawColor(g_RaceLoadTextdraw, -1);
    TextDrawSetOutline(g_RaceLoadTextdraw, 0);
    TextDrawSetProportional(g_RaceLoadTextdraw, 1);
    TextDrawSetShadow(g_RaceLoadTextdraw, 1);

    // Init the vehicle target textdraw
    InitializeRaceRocket();

    new szFunctionName[ 256 ];
    for (new i = 1; i < MAX_RACES; i++)
    {
        format( szFunctionName, sizeof( szFunctionName ), "CRace__Initialize__RACE%d", i );
        if (CallLocalFunction( szFunctionName, "" ))
        {
            g_RaceData[ i ][ 10 ] = RACE_STATE_IDLE;
            _RaceLoaded[ i ] = 1;
            g_RacesLoaded++;
            g_RaceData[i][22] = true;
            g_RaceData[i][25] = DetermineNumberOfModelsForRace(i);

            // Create the textdraw which displays the race name when the race is loading (i.e. when the screen fades)
            g_RaceData[i][29] = _:TextDrawCreate(191, 199, g_RaceNames[i]);
            TextDrawBackgroundColor(Text:g_RaceData[i][29], 255);
            TextDrawFont(Text:g_RaceData[i][29], 0);
            TextDrawLetterSize(Text:g_RaceData[i][29], 0.749999, 3.199999);
            TextDrawColor(Text:g_RaceData[i][29], -1);
            TextDrawSetOutline(Text:g_RaceData[i][29], 0);
            TextDrawSetProportional(Text:g_RaceData[i][29], 1);
            TextDrawSetShadow(Text:g_RaceData[i][29], 1);

            for (new y = 0; y < MAX_SPAWNPOINTS; y++)
            {
                g_RaceResults [i] [y] = -1;
                g_RaceTimes [i] [y] = -1;
            }

            // If this is a drift race, create the position display textdraw
            if(CRace__GetType( i ) == RACE_TYPE_DRIFT)
            {
                CRace__InitPosDisplay( i );
            }

            // Ok, if this is just a genereic race (eg /race1, nothing on objects,
            // just a land race) we'll show a race flag map icon here as well as a
            // checkpoint. When a player is freeroaming and enters the checkpoint
            // we'll give them the option to start the race
            if(CRace__GetType( i ) == RACE_TYPE_GENERIC)
            {

                // Get the start position co-ords
                new
                    Float:fPosX,
                    Float:fPosY,
                    Float:fPosZ,
                    iSpawnID = 0;

                fPosX = g_RaceSpawnPositions[ i ][ iSpawnID ][ 0 ];
                fPosY = g_RaceSpawnPositions[ i ][ iSpawnID ][ 1 ];
                fPosZ = g_RaceSpawnPositions[ i ][ iSpawnID ][ 2 ];

                CreateDynamicMapIcon(fPosX, fPosY, fPosZ, 53, 0, 0, 0);

                g_RaceData[ i ][ 38 ] = _: CreateDynamicCP(fPosX, fPosY, fPosZ, 2.0, 0);
            }
        }
    }

    // All races have been initialized, output the number of loaded races
    // to the console, so that can be seen in logfiles (if needed).
    if (g_RacesLoaded == 0)
        printf("[RaceController] ERROR: Could not load any races.");
}


static  iDialogRaceIDs[MAX_PLAYERS][MAX_RACES];
static  iDialogRaceCount[MAX_PLAYERS];

// CRace__ShowPlayerDialog
// This function shows the main race dialog for the player
// Which is the main interface for races. It allows them to choose
// a race style and then lists the appropriate races based on the selection.
CRace__ShowPlayerDialog( playerid, iRaceType = -1 )
{
    // If the race type isn't specified, show the main menu since the player hasn't chosen a type yet.
    if(iRaceType == -1)
    {
        new szCaption[128];
        format(szCaption, 128, "LVP Racing (%d races found)", g_RacesLoaded);
        ShowPlayerDialog(playerid, DIALOG_RACE_MAIN, DIALOG_STYLE_LIST, szCaption, "Generic\r\n{FFFB00}Circuit\r\n{F52A1C}Knockout\r\n{2C6510}Drift\r\n{2540ED}Stunt\r\n{FF00F0}Air\r\n{00FCFF}Boat\r\n{FFFFFF}Crazy Jumps", "Select", "Cancel");
        return;
    }


    // Is the race type valid?
    if(iRaceType < RACE_TYPE_GENERIC || iRaceType > RACE_TYPE_JUMP_ZONE)
    {
        return;
    }

    // Reset the count for the race ID storing
    iDialogRaceCount[playerid] = 0;

    // Ok now build the dialog
    new
        szDialogDisplay[1024],
        szDialogTitle[32],
        szDialogColour[12];

    // First of all format the title of the dialog based on the type of race

        /*
        Race
        Generic - White
        Circuit - Yellow
        Knockout - Red
        Drift - Green
        Stunt - Blue
        */


    switch( iRaceType)
    {
        case RACE_TYPE_GENERIC:
        {
            szDialogTitle = "Generic Races";
        }

        case RACE_TYPE_CIRCUIT:
        {
            szDialogTitle = "Circuit Races";
            szDialogColour = "{FFFB00}";
        }

        case RACE_TYPE_KNOCKOUT:
        {
            szDialogTitle = "Knockout Races";
            szDialogColour = "{F52A1C}";
        }

        case RACE_TYPE_DRIFT:
        {
            szDialogTitle = "Drift Races";
            szDialogColour = "{2C6510}";
        }

        case RACE_TYPE_STUNT:
        {
            szDialogTitle = "Stunt Races";
            szDialogColour = "{2540ED}";
        }

        case RACE_TYPE_AIR:
        {
            szDialogTitle = "Air Races";
            szDialogColour = "{FF00F0}";
        }

        case RACE_TYPE_BOAT:
        {
            szDialogTitle = "Boat Races";
            szDialogColour = "{00FCFF}";
        }
        case RACE_TYPE_JUMP_ZONE:
        {
            szDialogTitle = "Jump Zone Races";
            szDialogColour = "{FFFFFF}";
        }

        default:
        {
            szDialogTitle = "Misc Races";
        }
    }

    if( iRaceType == RACE_TYPE_JUMP_ZONE)
    {
        ShowMapZoneJumpRaceDialog(playerid);
        return;
    }

    for(new iRaceID = 1; iRaceID < g_RacesLoaded + 1; iRaceID++)
    {
        if(CRace__GetType( iRaceID ) != iRaceType)
        {
            continue;
        }


        // If the string has no race names stored, this is obviously the first one.
        // So therefore we format the first name into the dialog string without the line breaks
        if(!strlen(szDialogDisplay))
        {
            format(szDialogDisplay, sizeof(szDialogDisplay), "%s%s", szDialogColour, g_RaceNames[ iRaceID ]);
        }
        else    // Ok the string isn't empty. Insert an additional race name into it, remembering to add the line breaks.
        {
            format(szDialogDisplay, sizeof(szDialogDisplay), "%s\r\n%s%s", szDialogDisplay, szDialogColour, g_RaceNames[ iRaceID ] );
        }


        // Now we need to store each individual race ID into an array so we can
        // retrieve it when the player selects a race later.
        new iDialogSlotID = iDialogRaceCount[playerid];
        iDialogRaceIDs[playerid][iDialogSlotID] = iRaceID;

        iDialogRaceCount[playerid]++;

    }

    // All done, now we can display our dialog for the player and we're done.
    if( iDialogRaceCount[playerid] > 0)
    {
        ShowPlayerDialog(playerid, DIALOG_RACE_SUB, DIALOG_STYLE_LIST, szDialogTitle, szDialogDisplay, "Select", "Back");
    }
    else    // No races found for that category :x Take the player back to the main menu
    {
        CRace__ShowPlayerDialog(playerid);
    }
}

// CRace__OnDialogResponse
// Called from OnDialogResponse when the dialogid is either RACE_DIALOG_MAIN, RACE_DIALOG_SUB, or DIALOG_WORLD_RACE_START
CRace__OnDialogResponse( playerid, dialogid, response, listitem )
{
    if(dialogid == DIALOG_RACE_MAIN)
    {
        // Player has chosen an option from the main menu. Show the corresponding sub menu.
        if(response)
        {
            if(listitem == RACE_TYPE_JUMP_ZONE)
            {
                ShowMapZoneJumpRaceDialog(playerid);
                return;
            }
            CRace__ShowPlayerDialog(playerid, listitem);
        }
        return;
    }

    else if(dialogid == DIALOG_RACE_SUB)
    {
        // Player has chosen a race!
        if(response)
        {
            new iRaceID = iDialogRaceIDs[playerid][listitem];

            // Now just call CRace__OnCommand based on the race id and let that function do the rest :)
            new szString[ 3 ];
            format( szString, 3, "%d", iRaceID );
            CRace__OnCommand( playerid, szString );
            return;
        }
        else    // Player has selected "Back".
        {
            CRace__ShowPlayerDialog(playerid);
        }
        return;
    }

    // Check for the main world dialogs
    else if(dialogid == DIALOG_WORLD_RACE_START)
    {
        new iRaceID = GetPVarInt(playerid, "i_Race_World_Dialog_ID");

        // Quick bit of unncessary error checking, as usual :>
        if(iRaceID < 0 || iRaceID > g_RacesLoaded)
        {
            return;
        }

        // This is simply an information dialog displaying that the race is already in
        // progress so do nothing
        if(CRace__GetStatus( iRaceID ) > RACE_STATE_SIGNUP)
        {
            return;
        }

        if(!response)
        {
            return;
        }

        // Alright just call the command function and let that do the rest

        new szString[ 3 ];
        format( szString, 3, "%d", iRaceID );
        CRace__OnCommand( playerid, szString );
    }
}


// CRace__ProcessLoadDisplay
// This function is called every 100ms to process the ">> Loading" display textdraw.
// It displays it in cool flashing colours
new iRaceDisplayTime;
new iRaceDisplayPos;

CRace__ProcessLoadDisplay()
{
    if(iRaceDisplayTime != 0)
    {
        if(GetTickCount() - iRaceDisplayTime > 1250)
        {
            iRaceDisplayTime = 0;
        }
        return;
    }

    new szDisplay[128];
    szDisplay = ">> Loading...";

    strins(szDisplay, "~p~", iRaceDisplayPos);
    iRaceDisplayPos++;

    if(iRaceDisplayPos != 14)
    {
        strins(szDisplay, "~w~", iRaceDisplayPos + 3);
    }

    TextDrawSetString(g_RaceLoadTextdraw, szDisplay);

    if(iRaceDisplayPos == 14)
    {
        iRaceDisplayTime = GetTickCount();
        iRaceDisplayPos = 0;
        return;
    }
}

// CRace__CheckDynamicCP
// This function is called from OnPlayerEnterDynamicCheckpoint.
// It checks if a player has entered a dynamic race checkpoint which show
// in the main world for generic races and allows the player to start a race from
// that position. If it is a race dynamic checkpoint they're entering, it calls
// CRace__PlayerEnterWorldCP(playerid, raceid)
CRace__CheckDynamicCP(playerid, DynamicCP: checkpointid)
{
    for(new iRaceID = 0; iRaceID < g_RacesLoaded; iRaceID++)
    {
        if(CRace__GetType( iRaceID ) != RACE_TYPE_GENERIC)  // Only works for generic races
        {
            continue;
        }

        if(checkpointid == DynamicCP: g_RaceData[ iRaceID ][ 38 ])
        {
            CRace__PlayerEnterWorldCP(playerid, iRaceID);
            return;
        }
    }
}


// CRace__PlayerEnterWorldCP
// This function is called when a player enters one of the checkpoints
// in world 0 which allow the player to start a generic race. It shows
// a dialog for the player to start the race
CRace__PlayerEnterWorldCP(playerid, iRaceID)
{
    if(GetPlayerState(playerid) != PLAYER_STATE_ONFOOT)
    {
        // Only proceed if the player is on foot, obviously.
        return;
    }

    // Alright we'll show a dialog allowing the player to
    // start this race.
    new szCaption[MAX_RACE_NAME + 6];
    format(szCaption, MAX_RACE_NAME, "%s Race", g_RaceNames[iRaceID]);

    new szDisplayInfo[128];

    // If the race is idle we show a dialog for the player to start it accordingly
    if (CRace__GetStatus( iRaceID ) == RACE_STATE_IDLE)
    {
        format(szDisplayInfo, 128, "Would you like to start the %s race?", g_RaceNames[ iRaceID ]);
        ShowPlayerDialog(playerid, DIALOG_WORLD_RACE_START, DIALOG_STYLE_MSGBOX, szCaption, szDisplayInfo, "Start Race", "Close");
    }
    else if (CRace__GetStatus( iRaceID ) == RACE_STATE_SIGNUP)
    {
        format(szDisplayInfo, 128, "The %s race is currently signing up. Would you like to join?", g_RaceNames[ iRaceID ]);
        ShowPlayerDialog(playerid, DIALOG_WORLD_RACE_START, DIALOG_STYLE_MSGBOX, szCaption, szDisplayInfo, "Join Race", "Close");
    }
    else
    {
        format(szDisplayInfo, 128, "The %s race is currently in progress! Try again later. You can also use /race%d.", g_RaceNames[ iRaceID ], iRaceID);
        ShowPlayerDialog(playerid, DIALOG_WORLD_RACE_START, DIALOG_STYLE_MSGBOX, szCaption, szDisplayInfo, "Close", "");
    }
    SetPVarInt(playerid, "i_Race_World_Dialog_ID", iRaceID);
}

// CRace__OnCommand
// This method gets triggered as soon as someone enters a command that
// starts with /race. We might need to show the menu, or start a race.
CRace__OnCommand( playerid, params[] )
{

    // Check if we need to show the race menu / overview;
    if (strlen( params ) == 0 || !IsNumeric( params ) || strval(params) < 0 || strval(params) > g_RacesLoaded)
    {
        //  ShowMenuForPlayer( RaceMenu, playerid );
    //  new str[20];
    //  format(str,256,"* Use: /race[1-%d]",g_RacesLoaded);
    //  SendClientMessage(playerid,COLOR_WHITE,str);
        CRace__ShowPlayerDialog(playerid);
        return 1;
    }

    // Else we simply need to start the race. Check the current
    // progress of the race, and decide what we need to do.
    new iRaceID = strval( params );

    // Is the race available (any player-slots available?)
    if (g_RaceData[ iRaceID ][ 0 ] == 0)
    {
        SendClientMessage( playerid, COLOR_WHITE, "SERVER: The requested race is unavailable." );
        return 1;
    }

    // Ok.. Is the race currently available/accepting signups?
    if (CRace__GetStatus( iRaceID ) >= RACE_STATE_COUNTDOWN) {
        ShowBoxForPlayer(playerid, "Sorry, this race is currently in progress. Try again later.");
        return 1;
    }

    // Ok.. that is fine too, decide if the player is currently signed up for
    // another race or another minigame, which would be quite irritating as well.
    if (CRace__GetPlayerStatus( playerid ) != RACE_STATE_NONE || IsPlayerStatusMinigame( playerid ) || isPlayerBrief[playerid]) {
        ShowBoxForPlayer(playerid, "You're already taking part in a race/minigame!");
        return 1;
    }
    // has the player signed up with anything else?
    if(!IsPlayerMinigameFree(playerid))
    {
        ShowBoxForPlayer(playerid, "You're already taking part in a different minigame.");
        return 1;
    }


    // Do we have enough money to signup for this race?
    if (GetPlayerMoney( playerid ) < RACE_PRICE)
    {
        ShowPlayerBox(playerid, "You need $%s to take part in this race.", formatPrice(RACE_PRICE));
        return 1;
    }

    if(g_RaceData[ iRaceID ][ 21 ] == g_RaceData[ iRaceID ][ 0 ])
    {
        ShowBoxForPlayer(playerid, "This race is in progress!");
        return 1;
    }

    // Signup the player, note that the race is beginning;
    GivePlayerMoney( playerid, -RACE_PRICE );
    g_RacePlayers[ playerid ][ 0 ] = RACE_STATE_SIGNUP;
    g_RacePlayers[ playerid ][ 1 ] = iRaceID;
    g_RaceData[ iRaceID ][ 11 ] = Time->currentTime();
    g_RaceData[ iRaceID ][ 13 ] ++;
    g_RaceData[ iRaceID ][ 21 ] ++;

    new szMessage[ 256 ], szName[ 24 ];
    GetPlayerName( playerid, szName, 24 );

    // Are we starting with a new race, or just signing up for one?
    if (CRace__GetStatus( iRaceID ) == RACE_STATE_IDLE)
    {
        new commandName[12];
        format(commandName, sizeof(commandName), "/race %d", iRaceID);

        Announcements->announceMinigameSignup(RaceMinigame, g_RaceNames[iRaceID], commandName, RACE_PRICE, playerid);

        format(szMessage, sizeof(szMessage), "~y~%s race~w~ is now signing up!~n~Want to join? ~r~/race %d~w~!",
            g_RaceNames[iRaceID], iRaceID);
        GameTextForAllEx(szMessage, 5000, 5);
        Responses->respondMinigameSignedUp(playerid, RaceMinigame, g_RaceNames[iRaceID], RACE_SIGNUP_TIME);

        format(szMessage, sizeof(szMessage), "~r~~h~%s~w~ has signed up for ~y~%s race~w~ (~p~%s~w~)",
        Player(playerid)->nicknameString(), g_RaceNames[iRaceID], commandName);
        NewsController->show(szMessage);

        // Finally, send a message to the player itself;
        g_RaceData[ iRaceID ][ 10 ] = RACE_STATE_SIGNUP;
        g_RaceData[ iRaceID ][ 12 ] = playerid;
        g_RaceData[ iRaceID ][ 13 ] = 1;
        g_RaceData[ iRaceID ][ 21] = 1;

        // CRace__StartRace( iRaceID );
        return 1;
    }

    // Apparently we're simply joining another race. A sightly other
    // procedure is needed here, well, as for the messages at least.
    format( szMessage, sizeof( szMessage ), "%s (Id:%d) has signed up for /race %d.", szName, playerid, iRaceID);
    Admin(playerid, szMessage);

    new commandName[12];
    format(commandName, sizeof(commandName), "/race %d", iRaceID);
    format(szMessage, sizeof(szMessage), "~r~~h~%s~w~ has signed up for ~y~%s race~w~ (~p~%s~w~)",
        Player(playerid)->nicknameString(), g_RaceNames[iRaceID], commandName);
    NewsController->show(szMessage);

    // Check if we need to start the race (filled?)
    if (g_RaceData[ iRaceID ][ 13 ] == g_RaceData[ iRaceID ][ 0 ])
        CRace__StartRace( iRaceID );

    // And finally -- finally - a message to the user itself about his/her signup.
    Responses->respondMinigameSignedUp(playerid, RaceMinigame, g_RaceNames[iRaceID], RACE_SIGNUP_TIME);

    return 1;
}

// CRace__Process
// The process function gets called every second, and we need to determain
// in here what we need to do. Timeouts, kicks, etcetera.
CRace__Process( )
{
    // Walk through all the races to check their status;
    new szMessage[ 256 ], Float:fPosX, Float:fPosY, Float:fPosZ;

    for (new i = 0; i <= g_RacesLoaded; i++)
    {
        if (g_RaceData[ i ][ 10 ] <= RACE_STATE_IDLE)
            continue;

        if (g_RaceData[ i ][ 10 ] == RACE_STATE_SIGNUP)
        {
            if ((Time->currentTime() - g_RaceData[ i ][ 11 ]) >= RACE_SIGNUP_TIME)
            {
                if (g_RaceData[ i ][ 13 ] == 1 && !RACE_ALLOW_SINGLE)
                {
                    CRace__EndForPlayer(g_RaceData[ i ][ 12 ], SIGNOUT);
                    ShowBoxForPlayer(i, "Not enough players have signed up for this race. You have been refunded.");
                    //GivePlayerMoney( g_RaceData[ i ][ 12 ], RACE_PRICE ); // this already happens in endforplayer SIGNOUT
                    g_RaceData[ i ][ 10 ] = RACE_STATE_IDLE;
                    g_RaceData[ i ][ 12 ] = 0;
                    g_RaceData[ i ][ 13 ] = 0;
                    g_RaceData[ i ][ 21 ] = 0;
                    g_RaceData[ i ][ 28 ] = 0;
                    continue;
                }
                // Multiple users have signed up, we can start the race!
                CRace__StartRace( i );
                continue;
            }
        }

        // Prior to actually starting a race, there might be a countdown which
        // we need to handle. This is the part where that's done.
        if (g_RaceData[i][10] == RACE_STATE_COUNTDOWN) {
            // Ok first of all check if any players are in the preloading object
            // state. If so, obviously we need to end this and continue with the race countdown.
            // Update: The object preloading now works in two parts.
            // 5 seconds to preload the objects for the player, and 1 second to
            // load the actual map objects.
            if (g_RaceData[i][26] != 0) {
                // Ok this race is in the preload state.
                new iTime = Time->currentTime() - g_RaceData[i][26],
                    objectCount = CRace__GetObjectCount(i);

                // Check if half of the preload time has passed. If so
                // we need to load the second half of the objects.
                if (objectCount > 0 && iTime > floatround(RACE_OBJECT_PRELOAD_TIME / 2) && iTime < RACE_OBJECT_PRELOAD_TIME - 1 && g_RaceData[i][28] != 2)
                {
                    g_RaceData[i][28] = 2;

                    for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
                    {
                        if(!Player(j)->isConnected() || IsPlayerNPC(j) || g_RacePlayers[ j ][ 1 ] != i)
                        {
                            continue;
                        }

                        new iSignupID = g_RacePlayers [ j ][ 5 ];
                        new iRaceID = i;
                        CRace__PreloadObjectsForPlayer(j, i, g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 0 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 1 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 2 ], OBJECT_PRELOAD_PHASE_FINISH);
                    }
                    continue;
                }


                // Now, check if 5 seconds (or whatever RACE_OBJECT_PRELOAD_TIME -1 is equal to)
                // has passed and if so, remove the per-player objects (i.e. the objects being preloaded)
                // and create the actual race map.
                if (objectCount > 0 && iTime > RACE_OBJECT_PRELOAD_TIME - 2 && g_RaceData [ i ][ 28 ] == 2) {
                    g_RaceData [i][28] = 1;
                    CRace__LoadObjects(i);

                    for (new j = 0; j <= PlayerManager->highestPlayerId(); ++j) {
                        if (Player(j)->isConnected() == false || Player(j)->isNonPlayerCharacter())
                            continue; // not connected, or the player is a NPC.

                        if (g_RacePlayers[j][1] != i)
                            continue; // the player doesn't participate in this race.

                        Streamer_Update(i);
                        CRace__FinishPreloadForPlayer(j, i);    // destroy the preloaded objects for the player
                    }
                    continue;
                }


                // Alright cool. This race is in a preload state and
                // the time has passed for both the per-player preloading objects and the actual race
                // map. We can get a move on with this thing!
                if(objectCount == 0 || (iTime > RACE_OBJECT_PRELOAD_TIME && g_RaceData[i][28] == 1)) {
                    g_RaceData[i][26] = 0;

                    for (new j = 0; j <= PlayerManager->highestPlayerId(); ++j) {
                        if (Player(j)->isConnected() == false || Player(j)->isNonPlayerCharacter())
                            continue; // not connected, or the player is a NPC.

                        if (g_RacePlayers[j][1] != i)
                            continue; // the player doesn't participate in this race.

                        Streamer_Update(j);
                        CRace__LoadRaceDataForPlayer(j, i, false);
                    }
                }
                // Alright the objects haven't yet preloaded. Don't proceed with the countdown
                continue;
            }

            // Start the race! Countdown finished
            if (g_RaceData[ i ][ 14 ] == 0)
            {
                for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
                {
                    if (!IsPlayerConnected( j ))
                    {
                        continue;
                    }

                    if(IsPlayerNPC( j ))
                    {
                        continue;
                    }

                    // If the race is already running, we don't show a countdown!
                    if (g_RacePlayers[ j ][ 1 ] != i || g_RacePlayers[ j ][ 0 ] == RACE_STATE_RUNNING)
                    {
                        continue;
                    }


                    // Go! Yay! The player can start, finally :)
                    GetPlayerPos( j, fPosX, fPosY, fPosZ );
                    PlayerPlaySound( j, 3200, fPosX, fPosY, fPosZ );
                    GameTextForPlayer( j, "~g~Go Go Go!!", 2000, 6 );

                    TogglePlayerControllable( j, 1 );

                    g_RacePlayers[ j ][ 7 ] = GetTickCount( );

                    SetVehicleParamsEx(GetPlayerVehicleID(j), 1, 0, 0, 0, 0, 0, 0);
                    // Update the players state, since at this point the race is running;

                    g_RacePlayers[ j ][ 0 ] = RACE_STATE_RUNNING;

                    CRace__CreatePlayerTextDraw( j, i );

                    // Enable the drift handler if this is a drift race \o/
                    if(CRace__GetType( i ) == RACE_TYPE_DRIFT)
                    {
                        CDrift__EnableForPlayer( j );
                        // Fix for #1577 - give the player a starting time of 25 seconds
                        g_RacePlayers[ j ][ 2 ] = 25;
                    }

                    // and finally set the checkpoint.
                    CRace__CheckpointForPlayer( j );
                }

                // Make sure the game knows that we're running fine.
                g_RaceData[ i ][ 10 ] = RACE_STATE_RUNNING;
                continue;
            }
            else
            {
                // Compile the message we need to send;
                if(g_RaceData[ i ][ 14 ] > 3)
                {
                    format( szMessage, 256, "~w~%d", g_RaceData[ i ][ 14 ]);
                }

                if(g_RaceData[ i ][ 14 ] == 3)
                {
                    format(szMessage,256,"~r~%d",g_RaceData[ i ][ 14 ]);
                }
                if(g_RaceData[ i ][ 14 ] == 2)
                {
                    format(szMessage,256,"~y~%d",g_RaceData[ i ][ 14 ]);
                }

                if(g_RaceData[ i ][ 14 ] == 1)
                {
                    format(szMessage,256,"~g~%d",g_RaceData[ i ][ 14 ]);
                }

                // Walk though this stuff for all players participating;
                for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
                {
                    if (!IsPlayerConnected( j ))
                    {
                        continue;
                    }

                    if (g_RacePlayers[ j ][ 1 ] != i || g_RacePlayers[ j ][ 0 ] != RACE_STATE_COUNTDOWN)
                    {
                        continue;
                    }

                    // If we're on the last second of the countdown, play a slightly different sound
                    if(g_RaceData[ i ][ 14 ] == 1)
                    {
                        PlayerPlaySound(j, 5201, 0, 0, 0);
                    }
                    else if (g_RaceData[ i ][ 14 ] != 0)
                    {
                        PlayerPlaySound( j, 5205, fPosX, fPosY, fPosZ );
                    }

                    // Make sure the player gets a message with the remaining seconds;
                    GetPlayerPos( j, fPosX, fPosY, fPosZ );

                    GameTextForPlayer( j, szMessage, 1100, 6 );
                    TogglePlayerControllable( j, false );

                    // Just add a quick check here: If the race uses objects,
                    // the objects may not have loaded for the player if they badly lag (very rare)
                    // so we just quickly check that the player is at their correct spawn position
                    // and reset them to that position if not.
                    new iSignupID = g_RacePlayers[j][5];

                    if(fPosX != g_RaceSpawnPositions[ i ][ iSignupID ][ 2 ] || fPosY != g_RaceSpawnPositions[ i ][ iSignupID ][ 1 ] || fPosZ != g_RaceSpawnPositions[ i ][ iSignupID ][ 2 ])
                    {
                        SetVehiclePos(GetPlayerVehicleID(j), g_RaceSpawnPositions[ i ][ iSignupID ][ 0 ], g_RaceSpawnPositions[ i ][ iSignupID ][ 1 ], g_RaceSpawnPositions[ i ][ iSignupID ][ 2 ]);
                    }
                }
                g_RaceData[ i ][ 14 ] --;
                continue;
            }

        }



        // Alright now we process drift races. The "Time to reach checkpoint" countdown and display
        if (g_RaceData[ i ][ 10 ] == RACE_STATE_RUNNING && CRace__GetType( i ) == RACE_TYPE_DRIFT)
        {
            CRace__UpdatePosDisplay( i );

            // Loop through the players particpating in this drift race and prepare to process their
            // countdown msg
            for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
            {
                if (!IsPlayerConnected( j ))
                {
                    continue;
                }

                if (g_RacePlayers[ j ][ 1 ] != i || g_RacePlayers[ j ][ 0 ] != RACE_STATE_RUNNING)
                {
                    continue;
                }

                if(g_RacePlayers[ j ][ 2 ] == -7)   // Indictaes that the player has finished the race
                {
                    continue;
                }

                // Player is out of time. Display an OUT OF TIME gametext msg for 2 seconds
                // before remove them from the race.
                if(g_RacePlayers[ j ][ 2 ] == 0)
                {
                    TogglePlayerControllable(j, false);
                    GameTextForPlayer(j, "~r~OUT OF TIME", 6000, 6);
                    SetCameraBehindPlayer(j);
                    CRace__UpdatePlayerTextdraw( j, i );

                }
                else if (g_RacePlayers[ j ][ 2 ] == -6)
                {
                    // Player has ran out of time in which to reach this checkpoint. They're out of the race.
                    CRace__EndForPlayer( j, TOOSLOW );
                }
                else
                {
                    CRace__UpdatePlayerTextdraw( j, i );
                }
                g_RacePlayers[ j ][ 2 ] --;
            }
        }
    }


    // We also loop through the players once, purely for the sake of
    // handling per-player statistics (saves like RaceCount-1 loops)

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if (!CRace__IsRacing( i ))
        {
            continue;
        }
        new iRaceID = g_RacePlayers[ i ][ 1 ];

        // Is the race running? Otherwise we just ignore the loop.
        if (g_RaceData[ iRaceID ][ 10 ] == RACE_STATE_RUNNING)
        {
            if (g_RacePlayers[ i ][ 6 ] > 0)
            {
                new iTimeOnFoot = Time->currentTime() - g_RacePlayers[ i ][ 6 ];
                if (iTimeOnFoot >= 10)
                {
                    // We're out, been on-foot for 10 seconds or longer.
                    CRace__EndForPlayer( i, ONFOOT );
                    continue;
                }

                // Otherwise just show the message for this user;
                format( szMessage, sizeof( szMessage ), "~r~%d", ( 10 - iTimeOnFoot ) );
                GetPlayerPos( i, fPosX, fPosY, fPosZ );
                PlayerPlaySound( i, 1052, fPosX, fPosY, fPosZ );
                GameTextForPlayer( i, szMessage, 1100, 5 );
            }

            // Check to repair vehicle damage
            if(g_RaceData[ iRaceID ][ 24 ] == 1)
            {
                SetVehicleHealth(GetPlayerVehicleID(i), 4000);
            }

            // Check for unlimited nitro. Every 20 seconds we need to
            // re-apply the nitro vehicle component if the race_set_unlimited_nitro option is enabled


            if(g_RaceData[ iRaceID ][ 36 ] == 1)    // This race has unlimited nitro enabled
            {
                if(g_RacePlayers [ i ][ 9 ] != 0)    // Ok the function has been called at least once since we have a timestamp stored
                {
                    if(Time->currentTime() -g_RacePlayers [ i ][ 9 ] > 20)    // Only re-apply nitro to a vehicle every 20 seconds
                    {
                        if(VehicleModel(GetVehicleModel(GetPlayerVehicleID(i)))->isNitroInjectionAvailable())
                        {
                            AddVehicleComponent(GetPlayerVehicleID(i), 1009);
                            g_RacePlayers [ i ][ 9 ] = Time->currentTime();
                        }
                        else    // Player isn't in a valid nitro vehicle - disable unlimited nos!
                        {
                            printf("[Race] WARNING: race_enable_unlimited_nos was enabled for race %d, however the race vehicle is not nitro valid! Disabled unlimited nos for this race.", iRaceID);
                            g_RaceData[ iRaceID ][ 36 ] = 0;
                            g_RacePlayers [ i ][ 9 ] = 0;

                        }
                    }
                }
                else    // No timestamp stored, we're adding nitro for the first time!
                {
                    if(VehicleModel(GetVehicleModel(GetPlayerVehicleID(i)))->isNitroInjectionAvailable())
                    {
                        AddVehicleComponent(GetPlayerVehicleID(i), 1009);
                        g_RacePlayers [ i ][ 9 ] = Time->currentTime();
                    }
                    else    // Player isn't in a valid nitro vehicle - disable unlimited nos!
                    {
                        printf("[Race] WARNING: race_enable_unlimited_nos was enabled for race %d, however the race vehicle is not nitro valid! Disabled unlimited nos for this race.", iRaceID);
                        g_RaceData[ iRaceID ][ 36 ] = 0;
                    }
                }
            }

            // Check if the race-time expired, needed as well.
            if ((Time->currentTime() - g_RaceData[ iRaceID ][ 11 ]) >= g_RaceData[ iRaceID ][ 3 ])
            {
                CRace__EndForPlayer( i, TOOSLOW );
                continue;
            }
        }
    }
}

CRace__HasPlayerSignedUp(playerId) {
    return g_RacePlayers[playerId][0] == RACE_STATE_SIGNUP;
}

// CRace__StartRace
// The startrace function gets called whenever we're ready to start the
// race. In here we need to spawn the vehicles / whatever else needs to be done.
CRace__StartRace( iRaceID )
{

    // Is the race is in the signup phase?
    if(g_RaceData[ iRaceID ][ 10 ] != RACE_STATE_SIGNUP)
    {
        return 0;
    }


    // Note the flags for the race itself, so the handler takes over again.
    g_RaceData[ iRaceID ][ 10 ] = RACE_STATE_COUNTDOWN;
    g_RaceData[ iRaceID ][ 11 ] = Time->currentTime();
    g_RaceData[ iRaceID ][ 14 ] = 5;
    g_RaceData[ iRaceID ][ 17 ] = 0;
    g_RaceData[ iRaceID ][ 19 ] = 0;
    g_RaceData[ iRaceID ][ 20 ] = 0;
    g_RaceData[ iRaceID ][ 26 ] = Time->currentTime();
    g_RaceData[ iRaceID ][ 28 ] = 0;
    g_RaceData[ iRaceID ][ 34 ] = 0;


    new iSignupID;

    // Just loop through all the user slots until we find every single
    // connected player that's eager to join this race.
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if (!IsPlayerConnected( i ))
        {
            continue;
        }


        if (g_RacePlayers[ i ][ 1 ] != iRaceID || g_RacePlayers[ i ][ 0 ] != RACE_STATE_SIGNUP)
        {
            continue;
        }

        // Clear the players menus to stop any bugs occuring
        ClearPlayerMenus(i);


        // Set the Virtual World which we'll use for this game;

        GetPlayerPos( i, g_RacePlayerPos[ i ][ 0 ], g_RacePlayerPos[ i ][ 1 ], g_RacePlayerPos[ i ][ 2 ] );

        if(IsPlayerInAnyVehicle(i))
        {
            // Fix a SA:MP bug with the radio not working in races:
            RemovePlayerFromVehicle(i);
        }

        g_RacePlayerPos[ i ][ 3 ] = float( GetPlayerVirtualWorld( i ) );
        g_RacePlayerPos[ i ][ 4 ] = float( GetPlayerInterior( i ) );

        SetPlayerInterior(i, g_RaceData[ iRaceID ][ 18 ]);
        SetPlayerPos(i, g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 0 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 1 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 2 ]);
//      SetPlayerPos(i, g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 0 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 1 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 2 ]);


        SetPVarInt(i, "iRaceID", iRaceID);
        SetPlayerVirtualWorld( i, ( 200 + iRaceID ) );

        DisablePlayerCheckpoint(i);

        // Update the streamer to the spawn position for the player so we're
        // certain all the objects have loaded
        Streamer_UpdateEx(i, g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 0 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 1 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 2 ]);
        Streamer_Update(i);

        PlayerState(i)->updateState(RacingPlayerState);
        TogglePlayerControllable( i, 0 );
        SetCameraBehindPlayer( i );
        SavePlayerGuns( i );

        // Be sure that we know a number of player conditionals after the race;
        g_RacePlayers[ i ][ 5 ] = iSignupID;
        // Make sure the rest of the script knows the player's busy in this race;
        g_RacePlayers[ i ][ 0 ] = RACE_STATE_COUNTDOWN;
        g_RacePlayers[ i ][ 3 ] = 0;
        g_RacePlayers[ i ][ 4 ] = 1;
        g_RacePlayers[ i ][ 6 ] = 0;
        g_RacePlayers[ i ][ 2 ] = 0;

        iSignupID++;

    }
    return 1;
}

// CRace__LoadRaceDataForPlayer
// This function is called after the players screen has faded in and
// loads the race data for the player such as the vehicle, etc
// If the n_preload is false the objects have already preloaded for the player
CRace__LoadRaceDataForPlayer(playerid, iRaceID, bool:n_Preload = true)
{
    new iSignupID = g_RacePlayers[ playerid ][ 5 ];

    SetPVarInt(playerid, "iRaceID", 0);

    if(n_Preload == false)
        SendClientMessage(playerid, COLOR_ORANGE,"* Get ready to start the race! You can leave at any time using /leave.");

    // Set the other conditials for this player, e.g. the time/weather
    if (g_RaceData[ iRaceID ][ 5 ] != 0)
        SetPlayerWeather( playerid, g_RaceData[ iRaceID ][ 5 ] );

    if (g_RaceData[ iRaceID ][ 6 ] != 0)
        TimeController->setPlayerOverrideTime(playerid, g_RaceData[ iRaceID ][ 6 ], g_RaceData[ iRaceID ][ 7 ]);

    if(n_Preload == true) {
        // Okay, before we put the player in the vehicle check to preload any objects first.
        if(CRace__GetObjectCount(iRaceID) > 0) {
            CRace__PreloadObjectsForPlayer(playerid, iRaceID, g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 0 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 1 ], g_RaceSpawnPositions[ iRaceID ][ iSignupID ][ 2 ], OBJECT_PRELOAD_PHASE_START);
            g_RaceData[ iRaceID ][ 26 ] = Time->currentTime();    // store the timestamp so we know when to finish preloading
        }
        else
            goto l_NormalLoad;
    }
    else {
l_NormalLoad:
        // Create the vehicle this player will be using;
        g_RaceVehicles[iRaceID][iSignupID] = VehicleManager->createVehicle(
            /** modelId   **/ g_RaceData[iRaceID][2],
            /** positionX **/ g_RaceSpawnPositions[iRaceID][iSignupID][0],
            /** positionY **/ g_RaceSpawnPositions[iRaceID][iSignupID][1],
            /** positionZ **/ g_RaceSpawnPositions[iRaceID][iSignupID][2],
            /** angle     **/ g_RaceSpawnPositions[iRaceID][iSignupID][3],
            /** color1    **/ floatround(g_RaceSpawnPositions[iRaceID][iSignupID][4]),
            /** color2    **/ floatround(g_RaceSpawnPositions[iRaceID][iSignupID][5]));

        SetVehicleVirtualWorld(g_RaceVehicles[iRaceID][iSignupID], iRaceID + 200);
        LinkVehicleToInterior(g_RaceVehicles[iRaceID][iSignupID], g_RaceData[iRaceID][18]);
        PutPlayerInVehicle(playerid, g_RaceVehicles[iRaceID][iSignupID], 0);

        SetVehicleParamsEx(g_RaceVehicles[iRaceID][iSignupID], 0, 0, 0, 0, 0, 0, 0);

        // check to add nos
        if (g_RaceData[ iRaceID ][ 16 ] && !g_RaceData[ iRaceID ][ 36 ])
        {
            AddVehicleComponent(g_RaceVehicles[ iRaceID ][ iSignupID ], 1009);
        }

        // Show a msg regarding /flip
        if(CRace__GetType( iRaceID ) == RACE_TYPE_STUNT)
        {
            SendClientMessage(playerid, COLOR_YELLOW, "Hint: Use /flip to flip over your vehicle in this race.");
        }

        // Unfade the players screen
        TextDrawHideForPlayer(playerid, g_RaceLoadTextdraw);
        TextDrawHideForPlayer(playerid, Text:g_RaceData[iRaceID][29]);
    }
}

// CRace__IsRacing
// This function returns true or false based on the player's status in
// this race. Obviously specific things should be disabled or stuff when
// racing, like commands and some events should be forwarded.
CRace__IsRacing( playerid )
{
    if (!IsPlayerConnected( playerid ))
    {
        return 0;
    }

    if (g_RacePlayers[ playerid ][ 1 ] == 0 || g_RacePlayers[ playerid ][ 0 ] < RACE_STATE_COUNTDOWN)
    {
        return 0;
    }
    return 1;
}

// CRace__CreatePlayerTextDraw
// This function creates the text-draw bar which shows a player's rank and stuff.
// Quote a neat and good looking system really, usefull too. Too bed TDSS doesn't work.
CRace__CreatePlayerTextDraw( playerid, iRaceID )
{
    new szDisplay[MAX_RACE_NAME];
    new iPosition = CRace__GetPlayerPosition(playerid, iRaceID);

    format(szDisplay, sizeof( szDisplay ), "%d", iPosition);

    // First of all the giant "1", or w/e number it is depending on the players position

    if(g_RacePlayerDisplay[ playerid ][ 0 ] == Text:0)
    {
        g_RacePlayerDisplay[ playerid ][ 0 ] = TextDrawCreate(563, 364, szDisplay);
        TextDrawBackgroundColor(g_RacePlayerDisplay[ playerid ][ 0 ], 255);
        TextDrawFont(g_RacePlayerDisplay[ playerid ][ 0 ], 3);
        TextDrawLetterSize(g_RacePlayerDisplay[ playerid ][ 0 ], 0.820000, 5.400001);
        TextDrawColor(g_RacePlayerDisplay[ playerid ][ 0 ], -1);
        TextDrawSetOutline(g_RacePlayerDisplay[ playerid ][ 0 ], 0);
        TextDrawSetProportional(g_RacePlayerDisplay[ playerid ][ 0 ], 1);
        TextDrawSetShadow(g_RacePlayerDisplay[ playerid ][ 0 ], 1);

    }

    TextDrawShowForPlayer(playerid, g_RacePlayerDisplay[ playerid ][ 0 ]);


    if(g_RacePlayerDisplay[ playerid ][ 1 ] == Text:0)
    {
        // ordinal (i.e. st nd rd etc)
        ordinal( szDisplay, sizeof( szDisplay ), iPosition );

        g_RacePlayerDisplay[ playerid ][ 1 ] = TextDrawCreate(580.000000, 391.000000, szDisplay[ 1 ]);
        TextDrawBackgroundColor(g_RacePlayerDisplay[ playerid ][ 1 ], 255);
        TextDrawFont(g_RacePlayerDisplay[ playerid ][ 1 ], 1);
        TextDrawLetterSize(g_RacePlayerDisplay[ playerid ][ 1 ], 0.500000, 1.800000);
        TextDrawColor(g_RacePlayerDisplay[ playerid ][ 1 ], -1);
        TextDrawSetOutline(g_RacePlayerDisplay[ playerid ][ 1 ], 0);
        TextDrawSetProportional(g_RacePlayerDisplay[ playerid ][ 1 ], 1);
        TextDrawSetShadow(g_RacePlayerDisplay[ playerid ][ 1 ], 1);
    }

    TextDrawShowForPlayer(playerid, g_RacePlayerDisplay[ playerid ][ 1 ]);

    // Now the time - this used to be a gametext msg that would display how long in seconds
    // the nearest player is to the racer. we'll leave this blank for now as it only updates
    // when the player enters a checkpoint
    // Doesn't get used for drift races

    if(g_RacePlayerDisplay[ playerid ][ 2 ] == Text:0)
    {
        if(CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT)
        {
            g_RacePlayerDisplay[ playerid ][ 2 ] = TextDrawCreate(561.000000, 411.000000, "_"); // Make it blank for now
            TextDrawBackgroundColor(    g_RacePlayerDisplay[ playerid ][ 2 ], 255);
            TextDrawFont(   g_RacePlayerDisplay[ playerid ][ 2 ], 1);
            TextDrawLetterSize( g_RacePlayerDisplay[ playerid ][ 2 ], 0.200000, 0.899999);
            TextDrawColor(  g_RacePlayerDisplay[ playerid ][ 2 ], 16711935);
            TextDrawSetOutline( g_RacePlayerDisplay[ playerid ][ 2 ], 0);
            TextDrawSetProportional(    g_RacePlayerDisplay[ playerid ][ 2 ], 1);
            TextDrawSetShadow(  g_RacePlayerDisplay[ playerid ][ 2 ], 1);

            TextDrawShowForPlayer(playerid, g_RacePlayerDisplay[ playerid ][ 2 ]);
        }
    }

    // Now the race name display
    if(g_RacePlayerDisplay[ playerid ][ 3 ] == Text:0)
    {
        g_RacePlayerDisplay[ playerid ][ 3 ] = TextDrawCreate(37.000000, 291.000000, g_RaceNames[ iRaceID ]);
        TextDrawBackgroundColor(g_RacePlayerDisplay[ playerid ][ 3 ], 255);
        TextDrawFont(g_RacePlayerDisplay[ playerid ][ 3 ], 0);
        TextDrawLetterSize(g_RacePlayerDisplay[ playerid ][ 3 ], 0.460000, 1.800000);
        TextDrawColor(g_RacePlayerDisplay[ playerid ][ 3 ], -1);
        TextDrawSetOutline(g_RacePlayerDisplay[ playerid ][ 3 ], 0);
        TextDrawSetProportional(g_RacePlayerDisplay[ playerid ][ 3 ], 1);
        TextDrawSetShadow(g_RacePlayerDisplay[ playerid ][ 3 ], 1);
    }

    TextDrawShowForPlayer(playerid, g_RacePlayerDisplay[ playerid ][ 3 ]);

    if(g_RacePlayerDisplay[ playerid ][ 4 ] == Text:0)
    {
        // Number of checkpoints
        format(szDisplay, sizeof(szDisplay), "0/%d", g_RaceData[ iRaceID ][ 1 ] * g_RaceData[ iRaceID ][ 8 ]);

        g_RacePlayerDisplay[ playerid ][ 4 ] = TextDrawCreate(564.000000, 354.000000, szDisplay);
        TextDrawBackgroundColor(g_RacePlayerDisplay[ playerid ][ 4 ], 255);
        TextDrawFont(g_RacePlayerDisplay[ playerid ][ 4 ], 2);
        TextDrawLetterSize(g_RacePlayerDisplay[ playerid ][ 4 ], 0.320000, 1.300000);
        TextDrawColor(g_RacePlayerDisplay[ playerid ][ 4 ], -1);
        TextDrawSetOutline(g_RacePlayerDisplay[ playerid ][ 4 ], 1);
        TextDrawSetProportional(g_RacePlayerDisplay[ playerid ][ 4 ], 1);
    }

    TextDrawShowForPlayer(playerid, g_RacePlayerDisplay[ playerid ][ 4 ]);

    // Number of Laps
    if(g_RacePlayerDisplay[ playerid ][ 5 ] == Text:0)
    {
        format(szDisplay, sizeof(szDisplay), "LAP 1/%d", g_RaceData[ iRaceID ][ 8 ]);

        g_RacePlayerDisplay[ playerid ][ 5 ] = TextDrawCreate(40.000000, 309.000000, szDisplay);
        TextDrawBackgroundColor(g_RacePlayerDisplay[ playerid ][ 5 ], 255);
        TextDrawFont(g_RacePlayerDisplay[ playerid ][ 5 ], 2);
        TextDrawLetterSize(g_RacePlayerDisplay[ playerid ][ 5 ], 0.220000, 1.200000);
        TextDrawColor(g_RacePlayerDisplay[ playerid ][ 5 ], -1);
        TextDrawSetOutline(g_RacePlayerDisplay[ playerid ][ 5 ], 0);
        TextDrawSetProportional(g_RacePlayerDisplay[ playerid ][ 5 ], 1);
        TextDrawSetShadow(g_RacePlayerDisplay[ playerid ][ 5 ], 2);

    }

    TextDrawShowForPlayer(playerid, g_RacePlayerDisplay[ playerid ][ 5 ]);

    if(g_RacePlayerDisplay[ playerid ][ 6 ] == Text:0)
    {
        // If this is a drift race, this textdraw displays the time the player has to reach the next checkpoint
        if(CRace__GetType( iRaceID ) == RACE_TYPE_DRIFT)
        {
            g_RacePlayerDisplay[ playerid ][ 6 ] = TextDrawCreate(231.000000, 403.000000, "Time to reach Checkpoint: [loading]");
            TextDrawBackgroundColor(g_RacePlayerDisplay[ playerid ][ 6 ], 255);
            TextDrawFont(g_RacePlayerDisplay[ playerid ][ 6 ], 1);
            TextDrawLetterSize(g_RacePlayerDisplay[ playerid ][ 6 ], 0.340000, 1.400000);
            TextDrawColor(g_RacePlayerDisplay[ playerid ][ 6 ], -1);
            TextDrawSetOutline(g_RacePlayerDisplay[ playerid ][ 6 ], 0);
            TextDrawSetProportional(g_RacePlayerDisplay[ playerid ][ 6 ], 1);
            TextDrawSetShadow(g_RacePlayerDisplay[ playerid ][ 6 ], 1);

            TextDrawShowForPlayer(playerid, g_RacePlayerDisplay[ playerid ][ 6 ]);
        }
    }
}

// CRace__InitPosDisplay
// Initializes the position display textdraw which displays in the
// left hand pane.
CRace__InitPosDisplay( iRaceID )
{
    g_RacePosDisplay[ iRaceID ][ 0 ] = TextDrawCreate(496.000000, 230.000000, "      TOP 4");
    TextDrawBackgroundColor(g_RacePosDisplay[ iRaceID ][ 0 ], 255);
    TextDrawFont(g_RacePosDisplay[ iRaceID ][ 0 ], 2);
    TextDrawLetterSize(g_RacePosDisplay[ iRaceID ][ 0 ], 0.430000, 1.799999);
    TextDrawColor(g_RacePosDisplay[ iRaceID ][ 0 ], -1);
    TextDrawSetOutline(g_RacePosDisplay[ iRaceID ][ 0 ], 0);
    TextDrawSetProportional(g_RacePosDisplay[ iRaceID ][ 0 ], 1);
    TextDrawSetShadow(g_RacePosDisplay[ iRaceID ][ 0 ], 1);
    TextDrawUseBox(g_RacePosDisplay[ iRaceID ][ 0 ], 1);
    TextDrawBoxColor(g_RacePosDisplay[ iRaceID ][ 0 ], 255);
    TextDrawTextSize(g_RacePosDisplay[ iRaceID ][ 0 ], 623.000000, 0.000000);

//  g_RacePosDisplay[ iRaceID ][ 1 ] = TextDrawCreate(496.000000, 251.000000, "#1~g~ Jay~n~~w~#2~g~ eF.Pedro~n~~w~#3~g~ xBlueXFoxxSucksLol~n~~w~#4~g~ MacSto");
    g_RacePosDisplay[ iRaceID ][ 1 ] = TextDrawCreate(496.000000, 251.000000, "#1~g~ ...~n~~w~#2~g~ ...~n~~w~#3~g~ ...~n~~w~#4~g~ ...");
    TextDrawBackgroundColor(g_RacePosDisplay[ iRaceID ][ 1 ], 255);
    TextDrawFont(g_RacePosDisplay[ iRaceID ][ 1 ], 1);
    TextDrawLetterSize(g_RacePosDisplay[ iRaceID ][ 1 ], 0.219999, 1.000000);
    TextDrawColor(g_RacePosDisplay[ iRaceID ][ 1 ], -1);
    TextDrawSetOutline(g_RacePosDisplay[ iRaceID ][ 1 ], 0);
    TextDrawSetProportional(g_RacePosDisplay[ iRaceID ][ 1 ], 1);
    TextDrawSetShadow(g_RacePosDisplay[ iRaceID ][ 1 ], 1);
    TextDrawUseBox(g_RacePosDisplay[ iRaceID ][ 1 ], 1);
    TextDrawBoxColor(g_RacePosDisplay[ iRaceID ][ 1 ], 0x00000022);
    TextDrawTextSize(g_RacePosDisplay[ iRaceID ][ 1 ], 623.000000, 0.000000);


//  g_RacePosDisplay[ iRaceID ][ 2 ] = TextDrawCreate(596.000000, 251.000000, "4,321~n~4,101~n~3,451~n~212");
    g_RacePosDisplay[ iRaceID ][ 2 ] = TextDrawCreate(596.000000, 251.000000, "...~n~...~n~...~n~...");
    TextDrawBackgroundColor(g_RacePosDisplay[ iRaceID ][ 2 ], 255);
    TextDrawFont(g_RacePosDisplay[ iRaceID ][ 2 ], 1);
    TextDrawLetterSize(g_RacePosDisplay[ iRaceID ][ 2 ], 0.209999, 1.000000);
    TextDrawColor(g_RacePosDisplay[ iRaceID ][ 2 ], -65281);
    TextDrawSetOutline(g_RacePosDisplay[ iRaceID ][ 2 ], 0);
    TextDrawSetProportional(g_RacePosDisplay[ iRaceID ][ 2 ], 1);
    TextDrawSetShadow(g_RacePosDisplay[ iRaceID ][ 2 ], 1);
}


// CRace__UpdatePosDisplay
// Update the textdraw which displays each top 4 players position
CRace__UpdatePosDisplay( iRaceID )
{

    // Quick bit of error checking just to be safe :)
    if(CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT)
    {
        return;
    }

    if(CRace__GetStatus( iRaceID ) != RACE_STATE_RUNNING)
    {
        return;
    }

    new iRacePositionID [ MAX_SPAWNPOINTS + 1 ] = {Player::InvalidId, ...};    // Stores the ID of each player in each position.


    // Alright now store the position of each individual racer. It's only the first 4 we're interested in remember.
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

        if(g_RacePlayers[ i ][ 1 ] != iRaceID)
        {
            continue;
        }

        // Gotcha
        iRacePositionID[ CRace__GetPlayerPosition(i, iRaceID) ] = i;

        // We can take this opportunity to show the textdraw too
        TextDrawShowForPlayer(i, g_RacePosDisplay[ iRaceID ][ 0 ]);
        TextDrawShowForPlayer(i, g_RacePosDisplay[ iRaceID ][ 1 ]);
        TextDrawShowForPlayer(i, g_RacePosDisplay[ iRaceID ][ 2 ]);
    }

    // Now just update the textdraw with the names of the players in the first
    // 4 positions.

    new szPosDisplay[512];
    format(szPosDisplay, 512, "~w~#1~g~ %s~n~~w~#2~g~ %s~n~~w~#3~g~ %s~n~~w~#4~g~ %s~n~", PlayerName(iRacePositionID[1]), PlayerName(iRacePositionID[2]), PlayerName(iRacePositionID[3]), PlayerName(iRacePositionID[4]));

    TextDrawSetString(g_RacePosDisplay[ iRaceID ][ 1 ], szPosDisplay);

    new iScore[6];

    for(new i = 1; i < 5; i++)
    {
        if(!IsPlayerConnected(iRacePositionID[i]))
        {
            iScore[i] = 0;
        }
        else
        {
            iScore[i] = CDrift__GetPlayerScore(iRacePositionID[i]);
        }
    }

    format(szPosDisplay, 512, "%s~n~%s~n~%s~n~%s", formatPrice(iScore[1]), formatPrice(iScore[2]), formatPrice(iScore[3]), formatPrice(iScore[4]));
    TextDrawSetString(g_RacePosDisplay[ iRaceID ][ 2 ], szPosDisplay);
}

// CRace__DestroyPlayerTextDraw
// Destroys all associated player textdraws in a race, useful for
// when they leave
CRace__DestroyPlayerTextDraw( playerid )
{
    for(new i = 0; i < RACE_TEXT_DRAWS; i++)
    {
        if(g_RacePlayerDisplay[ playerid ][ i ] != Text:0)
        {
            TextDrawDestroy(g_RacePlayerDisplay[ playerid ][ i ]);
            g_RacePlayerDisplay[ playerid ][ i ] = Text:0;
        }
    }
}

// CRace__UpdatePlayerTextdraw
// This is the hard one. This updates all associated race textdraws for the player
// accordingly as the race progresses.
CRace__UpdatePlayerTextdraw( playerid, iRaceID )
{
    // Shouldn't be necessary but error checking does no harm
    if( iRaceID < 0 || iRaceID > MAX_RACES)
    {
        return;
    }

    new szDisplay[ 64 ];
    new iPosition = CRace__GetPlayerPosition(playerid, iRaceID);

    if(g_RacePlayerDisplay[ playerid ][ 0 ] != Text:0)
    {
        // Update the player position (the number part that is)
        format(szDisplay, sizeof( szDisplay ), "%d", iPosition);
        TextDrawSetString(g_RacePlayerDisplay[ playerid ][ 0 ], szDisplay);
    }

    if(g_RacePlayerDisplay[ playerid ][ 1 ] != Text:0)
    {
        // Now update the ordinal in accordance with the position
        ordinal(szDisplay, sizeof(szDisplay), iPosition);
        TextDrawSetString(g_RacePlayerDisplay[ playerid ][ 1 ], szDisplay[ 1 ]);
    }



    // This part shows a textdraw when a player enters a checkpoint indictating
    // the distance in seconds the next racer is behind the player. Only do this for races other than drift races, though
    if(g_RacePlayerDisplay[ playerid ][ 2 ] != Text:0)
    {

        if(CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT)
        {
            // Check if it is this player that is in first position;
            if (iPosition == 1)
            {
                g_RacePosition[ iRaceID ][ g_RacePlayers[ playerid ][ 3 ] ] = GetTickCount( );
                g_RaceData[ iRaceID ][ 15 ] = playerid;
            }

            else if (iPosition == 2)
            {
                new iDifference = GetTickCount( ) - g_RacePosition[ iRaceID ][ g_RacePlayers[ playerid ][ 3 ] ];
                new Float:fDifference = floatdiv( float( iDifference ), 1000.0 );

                format( szDisplay, sizeof( szDisplay ), "~r~+ %.2f", fDifference );
                TextDrawSetString( g_RacePlayerDisplay[ playerid ][ 2 ], szDisplay);


                if (g_RacePlayers[ g_RaceData[ iRaceID ][ 15 ] ][ 0 ] == RACE_STATE_RUNNING)
                {
                    format( szDisplay, sizeof( szDisplay ), "~g~- %.2f", fDifference );
                    TextDrawSetString( g_RacePlayerDisplay[ playerid ][ 2 ], szDisplay);
                }
            }
            else
            {
                new iDifference = GetTickCount( ) - g_RacePosition[ iRaceID ][ g_RacePlayers[ playerid ][ 3 ] ];
                new Float:fDifference = floatdiv( float( iDifference ), 1000.0 );
                format( szDisplay, sizeof( szDisplay ), "~r~+ %.2f", fDifference );
                TextDrawSetString( g_RacePlayerDisplay[ playerid ][ 2 ], szDisplay);
            }
        }
    }

    // Update the remaining time in which the player has to reach the checkpoint.
    if(CRace__GetType( iRaceID ) == RACE_TYPE_DRIFT)
    {
        if(g_RacePlayerDisplay[ playerid ] [ 6 ] != Text:0 && g_RacePlayers[ playerid ][ 2 ] > 0)
        {
            // If there are less than 10 seconds left on the clock, show the countdown in red.
            if(g_RacePlayers[ playerid ][ 2 ] < 10)
            {
                szDisplay = "~r~";
            }
            else
            {
                szDisplay = "~g~";
            }

            if(g_RaceData[ iRaceID ][ 34 ] == 0)
            {
                format( szDisplay, sizeof( szDisplay ), "Time to reach Checkpoint: %s%s", szDisplay, ConvertTime(g_RacePlayers[ playerid ][ 2 ]));
            }
            else
            {
                format( szDisplay, sizeof( szDisplay ), "~r~FLOOR IT!!~n~TIME TO FINISH RACE: %s", ConvertTime(g_RacePlayers[ playerid ][ 2 ]));
            }

            TextDrawSetString( g_RacePlayerDisplay[ playerid ][ 6 ], szDisplay);
        }
    }

    // Update the number of checkpoints the player has passed
    if(g_RacePlayerDisplay[ playerid ][ 4 ] != Text:0)
    {
        format(szDisplay, sizeof(szDisplay), "%d/%d", g_RacePlayers[ playerid ][ 3 ], g_RaceData[ iRaceID ][ 1 ] * g_RaceData[ iRaceID ][ 8 ]);
        TextDrawSetString(g_RacePlayerDisplay[ playerid ][ 4 ], szDisplay);
    }


    // Number of laps
    if(g_RacePlayerDisplay[ playerid ][ 5 ] != Text:0)
    {
        format(szDisplay, sizeof(szDisplay), "LAP %d/%d", g_RacePlayers[ playerid ][ 4 ], g_RaceData[ iRaceID ][ 8 ]);
        TextDrawSetString(g_RacePlayerDisplay[ playerid ][ 5 ], szDisplay);
    }
}



// CRace__OnStateChange
// This function gets triggered when the state of one person in a race stops.
// Technically exactly the same as the normal callback, but cooler.
CRace__OnStateChange( playerid, newstate, oldstate )
{
    #pragma unused oldstate
    new iRaceID = g_RacePlayers[ playerid ][ 1 ];

    // Only apply these checks if the race is running.
    if(g_RaceData[ iRaceID ][ 10 ] < RACE_STATE_RUNNING)
    {
        return 1;
    }

    if (newstate == PLAYER_STATE_ONFOOT)
    {
        if (g_RaceData[ iRaceID ][ 4 ] == 0)
        {
            CRace__EndForPlayer( playerid, ONFOOT );
            return 1;
        }
        else
        {
            new iVehicleID = g_RaceVehicles[ iRaceID ][ g_RacePlayers[ playerid ][ 5 ] ];
            if (GetVehicleModel( iVehicleID ) != -1)
            {
                new Float:fHealth; GetVehicleHealth( iVehicleID, fHealth );
                if (fHealth < 350.0)
                {
                    CRace__EndForPlayer( playerid, KILLED );
                    return 1;
                }
            }

            // If this is a drift race and they exit the vehicle, sorry but regardless of the settings
            // they must be removed from the race (because the race handler auto resets race drift data when
            // the player goes on foot and I CBA amending it)
            if(CRace__GetType( iRaceID ) == RACE_TYPE_DRIFT)
            {
                CRace__EndForPlayer( playerid, ONFOOT );
                return 1;
            }

            g_RacePlayers[ playerid ][ 6 ] = Time->currentTime();
            GameTextForPlayer( playerid, "You have 10 seconds to get back on your vehicle!", 3000, 3 );
            SendClientMessage(playerid,COLOR_RED,"* You have 10 seconds to get back into your vehicle.");
            return 1;
        }
    }
    else if (newstate == PLAYER_STATE_DRIVER)
    {
        g_RacePlayers[ playerid ][ 6 ] = 0;
        return 1;
    }
    else if (newstate == PLAYER_STATE_WASTED)
    {
        CRace__EndForPlayer( playerid, KILLED );
        return 1;
    }

    // Just return 0 here... bleh =p
    return 1;
}

// CRace__OnCheckpoint
// This function gets called as soon as one of the players in a particular race
// enters a new checkpoint. We have to update stuff when this is the case.
CRace__OnCheckpoint( playerid, iRaceID )
{
    // Increment the player's progress with one, and set the next checkpoint.
    g_RacePlayers[ playerid ][ 3 ] ++;

    new iCurrentLapPoint = g_RacePlayers[ playerid ][ 3 ];

    if (g_RacePlayers[ playerid ][ 4 ] > 1)
    {
        iCurrentLapPoint -= g_RaceData[ iRaceID ][ 1 ] * (g_RacePlayers[ playerid ][ 4 ] - 1);
    }

    if (iCurrentLapPoint == g_RaceData[ iRaceID ][ 1 ])
    {
        g_RacePlayers[ playerid ][ 4 ] ++; // Next lap!

        if (g_RacePlayers[ playerid ][ 4 ] > g_RaceData[ iRaceID ][ 8 ])
        {
            if(CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT)
            {
                g_RaceData[ iRaceID ][ 35 ]++;  // Player has finished the race \o/
                CRace__EndForPlayer( playerid, FINISH );
                return 1;
            }
            else
            {
                g_RaceData[ iRaceID ][ 35 ] ++; // Player has finished the race \o/
                GameTextForPlayer(playerid, "~g~FINISHED!", 3000, 6);
                CRace__EndForPlayer(playerid, FINISH);
                return 1;
            }
        }

        GameTextForPlayer(playerid, "~y~New Lap!", 2000, 6);
        g_RacePlayers[ playerid ][ 2 ] += 10;
    }

    CRace__CheckpointForPlayer( playerid );

    // Update the textdraw and we're done \o
    CRace__UpdatePlayerTextdraw( playerid, iRaceID );
    return 1;
}

// CRace__GetPlayerPosition
// Return the current position the player is in in this race.
CRace__GetPlayerPosition(playerid, iRaceID)
{
    new iPosition = 0;

    // If this is a drift race default the position to 1, since you can't be in 0th position!
    if(CRace__GetType( iRaceID ) == RACE_TYPE_DRIFT)
    {
        iPosition = 1;
    }

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if (!IsPlayerConnected( i ) || IsPlayerNPC ( i ))
        {
            continue;
        }

        if (g_RacePlayers[ i ][ 1 ] != iRaceID || g_RacePlayers[ i ][ 0 ] != RACE_STATE_RUNNING)
        {
            continue;
        }

        // Isn't a drift race - get the position based on how many checkpoints the player
        // has collected
        if(CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT)
        {
            if (g_RacePlayers[ i ][ 3 ] >= g_RacePlayers[ playerid ][ 3 ])
            {
                iPosition++;
            }
        }
        else
        {
            // Drift race. Calculate the position based on drift points
            if (CDrift__GetPlayerScore( i ) > CDrift__GetPlayerScore( playerid ))
            {
                iPosition++;
            }

        }
    }
    return iPosition;
}

// CRace__CheckpointForPlayer
// This fairly simple function gets called when the player needs to have
// an updated checkpoint. We think about all the variables and do the right thing.
CRace__CheckpointForPlayer( playerid )
{

    if (g_RacePlayers[ playerid ][ 0 ] != RACE_STATE_RUNNING)
    return 1;

    new iRaceID = g_RacePlayers[ playerid ][ 1 ];
    new iCheckpoint = g_RacePlayers[ playerid ][ 3 ], iType = 0;

    // Check if we're busy with another, new lap.
    if (iCheckpoint >= g_RaceData[ iRaceID ][ 1 ])
    {
        iCheckpoint -= g_RaceData[ iRaceID ][ 1 ] * (g_RacePlayers[ playerid ] [ 4 ] - 1);
    }

    // Get the location/position/whatever for the current checkpoint;

    new Float:fPosX = g_RaceCheckpoints[ iRaceID ][ iCheckpoint ][ 0 ];
    new Float:fPosY = g_RaceCheckpoints[ iRaceID ][ iCheckpoint ][ 1 ];
    new Float:fPosZ = g_RaceCheckpoints[ iRaceID ][ iCheckpoint ][ 2 ];
    new Float:fSize = g_RaceCheckpoints[ iRaceID ][ iCheckpoint ][ 3 ];

    // Incase we aren't near the finish, we want to include the next checkpoint too.
    new Float:fPosX2, Float:fPosY2, Float:fPosZ2;

    if ((g_RacePlayers[ playerid ][ 3 ]+1) != (g_RaceData[ iRaceID ][ 1 ] * g_RaceData[ iRaceID ][ 8 ])) {
        new iSecondPointID = ( g_RacePlayers[ playerid ][ 3 ] + 1 );
        if (iSecondPointID > g_RaceData[ iRaceID ][ 1 ])
        iSecondPointID -= g_RaceData[ iRaceID ][ 1 ] * (g_RacePlayers[ playerid ] [ 4 ] - 1);

        // Copy over our brand new and hawt information.
        fPosX2 = g_RaceCheckpoints[ iRaceID ][ iSecondPointID ][ 0 ];
        fPosY2 = g_RaceCheckpoints[ iRaceID ][ iSecondPointID ][ 1 ];
        fPosZ2 = g_RaceCheckpoints[ iRaceID ][ iSecondPointID ][ 2 ];
    }

    // Determain the kind of checkpoint which we need to use. If fPosX2 = 0 then
    // the next one is the finish line, however, we need that to be based on
    // the airbourne/groundlevel checkpoints too. Yay way too much options.


    if (g_RaceData[ iRaceID ][ 9 ] == 1)    // This is an air race, it's a air race checkpoint!
    {
         iType = 3;
    }

    if (g_RaceData[ iRaceID ][ 9 ] == 0)    // Normal race, set it to the checkpoint specified in CRace__SetCheckpointType
    {
        iType = g_RaceData[ iRaceID ][ 30 ];
    }
    // Last race checkpoint.
    if (fPosX2 == 0.0 && (g_RacePlayers[ playerid ][ 4 ] +1 ) >= g_RaceData[ iRaceID ][ 8 ])
    {
        if(g_RaceData[ iRaceID ][ 9 ] == 1)
        {
            // It's an air race, so the last air race checkpoint type is 4 as documented on the sa:mp wiki
            iType = 4;
        }
        else
        {
            // Otherwise it's a normal race, so the last checkpoint type is 1
            iType = 1;
        }
    }

    // Now we need to set the actual checkpoint for the player;
    DisablePlayerRaceCheckpoint( playerid );
    SetPlayerRaceCheckpoint( playerid, iType, fPosX, fPosY, fPosZ, fPosX2, fPosY2, fPosZ2, fSize );

    // And finally in case this is a drift race we may need to update the checkpoint time.
    CRace__CalcCheckpointTime( playerid, iRaceID, iCheckpoint );
    return 1;
}

// CRace__CalcCheckpointTime
// This is used for drift races to calculate the time in which the player has to reach the next checkpoint
CRace__CalcCheckpointTime( playerid, iRaceID, iCheckpointID )
{

    // First of all we'll make the maximum amount of seconds a player
    // can have on their clock peak at 40. If they have 40 seconds or more, do not
    // add any more time.
    if( g_RacePlayers[ playerid ][ 2 ] > 40)
    {
        return;
    }

    // Quick bit of error checking. Shouldn't be necessary but it does no harm cos
    // thats my style!

    if( CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT )
    {
        return;
    }

    // IIf the race is down to the last 30 seconds (or less, obviously) don't proceed here.
    if(g_RaceData[ iRaceID ][ 34 ] == 1)
    {
        return;
    }

    if( iCheckpointID < 0 || iCheckpointID > MAX_CHECKPOINTS )
    {
        return;
    }

    if( iRaceID < 0 || iRaceID > MAX_RACES )
    {
        return;
    }


    // Only add seconds on if the clock is less than 40 seconds.
    if(g_RacePlayers[ playerid ][ 2 ] > 40)
    {
        return;
    }

    // Still here yey. We'll base the time in which the player
    // has to reach the checkpoint on the distance between
    // the current checkpoint and the next one.
    new iNextCheckpointID = iCheckpointID + 1;
    new
        iDistance,
        iTime;

    if( iNextCheckpointID >= MAX_CHECKPOINTS )
    {
        return;
    }

    new
        Float:fPosX,
        Float:fPosY;
      //  Float:fPosZ;
    new
        Float:fPosNX,
        Float:fPosNY;
//      Float:fPosNZ;   // The N stands for next, so its the position of the next checkpoint.

    fPosX = g_RaceCheckpoints[ iRaceID ][ iCheckpointID ][ 0 ];
    fPosY = g_RaceCheckpoints[ iRaceID ][ iCheckpointID ][ 1 ];
//  fPosZ = g_RaceCheckpoints[ iRaceID ][ iCheckpointID ][ 2 ];

    fPosNX = g_RaceCheckpoints[ iRaceID ][ iNextCheckpointID ][ 0 ];
    fPosNY = g_RaceCheckpoints[ iRaceID ][ iNextCheckpointID ][ 1 ];
//  fPosNZ = g_RaceCheckpoints[ iRaceID ][ iNextCheckpointID ][ 2 ];

    iDistance = floatround( floatsqroot( ( ( fPosX - fPosNX ) * ( fPosX - fPosNX ) ) + ( ( fPosY - fPosNY ) * ( fPosY - fPosNY ) ) ) );
    iTime = floatround( (iDistance / 50) * 3.6 );

    // Meh, 30 seconds between checkpoints is way enough, if not too much.
    if(iTime > 30)
    {
        iTime = 30;
    }

    if(iTime < 0)
    {
        iTime = 0;
    }

    g_RacePlayers[ playerid ][ 2 ] += iTime;
}

// CRace__ResetPlayerData
// Reset all relevant information in relation to the players race data.
CRace__ResetPlayerData(playerid, iRaceID, iReason)
{
    new iSignupID = g_RacePlayers[ playerid ][ 5 ];

    if (PlayerState(playerid)->currentState() == RacingPlayerState)
        PlayerState(playerid)->releaseState();

    // Reset the player status either way, specific tasks happen later on;
    g_RacePlayers[ playerid ][ 0 ] = RACE_STATE_NONE;

    // Hide the "loading race" textdraws
    TextDrawHideForPlayer(playerid, g_RaceLoadTextdraw);
    TextDrawHideForPlayer(playerid, Text:g_RaceData[iRaceID][29]);

/*  // Hide the LVP RADIO textdraw
    for(new i = 0; i < sizeof( g_RaceRadio ); i++)
    {
        TextDrawHideForPlayer(playerid, g_RaceRadio[ i ]);
    }*/

    // Hide the pos textdraw
    TextDrawHideForPlayer(playerid, g_RacePosDisplay[ iRaceID ][ 0 ]);
    TextDrawHideForPlayer(playerid, g_RacePosDisplay[ iRaceID ][ 1 ]);
    TextDrawHideForPlayer(playerid, g_RacePosDisplay[ iRaceID ][ 2 ]);

    // Destroy all player associated textdraws and disable drifting
    CRace__DestroyPlayerTextDraw( playerid );
    CDrift__DisableForPlayer( playerid );

    // Reset object preloaded data
    CRace__ResetPreloadData(playerid, iRaceID);

    // Decrease the amount of players taking part in this race so we can update the textdraw
    g_RaceData[ iRaceID ][ 21 ] --;

    // Check to end the race

    if(iReason != FINISH)
    {
        CRace__CheckRaceEnd( iRaceID, playerid );
    }

    // Respawn the vehicle for this race;

    if(iReason != SIGNOUT)
    {
        if(IsPlayerInAnyVehicle(playerid))
        {
            // Hey guess what, the player has left here, and was in a vehicle
            // ofcourse, its not a signout, so we can destroy it!
            new iVehicle = GetPlayerVehicleID(playerid);
            RemovePlayerFromVehicle(playerid);
            SetVehicleToRespawn(iVehicle);
            SetPlayerPos(playerid,0,0,0);
            VehicleManager->destroyVehicle(iVehicle);
        }
    }


    if(iReason != SIGNOUT)
    {
        TogglePlayerControllable(playerid, 1);
    }

    if ( iReason != DISCONNECT && iReason != SIGNOUT )
    {
        // Get the player out of the vehicle, and spawn him/her at the previous
        // position in the previous interior in the previous virtual world.
        RemovePlayerFromVehicle(playerid);
        SetPlayerPos( playerid, g_RacePlayerPos[ playerid ][ 0 ],
        g_RacePlayerPos[ playerid ][ 1 ], g_RacePlayerPos[ playerid ][ 2 ] );
        SetPlayerVirtualWorld( playerid, floatround( g_RacePlayerPos[ playerid ][ 3 ] ) );
        SetPlayerInterior( playerid, floatround( g_RacePlayerPos[ playerid ][ 4 ] ) );

        // We need to hide the race checkpoint for the player.
        DisablePlayerRaceCheckpoint( playerid );

        // Restore the current world weather/time data;
        SetPlayerWeather( playerid, g_iSavedWeatherID );

        TimeController->releasePlayerOverrideTime(playerid);
    }

    // Reset all the data which contains the players race information
    for (new i = 1; i < 8; i++)
    {
        g_RacePlayers[ playerid ][ i ] = 0;
    }

    if (iReason == SIGNOUT)
    {
        GivePlayerMoney( playerid, RACE_PRICE );
        g_RaceData[ iRaceID ][ 13 ]--;

        if( g_RaceData[ iRaceID ][ 12 ] == playerid )
        {
            // Now the leader is the signed out player, lets change it to someone else.
            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if( g_RacePlayers[ i ][ 1 ] == iRaceID && g_RacePlayers[ i ][ 0 ] > RACE_STATE_IDLE && i != playerid)
                {
                    // Okay, so the player is in at least signup and is linked to the race
                    // So, we shall make them the new leader! :>
                    g_RaceData[ iRaceID ][ 12 ] = i;
                    break; // <-- no need to continue looping
                }
            }
        }
    }

    if (iReason != SIGNOUT)
    {
        LoadPlayerGuns(playerid);
    }

    // Check the amount of players left in this race;
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if (CRace__IsRacing( i ))
        {
            new iPlayerRace = g_RacePlayers[ i ][ 1 ];
            if (iPlayerRace == iRaceID)
            {
                return 1;
            }
        }
        if( g_RacePlayers[ i ][ 1 ] == iRaceID && g_RacePlayers[ i ][ 0 ] > RACE_STATE_IDLE && i != playerid )
        {
            // The race isn't going, but there's someone in signup...
            return 1;
        }
    }


    // Since we're still here, stop the race;
    g_RaceData[ iRaceID ][ 10 ] = RACE_STATE_IDLE;
    g_RaceData[ iRaceID ][ 11 ] = 0;
    g_RaceData[ iRaceID ][ 14 ] = 0;
    g_RaceData[ iRaceID ][ 28 ] = 0;

    CRace__UnloadObjects(iRaceID);

    for (new i = 0; i < MAX_SPAWNPOINTS; i++)
    {
        g_RaceResults [iRaceID] [i] = -1;
        g_RaceTimes [iRaceID] [i] = -1;
    }


    if( iReason != SIGNOUT )
    {   // No cars are used if they only signed out

        if(GetVehicleModel(g_RaceVehicles[ iRaceID ][ iSignupID ]) != 0)
        {
            VehicleManager->destroyVehicle(g_RaceVehicles[iRaceID][iSignupID]);
        }
    }
    return 1;
}

// CRace__EndForPlayer
// This function gets called as soon as the race is over for a specific
// player, regardless of the reason (which is specified in iReason!)
CRace__EndForPlayer( playerid, iReason )
{
    if(!CRace__IsRacing(playerid) && g_RacePlayers[playerid][0] != RACE_STATE_SIGNUP)
    {
        return 0;
    }

    TimeController->releasePlayerOverrideTime(playerid);

    CRace__DestroyPlayerTextDraw( playerid );
    CDrift__DisableForPlayer( playerid );

    DisablePlayerRaceCheckpoint( playerid );

    new iRaceID = g_RacePlayers[ playerid ][ 1 ];
    new szMessage[ 256 ], szName[ 24 ], szDriveTime[16], szRank[10];


    // Get some random information about the player's score;
    new iPlayerRank = ( g_RaceData[ iRaceID ][ 13 ] - g_RaceData[ iRaceID ][ 20 ] );
    new iStartTime = g_RacePlayers[ playerid ][ 7 ];


    new iPlayerFinishPosition = g_RaceData[ iRaceID ][ 19 ] + 1;

    new iDriveTime = GetTickCount() - iStartTime;

    ordinal( szRank, sizeof( szRank ), iPlayerFinishPosition );
    GetPlayerName( playerid, szName, 24 );

    // If their time is ridiculously high, then they're probably in the countdown
    // stage. Either way, lets just reset it.
    if( g_RaceData[ iRaceID ][ 10 ] == RACE_STATE_COUNTDOWN || iDriveTime > 3600000) iDriveTime = 0;
    CRace__FormatTime( szDriveTime, sizeof( szDriveTime ), iDriveTime );

    if (iReason == FINISH)
    {
        g_RaceData[ iRaceID ][ 19 ]++;
        WonMinigame[ playerid ]++;

        if (iPlayerFinishPosition <= 3)
        {
            new iPriceMoney = (RACE_PRICE * ( g_RaceData[ iRaceID ][ 13 ] + 1 - iPlayerFinishPosition ) * 100 );
            format( szMessage, sizeof( szMessage ), "You've won $%d by being in the top-3 of this race!", iPriceMoney );
            SendClientMessage( playerid, COLOR_GREEN, szMessage );
            GivePlayerMoney( playerid, iPriceMoney );
        }


        g_RaceResults [iRaceID] [iPlayerFinishPosition] = Account(playerid)->userId();
        g_RaceTimes [iRaceID] [iPlayerFinishPosition] = iDriveTime;
    }

    else if (iReason == TOOSLOW)
    {
        format( szMessage, sizeof( szMessage ), "You were removed from the %s, because you were way too slow!", g_RaceNames[ iRaceID ] );
        ShowBoxForPlayer(playerid, szMessage);

        format( szMessage, sizeof( szMessage ), "You were ranked %s, after racing for %s!", szRank, szDriveTime );
        ShowBoxForPlayer(playerid, szMessage);
    }


    // Increment the amount of players that have finished so far.
    g_RaceData[ iRaceID ][ 17 ]++;

    // Now we need to distribute a message to all other players;
    if( iReason == FINISH )
    {
        if ( iPlayerFinishPosition == 1 )
        {
            format( szMessage, sizeof( szMessage ), "You won the ~p~%s~w~ in a time of ~g~%s~w~!", g_RaceNames[ iRaceID ], szDriveTime );
        }
        else
        {
            format( szMessage, sizeof( szMessage ), "You finished %s in the ~p~%s~w~, with a time of ~g~%s~w~.", szRank, g_RaceNames[ iRaceID ], szDriveTime );
        }
    }

    else
    {
        ordinal( szRank, sizeof( szRank ), iPlayerRank );
        format( szMessage, sizeof( szMessage ), "You have dropped out of the ~p~%s~w~ in ~g~%s place~w~, after racing for ~g~%s~w~.", g_RaceNames[ iRaceID ], szRank, szDriveTime );
        g_RaceData[ iRaceID ][ 20 ]++;
    }



    // szMessage is still the 'You have signed out', so no need to send around
    if( iReason != SIGNOUT)
    {
        ShowBoxForPlayer(playerid, szMessage);
    }

    if(iReason != FINISH)
    {
        CRace__ResetPlayerData(playerid, iRaceID, iReason);
        return 1;
    }

    if(CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT)
    {
        CRace__ResetPlayerData(playerid, iRaceID, iReason);
        return 1;
    }

    // Okay we're still here. The player has finished a drift race \o/

    new szEndMsg[128];

    if(CRace__CheckRaceEnd( iRaceID, playerid ))
    {
        ordinal( szEndMsg, 128, CRace__GetPlayerPosition(playerid, iRaceID));
        format(szEndMsg, 128, "You finished %s!", szEndMsg);
        GameTextForPlayer(playerid, szEndMsg, 5000, 5);

        strins(szEndMsg, "* ", 0);
        SendClientMessage(playerid, COLOR_WHITE, szEndMsg);

        CRace__ResetPlayerData(playerid, iRaceID, iReason);
        return 1;
    }

    // Nope, they haven't since we're still here
    SetVehicleParamsEx(GetPlayerVehicleID(playerid), 0, 0, 0, 0, 0, 0, 0);
    SendClientMessage(playerid, COLOR_YELLOW, "* Waiting for other players to finish. Type /leave to leave this race now");

    ShowBoxForPlayer(playerid, "Waiting for other players to finish race. Use /leave to leave the race now.");

    // Set the countdown timer to -7 and add an exception for this value in the countdown later so
    // we know the player is finished.
    g_RacePlayers[ playerid ][ 2 ] = -7;

    // Right, if this is the first player to cross the finish line,
    // we display a message to other racers to floor it and give them 30 seconds to finish.
    if(g_RaceData[ iRaceID ][ 34 ] != 1)
    {
        g_RaceData[ iRaceID ][ 34 ] = 1;

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

            if(i == playerid)
            {
                continue;
            }

            if(g_RacePlayers[ i ][ 1 ] != iRaceID)
            {
                continue;
            }

            ShowBoxForPlayer(i, "FLOOR IT! ~r~You have 30 seconds to finish the race!");
            g_RacePlayers[ i ][ 2 ] = 30;
        }
    }
    return 1;
}

// CRace__CheckRaceEnd
// Checks to see if we need to end a drift race or not
// The playerid parameter is the player who finished the race line when
// we check for the race end and is exempt from the loop.
CRace__CheckRaceEnd( iRaceID, playerid )
{

    // Quick bit of error checking. Shouldn't be necessary but meh
    if(iRaceID < 0 || iRaceID > MAX_RACES)
    {
        return 0;
    }

    if(CRace__GetStatus( iRaceID ) != RACE_STATE_RUNNING)
    {
        return 0;
    }

    if(CRace__GetType( iRaceID ) != RACE_TYPE_DRIFT)
    {
        return 0;
    }

    // Check if all the players have finished. If so remove em!
    if(g_RaceData[ iRaceID ][ 35 ] == g_RaceData[ iRaceID ][ 21 ])
    {
        new szEndMsg[ 128 ];
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

            if(g_RacePlayers[ i ][ 1 ] != iRaceID)
            {
                continue;
            }

            if(i == playerid)
            {
                continue;
            }

            ordinal( szEndMsg, 128, CRace__GetPlayerPosition(i, iRaceID));

            format(szEndMsg, 128, "You finished %s!", szEndMsg);
            GameTextForPlayer(i, szEndMsg, 5000, 5);

            strins(szEndMsg, "* ", 0);
            SendClientMessage(i, COLOR_WHITE, szEndMsg);

            CRace__ResetPlayerData(i, iRaceID, FINISH);
        }

        return 1;
    }
    // still here, we don't need to end the race!
    return 0;
}

// Run every minute to make sure unused race variables are emptied.
CRace__OpenRaces() {
    new races[MAX_RACES];

    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
            continue;

        // Check if the player is currently having a raceId assigned. If so, mark the race as busy (1).
        if (g_RacePlayers[playerId][1] != 0)
            races[g_RacePlayers[playerId][1]] = 1;
    }

    // For each race, empty various variables in the race isn't busy at the moment.
    for (new raceId = 1; raceId < MAX_RACES; raceId++) {
        if (races[raceId] != 0)
            continue;

        for (new spawnPoint = 0; spawnPoint < MAX_SPAWNPOINTS; spawnPoint++) {
            new vehicleId = g_RaceVehicles[raceId][spawnPoint];
            if (vehicleId != 0) {
                VehicleManager->destroyVehicle(vehicleId);
                DestroyVehiclePrivate(vehicleId);
                g_RaceVehicles[raceId][spawnPoint] = 0;
            }
        }

        g_RaceData[raceId][10] = RACE_STATE_IDLE;
        g_RaceData[raceId][11] = 0;
        g_RaceData[raceId][12] = 0;
        g_RaceData[raceId][13] = 0;
        g_RaceData[raceId][14] = 0;
        g_RaceData[raceId][21] = 0;
        g_RaceData[raceId][28] = 0;
        CRace__UnloadObjects(raceId);

        if (MinigameTypeInfo[Players] == 0) {
            MinigameTypeInfo[Progress] = 0;
            MinigameTypeInfo[CurrentMinigame] = STATUS_NONE;
        }
    }
}

// CRace__FormatTime
// Formats the race time for a player: minutes:seconds.xx
CRace__FormatTime( str[], iLen, iTime )
{
    if (iTime >= 60000) format( str, iLen, "%d:%02d.%02d", iTime / 60000, ((iTime + 5) % 60000) / 1000, ((iTime + 5) / 10) % 100 ); // woo rounding
    else format( str, iLen, "%d.%02d", ((iTime + 5) % 60000) / 1000, ((iTime + 5) / 10) % 100 );
    return 1;
}

// CRace__SetType
// This function sets the type of raxce, such as a circruit race, knockout, drift, etc
CRace__SetType( iRaceID, iType )
{
    g_RaceData[ iRaceID ][ 31 ] = iType;
}

// CRace__GetType
// This function gets the type of race as specified in CRace__SetType
CRace__GetType( iRaceID )
{
    return g_RaceData[ iRaceID ][ 31 ];
}

// CRace__SetName
// This function sets the name of a specific race into our local arrays,
// enabling us to do cool stuff with it. Mostly used for messages.
CRace__SetName( iRaceID, szName[] )
{
    // Just use format to copy the name over;
    format( g_RaceNames[ iRaceID ], 64, "%s", szName );
}

// CRace__SetMaxTime
// This value indicates the maximum amount of time someone is allowed to
// take in order to finish the race. After that he/she'll be too slow.
CRace__SetMaxTime( iRaceID, iTime )
{
    // Copy the value over to our g_RaceData array;
    g_RaceData[ iRaceID ][ 3 ] = iTime;
}

// CRace__SetLaps
// A new cool feature is that we can set the number of laps for a
// specific race, being normally 1, but it can be set to 20 if wanted.
CRace__SetLaps( iRaceID, iLaps )
{
    // Don't you just love the g_RaceData array?
    g_RaceData[ iRaceID ][ 8 ] = iLaps;
}

// CRace__SetAirRace
// This function toggles the kind of race it is. If it's 0, then it's
// a normal ground race. Otherwise it'll be defined as an airborne race.
CRace__SetAirRace( iRaceID, iAirBourne )
{
    // And another key to go into our monsterous array.
    g_RaceData[ iRaceID ][ 9 ] = iAirBourne;
}

// CRace__MayDrop
// This function is used to indicate whether players are free to fall
// off their vehicles while busy in the race. And get back on, offcourse.
CRace__MayDrop( iRaceID, bAllowed )
{
    // Copy the value over to our g_RaceData array;
    g_RaceData[ iRaceID ][ 4 ] = bAllowed;
}

// CRace__SetVehicle
// Also something usefull would be to know which vehicle should be
// used for this particular race. Should be between 600 and 611.
CRace__SetVehicle( iRaceID, iVehicle )
{
    // Copy the value over to our g_RaceData array;
    g_RaceData[ iRaceID ][ 2 ] = iVehicle;
}

// CRace__SetInterior
// Copy the interior over to our array, so the vheicles and players can
// spawn in the proper interior they need to spawn in for this race.
CRace__SetInterior( iRaceID, iInterior )
{
    // The interior should be copied to our data.
    g_RaceData[ iRaceID ][ 18 ] = iInterior;
}

// CRace__SetWeather
// Offcourse a race can take place in a specific kind of weather,
// e.g. in rain of in the hot sunshine of Los Santos. Define it!
CRace__SetWeather( iRaceID, iWeather )
{
    // Copy the value over to our g_RaceData array;
    g_RaceData[ iRaceID ][ 5 ] = iWeather;
}

// CRace__GetPlayerStatus
// This function returns the status of a specific player in this race.
CRace__GetPlayerStatus( playerid ) { return g_RacePlayers[ playerid ][ 0 ]; }

// CRace__SetTime
// Obviously, we're able to change the time in San Andreas, therefore
// it would be cool to also change the time in the races.
CRace__SetTime( iRaceID, iHour, iMinute )
{
    // Copy the value over to our g_RaceData array;
    g_RaceData[ iRaceID ][ 6 ] = iHour;
    g_RaceData[ iRaceID ][ 7 ] = iMinute;
}

// CRace__SetNOS
// This function toggles whether we want NOS on our race vehicles, or not.
// All given NOS things are two-slot nitro's, more shouldn't be needed.
CRace__SetNOS( iRaceID, bEnabled )
{
    // Just put the NOS value in our array;
    g_RaceData[ iRaceID ][ 16 ] = bEnabled;
}

// CRace__GetState
// This function simply returns the state of a race;
CRace__GetStatus( iRaceID ) { return g_RaceData[ iRaceID ][ 10 ]; }

// CRace__AddSpawn
// This function is in place to add a new spawn-position to a race.
// It's fairly simple actually, it just copies the position to the
// first empty, available spawn-postiion slot in our array.
CRace__AddSpawn( iRaceID, Float:fPosX, Float:fPosY, Float:fPosZ, Float:fAngle, nColor1, nColor2 )
{
    new iSpawnID = g_RaceData[ iRaceID ][ 0 ];
    g_RaceSpawnPositions[ iRaceID ][ iSpawnID ][ 0 ] = fPosX;
    g_RaceSpawnPositions[ iRaceID ][ iSpawnID ][ 1 ] = fPosY;
    g_RaceSpawnPositions[ iRaceID ][ iSpawnID ][ 2 ] = fPosZ;
    g_RaceSpawnPositions[ iRaceID ][ iSpawnID ][ 3 ] = fAngle;

    g_RaceSpawnPositions[ iRaceID ][ iSpawnID ][ 4 ] = float( nColor1 );
    g_RaceSpawnPositions[ iRaceID ][ iSpawnID ][ 5 ] = float( nColor2 );

    // Increment the player count by one, and we're done
    g_RaceData[ iRaceID ][0]++;
}


// CRace__AddObject
// This function is used to create a race which is customley made
// using objects.
CRace__AddObject( iRaceID, iObjectModel, Float:fPosX, Float:fPosY, Float:fPosZ, Float:fRx, Float:fRy, Float:fRz)
{
    // Alright quick bit of error checking first.
    // Shouldn't be necessary though

    if(iRaceID < 0 || iRaceID > MAX_RACES)
    {
        printf("[Race] Error: Unable to create object for race %d at position: %f, %f, %f: Race limits breached (Invalid iRaceID: %d. MAX_RACES = %d)", iRaceID, fPosX, fPosY, fPosZ, iRaceID, MAX_RACES);
        return;
    }

    new iObjectID = CRace__GetObjectCount(iRaceID);

    if(iObjectID >= MAX_RACE_OBJECTS)
    {
        printf("[Race] Error: Unable to create object for race %d at position: %f, %f, %f: Object limits breached (Number of objects in race: %d Maximum number of objects: %d)", iRaceID, fPosX, fPosY, fPosZ, CRace__GetObjectCount(iRaceID), MAX_RACE_OBJECTS);
        return;
    }

    // Alright format the data into our enum so we can load it later
    g_RaceObject[ iRaceID ][ iObjectID ][ g_RaceObjectPos ][ 0 ] = fPosX;
    g_RaceObject[ iRaceID ][ iObjectID ][ g_RaceObjectPos ][ 1 ] = fPosY;
    g_RaceObject[ iRaceID ][ iObjectID ][ g_RaceObjectPos ][ 2 ] = fPosZ;
    g_RaceObject[ iRaceID ][ iObjectID ][ g_RaceObjectPos ][ 3 ] = fRx;
    g_RaceObject[ iRaceID ][ iObjectID ][ g_RaceObjectPos ][ 4 ] = fRy;
    g_RaceObject[ iRaceID ][ iObjectID ][ g_RaceObjectPos ][ 5 ] = fRz;

    g_RaceObject[ iRaceID ][ iObjectID ][ RaceObjectModel ] = iObjectModel;

    // Increase the number of objects created for this race 
    g_RaceData[ iRaceID ][ 23 ]++;
}

// CRace__SetObjectDrawDistance
// Sets the object draw distance for the specified race (optional)
CRace__SetObjectDrawDistance(iRaceID, Float:fDrawDistance)
{
    g_RaceData[ iRaceID][ 27 ] = floatround(fDrawDistance);
}

// CRace__LoadObjects
// This function is called when the race starts and creates all the dynamic or static objects
// associated with the particular race ID.
CRace__LoadObjects(iRaceID)
{
    // Does this race contain any objects?
    if(!CRace__GetObjectCount(iRaceID))
    {
        printf("[Race] CRace__LoadObjects: No objects found in race %d.", iRaceID);
        return;
    }

    new iObjectWorld = 200 + iRaceID;
    new iObjectInteriorID = g_RaceData[ iRaceID ][ 18 ];
    new Float:iRaceObjectDrawDistance;

    if(g_RaceData[ iRaceID][ 27 ] == 0)
    {
        iRaceObjectDrawDistance = DEFAULT_RACE_OBJECT_DRAW_DISTANCE;
    }
    else
    {
        iRaceObjectDrawDistance = g_RaceData[ iRaceID][ 27 ];
    }

    // Alright just loop through and create the actual object
    for(new i = 0; i < CRace__GetObjectCount(iRaceID); i++)
    {
        // Just check to destroy any objects which shouldn't be here first
        if(g_RaceObject[iRaceID][i][g_RaceObjectID] != 0 && g_RaceObject[iRaceID][i][g_RaceObjectID] != INVALID_OBJECT_ID)
        {
            if(g_RaceData[ iRaceID ][ 32 ] == 0)
            {
                DestroyDynamicObject(DynamicObject: g_RaceObject[iRaceID][i][g_RaceObjectID]);
            }
            else
            {
                DestroyObject(g_RaceObject[iRaceID][i][g_RaceObjectID]);
            }
        }
        // Should these be dynamic objects?
        if(g_RaceData[ iRaceID ][ 32 ] == 0)
        {
            // Alright now just create the physical object and we're done here.
            g_RaceObject[iRaceID][i][g_RaceObjectID] =
            _: CreateDynamicObject(g_RaceObject[iRaceID][i][RaceObjectModel],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][0],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][1],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][2],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][3],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][4],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][5], iObjectWorld, iObjectInteriorID, -1, iRaceObjectDrawDistance);

                // we'll increase the visible draw distance of the object to match that of
                // the physical object draw distance to so it stands out nicely!
                Streamer_SetFloatData(STREAMER_TYPE_OBJECT, g_RaceObject[iRaceID][i][g_RaceObjectID], E_STREAMER_DRAW_DISTANCE, iRaceObjectDrawDistance);


        }
        else    // Static objects
        {
            g_RaceObject[iRaceID][i][g_RaceObjectID] =
            CreateObject(g_RaceObject[iRaceID][i][RaceObjectModel],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][0],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][1],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][2],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][3],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][4],
                g_RaceObject[iRaceID][i][g_RaceObjectPos][5], iRaceObjectDrawDistance);
        }
    }
}


// CRace__UnloadObjects
// Called from when the race ends to destroy the race map and all associated objects
CRace__UnloadObjects(iRaceID)
{
    // Quick bit of unecessary error checking. Yeah!
    if(iRaceID < 0 || iRaceID > MAX_RACES)
    {
        printf("[Race] Error unloading objects for race ID: %d (Invalid race ID)", iRaceID);
        return;
    }

    // Does this race contain any objects?
    if(!CRace__GetObjectCount(iRaceID))
    {
        return;
    }


    // Now just delete the objects. This obviously is much easier
    // than creating them. wee
    for(new i = 0; i < CRace__GetObjectCount(iRaceID); i++)
    {
        if(g_RaceData[iRaceID][32] == 0)
        {
            if(IsValidDynamicObject(DynamicObject: g_RaceObject[iRaceID][i][g_RaceObjectID]))
            {
                DestroyDynamicObject(DynamicObject: g_RaceObject[iRaceID][i][g_RaceObjectID]);
                g_RaceObject[iRaceID][i][g_RaceObjectID] = INVALID_OBJECT_ID;
            }
        }
        else
        {
            if(IsValidObject(g_RaceObject[iRaceID][i][g_RaceObjectID]))
            {
                DestroyObject(g_RaceObject[iRaceID][i][g_RaceObjectID]);
                g_RaceObject[iRaceID][i][g_RaceObjectID] = INVALID_OBJECT_ID;
            }
        }
    }
}

DetermineNumberOfModelsForRace(raceId) {
    new objectCount = g_RaceData[raceId][23],
        modelCount = 0;

    if (objectCount == 0)
        return 0;

    // This implementation used to copy all of the race's objects to another array, apply quick sort
    // and then iterate over the array to produce a final count. While this, from a computer science
    // point of view, is a valid solution, Pawn is rather slow and applying quick sort on 700 items
    // for each race that has objects ended up costing ~8% of our gamemode startup performance.
    //
    // Instead, we go for a solution that's theoretically slower, but in reality will be *a lot*
    // faster. Store all of the models in an array, and iterate over that array for each new model
    // we see. This ends up being four orders of magnitude lower in regards to comparison count.

    new seenModels[MAX_RACE_OBJECT_MODELS];
    for (new objectId = 1; objectId < objectCount; ++objectId) {
        new modelId = g_RaceObject[raceId][objectId][RaceObjectModel],
            bool: seen = false;

        for (new modelIndex = 0; modelIndex < modelCount; ++modelIndex) {
            if (seenModels[modelIndex] != modelId)
                continue;

            seen = true;
            break;
        }

        if (seen)
            continue;

        seenModels[modelCount++] = modelId;
        if (modelCount >= MAX_RACE_OBJECT_MODELS) {
            printf("[Race] Error: Race %d exceeds the object model limit (%d) by registering more models.", raceId, MAX_RACE_OBJECT_MODELS);
            return modelCount;
        }
    }

    return modelCount;
}

// CRace__PreloadObjectsForPlayer
// Preload all unique race object models for player
// to fix SA:MP texture bugs
CRace__PreloadObjectsForPlayer(playerid, iRaceID, Float:fPosX, Float:fPosY, Float:fPosZ, iPhase)
{
    // Usual error checking business
    if(iRaceID < 0 || iRaceID > MAX_RACES)
    {
        printf("[Race] Error preloading objects for player %d, in race %d: Invalid race ID (MAX_RACES: %d)", playerid, iRaceID, MAX_RACES);
        return;
    }

    // Again, make sure this player is taking part in the specified race id.
    if(g_RacePlayers[ playerid ][ 1 ] != iRaceID)
    {
        printf("[Race] Error preloading objects for player %d: Not in race.", playerid);
        return;
    }
    // Does this race have any objects associated with it?
    if(CRace__GetObjectModelCount(iRaceID) < 1)
    {
        printf("[Race] Error preloading objects for player %d in race %d: No object models found.", playerid, iRaceID);
        return;
    }

    // Just update the streamer so that the objects are loaded by the time the player has teleported.
    Streamer_UpdateEx(playerid, fPosX, fPosY, fPosZ);

    new
        iWorldID = GetPlayerVirtualWorld(playerid),
        iInteriorID = GetPlayerInterior(playerid);

    #if BETA_TEST == 1
        new szMsg[128];
    #endif

    // Ok, loop through all the object models used in this race
    // depending on the phase. We do this in halves because of a SA:MP
    // crashing bug when too many 0.3c objects are loaded
    new iModelCount = CRace__GetObjectModelCount(iRaceID);
    new iCurrentModelCount = floatround(iModelCount / 2);

    #if BETA_TEST == 1
        format(szMsg, 128, "iModelCount: %d. iCurrentModelCount: %d - #2168", iModelCount, iCurrentModelCount);
        SendClientMessage(playerid, COLOR_WHITE, szMsg);
    #endif

    TogglePlayerControllable(playerid, 0);


    if(iPhase == OBJECT_PRELOAD_PHASE_START)
    {
        TextDrawShowForPlayer(playerid, g_RaceLoadTextdraw);
        TextDrawShowForPlayer(playerid, Text:g_RaceData[iRaceID][29]);

        for(new i = 0; i < iCurrentModelCount; i++)
        {
            // Shouldn't be necessary, but just check this model actually exists in the race,
            if(g_RaceObjectModel[iRaceID][i] == 0)
            {
                printf("[Race] Bad object model found. #2186.");
                SendClientMessage(playerid, COLOR_RED, "Warning: Bad object model found - #2187. - Resources/Minigames/Race/core.pwn");
                continue;
            }

            // Just check if the object already exists. In the unlikely event
            // that it does destroy it to prevent duplicates.. (Man I love error checking)
            if(IsValidDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]))
            {
                DestroyDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]);
                printf("[Race] Error: Bad Preloaded object found. Deleted. (Race ID: %d. Object Index ID: %d", iRaceID, i);

                #if BETA_TEST == 1
                    format(szMsg, 128, "Warning: Bad preloaded object found. Deleted. (Race ID: %d. Object Index ID: %d) #2193", iRaceID, i);
                    SendClientMessage(playerid, COLOR_RED, szMsg);
                #endif
            }

            // Create 1 dynamic per-player object for each model at the players position.
            g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] = CreateDynamicObject(g_RaceObjectModel[iRaceID][i], fPosX, fPosY, fPosZ, 0, 0, 0, iWorldID, iInteriorID, playerid);
        }

        #if BETA_TEST == 1
            format(szMsg, 128, "Race Information: Loaded %d/%d object models for race %d. Phase: %d", iCurrentModelCount, CRace__GetObjectModelCount(iRaceID), iRaceID, iPhase);
            SendClientMessage(playerid, COLOR_YELLOW, szMsg);
        #endif
    }
    // Alright this is the second phase so we need to load the other objects.
    else if (iPhase == OBJECT_PRELOAD_PHASE_FINISH)
    {
        // Destroy the old ones first!
        for(new i = 0; i < iCurrentModelCount; i++)
        {
            if(!IsValidDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]))
            {
                #if BETA_TEST == 1
                    format(szMsg, 128, "Error: Unable to delete preloaded race object ID %d (Does not exist!) #2214", _: g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]);
                    SendClientMessage(playerid, COLOR_RED, szMsg);
                #endif
                g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] = DynamicObject: INVALID_OBJECT_ID;
                continue;
            }

            DestroyDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]);
            g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] = DynamicObject: INVALID_OBJECT_ID;
        }


        // Now create the remaining objects and we're done. The rest is handled in the finish preload function
        for(new i = iCurrentModelCount; i < iModelCount; i++)
        {
            // Just check if the object already exists. In the unlikely event
            // that it does destroy it to prevent duplicates.. 
            if(IsValidDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]))
            {
                DestroyDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]);

                #if BETA_TEST == 1
                    format(szMsg, 128, "Error: Bad object model found: %d. Deleted - #2235.", _: g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]);
                    SendClientMessage(playerid, COLOR_RED, szMsg);
                #endif
                g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] = DynamicObject: INVALID_OBJECT_ID;

            }
            g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] = CreateDynamicObject(g_RaceObjectModel[iRaceID][i], fPosX, fPosY, fPosZ, 0, 0, 0, iWorldID, iInteriorID, playerid);
        }
        #if BETA_TEST == 1
            format(szMsg, 128, "Race Information: Loaded %d/%d object models for race %d. Phase: %d", iModelCount, CRace__GetObjectModelCount(iRaceID), iRaceID, iPhase);
            SendClientMessage(playerid, COLOR_YELLOW, szMsg);
        #endif
    }
    // Finally update the streamer and we're done, all preloaded \o
    Streamer_Update(playerid);
}

// CRace__ResetPreloadData(ForPlayer part - had to be removed cos of shitty pawno)
// Called when the player exits a race and destroys all preloaded
// objects and resets all data.
CRace__ResetPreloadData/*ForPlayer*/(playerid, iRaceID)
{
    for(new i = 0, total = CRace__GetObjectModelCount(iRaceID); i < total; ++i)
    {
        if(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] == DynamicObject: INVALID_OBJECT_ID)
        {
            continue;
        }

        if(IsValidDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]))
        {
            DestroyDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]);
            g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] = DynamicObject: INVALID_OBJECT_ID;
        }
    }
}

// CRace__FinishPreloadForPlayer
// This function finishes off the object preload for the player by deleting
// all preloaded objects and restoring them to the race start state
CRace__FinishPreloadForPlayer(playerid, iRaceID)
{
    // Usual unecessary error checking business
    if(iRaceID < 0 || iRaceID > MAX_RACES)
    {
        printf("[Race] Error preloading objects for player %d, in race %d: Invalid race ID (MAX_RACES: %d)", playerid, iRaceID, MAX_RACES);
        return;
    }

    // Ok usual deal. Loop through and destroy the objects and we're done.
    for(new i = 0, total = CRace__GetObjectModelCount(iRaceID); i < total; ++i)
    {
        if(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] == DynamicObject: INVALID_OBJECT_ID)
        {
            continue;
        }

        if(IsValidDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]))
        {
            DestroyDynamicObject(g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ]);
            g_RaceObject[ iRaceID ][ i ][ g_RacePreloadObjectID ][ playerid ] = DynamicObject: INVALID_OBJECT_ID;
        }
    }
}

// CRace__AddCheckpoint
// This function simply adds a new checkpoint to a race, copying all
// required data to our local array, required to actually run the race.
CRace__AddCheckpoint( iRaceID, Float:fPosX, Float:fPosY, Float:fPosZ, Float:fSize )
{
    new iCheckpointID = g_RaceData[ iRaceID ][ 1 ];
    if(iCheckpointID < 0 || iCheckpointID > MAX_CHECKPOINTS)
    {
        printf("[Race] Unable to add checkpoint to race %d: Maximum number of checkpoints exceeded. Please increase MAX_CHECKPOINTS define in race handler.", iRaceID);
        return;
    }

    g_RaceCheckpoints[ iRaceID ][ iCheckpointID ][ 0 ] = fPosX;
    g_RaceCheckpoints[ iRaceID ][ iCheckpointID ][ 1 ] = fPosY;
    g_RaceCheckpoints[ iRaceID ][ iCheckpointID ][ 2 ] = fPosZ;
    g_RaceCheckpoints[ iRaceID ][ iCheckpointID ][ 3 ] = fSize;

    // Increment the checkpoint count, so we can proceed.
    g_RaceData[ iRaceID ][ 1 ] ++;
}

// CRace__UnlimitedNitro
// This function enables unlimited nitro on a race,
// useful for stunt races etc.
CRace__UnlimitedNitro(iRaceID)
{
    g_RaceData[ iRaceID ][ 36 ] = true;
}

// CRace__DisableDamage
// This function controls vehicle damage. Some races
// which contains objects or stunts need unlimited vehicle health.
CRace__DisableDamage(iRaceID, iDisable)
{
    g_RaceData[iRaceID][24] = iDisable;
}

// CRace__SetCheckpointType
// Set the checkpoint type for the specified race. Used to disable
// the race markers, as defined in the race_disable_checkpoint_markers() function
CRace__SetCheckpointType(iRaceID, iType)
{
    g_RaceData[iRaceID][30] = iType;
}
