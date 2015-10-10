// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

    Las Venturas Playground v2.94 Alpha 3

    Player Display: Information Box

    Contained in this file are the relevant functions for displaying the
    player information box. This new interface highly improves the gameplay experience
    as well as making instructions and notices much clearer and easier to read
    and understand.


    @copyright Copyright (c) Las Venturas Playground www.SA-MP.nl 2011
    @author Jay
    @package Interface
    @version 1

    3rd September 2011

*******************************************************************************/


// TextDraw developed using Zamaroht's Textdraw Editor 1.0

// On top of script:
new Text:tPlayerInformationBox[MAX_PLAYERS] = { Text: INVALID_TEXT_DRAW, ... };
new iPlayerInfoBoxDisplayTime[MAX_PLAYERS] = {-1, ...};                       // Stores the timestamp the info box was displayed

#define PLAYER_INFO_BOX_DISPLAY_INTERVAL        7                           // How many seconds BY DEFAULT should the box show for
new forstr[256];
#define ShowPlayerBox(%1,%2,%3) do{format(forstr, 256, (%2), %3);ShowBoxForPlayer(%1,forstr);}while(false)

// Create the player box. Called the first time ShowPlayerBox is called
InitPlayerBox(playerid)
{
    DestroyPlayerBox(playerid);

    tPlayerInformationBox[ playerid ] = TextDrawCreate(28.000000, 120.000000, "Loading...");
    TextDrawBackgroundColor(tPlayerInformationBox[ playerid ], 255);
    TextDrawFont(tPlayerInformationBox[ playerid ], 2);
    TextDrawLetterSize(tPlayerInformationBox[ playerid ], 0.250000, 1.200000);
    TextDrawColor(tPlayerInformationBox[ playerid ], -1);
    TextDrawSetOutline(tPlayerInformationBox[ playerid ], 0);
    TextDrawSetProportional(tPlayerInformationBox[ playerid ], 1);
    TextDrawSetShadow(tPlayerInformationBox[ playerid ], 1);
    TextDrawUseBox(tPlayerInformationBox[ playerid ], 1);
    TextDrawBoxColor(tPlayerInformationBox[ playerid ], 255);
    TextDrawTextSize(tPlayerInformationBox[ playerid ], 169.000000, -8.000000);
}

// Destroy the player box. 
DestroyPlayerBox(playerid) {
    if (tPlayerInformationBox[playerid] == Text:INVALID_TEXT_DRAW)
        return;

    TextDrawDestroy(tPlayerInformationBox[playerid]);
    tPlayerInformationBox[playerid] = Text:INVALID_TEXT_DRAW;
    iPlayerInfoBoxDisplayTime[playerid] = -1;
}


// Returns 1 if the box has been created otherwise 0
IsPlayerBoxValid(playerid) {
    return tPlayerInformationBox[playerid] != Text:INVALID_TEXT_DRAW;
}

IsPlayerBoxShowing(playerid)
{
    if(iPlayerInfoBoxDisplayTime[playerid] == -1)
    {
        return 0;
    }
    else
    {
        return 1;
    }
}

HidePlayerBox(playerid) {
    TextDrawHideForPlayer(playerid, tPlayerInformationBox[playerid]);
    iPlayerInfoBoxDisplayTime[playerid] = -1;
}


ShowBoxForPlayer(playerid, szDisplay[])
{
    // Prior to showing it we may have to actually create it!
    if (!IsPlayerBoxValid(playerid))
        InitPlayerBox(playerid);

    TextDrawSetString(tPlayerInformationBox[playerid], szDisplay);
    TextDrawShowForPlayer(playerid, tPlayerInformationBox[playerid]);

    // Store the time it was shown so we can check later if the desired
    // amount of seconds have passed and hide it
    iPlayerInfoBoxDisplayTime[playerid] = GetTickCount();

    // Sound: Basket ball like thingie
    PlayerPlaySound(playerid, 4604, 0, 0, 0);

    return 1;
}

// Called every second from LVPs main timers to check if the desired display
// time has passed and we need to hide the box
ProcessPlayerBox(playerid) {
    if(!IsPlayerBoxShowing(playerid))
    {
        return;
    }
    // The stated amount of seconds has passed since the box was shown. Hide it.
    if(GetTickCount() - iPlayerInfoBoxDisplayTime[playerid] > PLAYER_INFO_BOX_DISPLAY_INTERVAL * 1000)
    {
        HidePlayerBox(playerid);
    }
}