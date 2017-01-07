// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*
    LAS VENTURAS PLAYGROUND v2.94 ALPHA 4
    Las Venturas Playground Radio v2.0

    This file handles the streaming of LVP Radio into the players vehicle
    when they enter it.

    @Author: Jay
    4th November 2011
    Contact Jay@sa-mp.nl

*/

// Stream URL for the radio
static  LVP_RADIO_STREAM_URL[] = "http://play.sa-mp.nl:8000/stream/1/"; // Radio FG, some french radio for testing purposes: http://www.radiofg.com/streams/fg.pls

static  bool:iRadioEnabledForPlayer[MAX_PLAYERS];    // Boolean to determine if the radio is enabled for a player or not
static  bool:iRadioPlayingForPlayer[MAX_PLAYERS];    // Boolean to determine if LVP Radio is currently playing for the player

static  iRadioPlayerTuneInTime[MAX_PLAYERS];              // Stores the time the player begins the radio stream so we can update the LVP RADIO textdraws accordingly.

// Radio display textdraws
static  Text:radioDisplay [ 2 ] = { Text:INVALID_TEXT_DRAW, ...};



// This function is called when the gamemode is initialized and creates
// the LVP Radio textdraw effects. These textdraws are exact replicas of the
// ingame default radio textdraws
radioInitializeDisplay()
{
    // Grey colour shown when radio is idle
    radioDisplay[ 0 ] = TextDrawCreate(271.000000, 21.000000, "LVP RADIO"); // Grey colour
    TextDrawBackgroundColor(radioDisplay[ 0 ], 255);
    TextDrawFont(radioDisplay[ 0 ], 2);
    TextDrawLetterSize(radioDisplay[ 0 ], 0.519999, 1.899999);
    TextDrawColor(radioDisplay[ 0 ], -1313886209); // OTHER COLOR: -1552346881 (#A37910)
    TextDrawSetOutline(radioDisplay[ 0 ], 1);
    TextDrawSetProportional(radioDisplay[ 0 ], 1);

    // Navy colour shown when radio is properly displayed
    radioDisplay[ 1 ] = TextDrawCreate(271.000000, 21.000000, "LVP RADIO");
    TextDrawBackgroundColor(radioDisplay[ 1 ], 255);
    TextDrawFont(radioDisplay[ 1 ], 2);
    TextDrawLetterSize(radioDisplay[ 1 ], 0.519999, 1.899999);
    TextDrawColor(radioDisplay[ 1 ], -1552346881);
    TextDrawSetOutline(radioDisplay[ 1 ], 1);
    TextDrawSetProportional(radioDisplay[ 1 ], 1);
}

// This function is called every second from LVP's main timer
// to check to hide or update the Race Radio textdraws.
radioProcess(playerid)
{
    if (!iRadioPlayerTuneInTime[playerid])
        return;

    // If 6 seconds have passed show the yellowish LVP RADIO colour display
    if ((Time->currentTime() - iRadioPlayerTuneInTime[playerid]) >= 6) {
        TextDrawHideForPlayer(playerid, radioDisplay[ 0 ]);
        TextDrawShowForPlayer(playerid, radioDisplay[ 1 ]);
        iRadioPlayerTuneInTime[playerid] = 0;
    }

    // If only 3 seconds have passed just show the grey "LVP RADIO" colour display
    else if ((Time->currentTime() - iRadioPlayerTuneInTime[playerid]) >= 3) {
        TextDrawShowForPlayer(playerid, radioDisplay[ 0 ]);
    }
}


// This function is called when a player enters a vehicle
// If the player has LVP Radio enabled in his/her preferences, stream
// the audio for them
radioPlayerEnterVehicle(playerid)
{
    if(iRadioEnabledForPlayer[playerid] == true)
    {
        radioStreamForPlayer(playerid);
    }
}

// This is called when a player leaves a vehicle and stops the stream accordingly
// to simulate a radio station.
radioPlayerExitVehicle(playerid)
{
    if(iRadioPlayingForPlayer[playerid] == true)
    {
        radioStopStreamForPlayer(playerid);
    }
}

// Enable/Disable the audio stream for a player
// depending on his/her preferences. They may want to hear
// the normal radio when they enter their vehicle!
radioToggleForPlayer(playerid, bool:toggle)
{
    iRadioEnabledForPlayer[playerid] = toggle;

    // If they disable the stream and are listening to it already
    // stop streaming.
    if(toggle == false && iRadioPlayingForPlayer[playerid] == true)
    {
        radioStopStreamForPlayer(playerid);
    }

    // If they enable it and they're in a car, start streaming
    if(toggle == true)
    {
        if(IsPlayerInAnyVehicle(playerid))
        {
            radioStreamForPlayer(playerid);
        }
    }
}

// Reset radio data which determines if the player has the stream enabled or not
radioStreamResetData(playerid)
{
    iRadioEnabledForPlayer[playerid] = true;
    iRadioPlayingForPlayer[playerid] = false;
    iRadioPlayerTuneInTime[playerid] = 0;

}

// Begin streaming LVP Radio for the player
// But only if they have it enabled
radioStreamForPlayer(playerid)
{
    if(iRadioEnabledForPlayer[playerid] == false)
    {
        return;
    }

    if(GetPVarInt(playerid, "iPlayerRadioDisplayMsg") == 0)
    {
        SetPVarInt(playerid, "iPlayerRadioDisplayMsg", 1);
        ShowBoxForPlayer(playerid, "Tuned in to ~y~LVP RADIO~w~. Use ~p~/audiomsg~w~ to hide radio chat messages. Use ~p~/radio~w~ to toggle radio options.");
    }

    PlayAudioStreamForPlayer(playerid, LVP_RADIO_STREAM_URL);
    iRadioPlayingForPlayer[playerid] = true;
    iRadioPlayerTuneInTime[playerid] = Time->currentTime();
}

// This function stops streaming LVP Radio for the player.
// It checks first of all if LVP Radio is indeed streaming in case
// it may be another stream that is stopping, when it shouldn't (e.g. the dance
// radio stream in the night club)
radioStopStreamForPlayer(playerid)
{
    if(iRadioPlayingForPlayer[playerid] == true)
    {
        StopAudioStreamForPlayer(playerid);

        iRadioPlayingForPlayer[playerid] = false;
        iRadioPlayerTuneInTime[playerid] = 0;

        // Hide the LVP RADIO Textdraws
        TextDrawHideForPlayer(playerid, radioDisplay[ 0 ]);
        TextDrawHideForPlayer(playerid, radioDisplay[ 1 ]);
    }
}
