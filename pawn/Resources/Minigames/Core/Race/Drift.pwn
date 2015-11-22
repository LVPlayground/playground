// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Las Venturas Playground 2.9 Drift Handler
//
// Generic drift handler, which allows other scripts to enable drifting
// for a certain players. Complete with points system, highscore saving
// and more fancy stuff.
//
// Author: Pugwipe

#define X2_MULTIPLYER   8200    // How many points does a player need prior to getting a x2 multiplyer of points?

//forward CDrift__Update();

enum ENUM_DRIFT_DATA
{
    bool:Enabled, // Whether drifting is enabled for this player or not

    TotalScore, // Total points
    Score, // Current drift score
    LastDrift, // Score of the last successful drift
    LastTicks, // Used to calculate when a drift will be finished
    DriftStart, // When did the current drift start?
    bool: Teleported, // Boolean to determine if a player has recently teleported. Adds an exception to the last drift "frame" if so
    Text: ScoreDisplay, // Score display textdraw
    Text: TotalScoreDisplay[ 2 ], // If adding more make sure you update the loop in CDrift__DisableForPlayer to hide it (sizeof + enums = no (pawn))
    ResetTD,

    // Saved stuff for the last "frame"
    Float: LastHP,
    Float: LastX,
    Float: LastY,
    Float: LastZ
};

 // This variable contains all drift data; it's static, so that other scripts don't have direct access to it
static CDrift__Data[ MAX_PLAYERS ][ ENUM_DRIFT_DATA ];



// This variable stores the IDs for special affect textdraws, such as "good drift", etc
static  Text:CDrift__Textdraw [ 5 ] = {Text:INVALID_TEXT_DRAW, ...};

CDrift__Initialize()
{
    // Good drift which shows after 2000 drifting points
    CDrift__Textdraw[ 0 ] = TextDrawCreate(266, 107, "Good Drift");
    TextDrawBackgroundColor(CDrift__Textdraw[ 0 ], 255);
    TextDrawFont(CDrift__Textdraw[ 0 ], 2);
    TextDrawLetterSize(CDrift__Textdraw[ 0 ], 0.370000, 2.100000);
    TextDrawColor(CDrift__Textdraw[ 0 ], 16777215);
    TextDrawSetOutline(CDrift__Textdraw[ 0 ], 0);
    TextDrawSetProportional(CDrift__Textdraw[ 0 ], 1);
    TextDrawSetShadow(CDrift__Textdraw[ 0 ], 1);

    // Great drift which shows after 4000 drifting points
    CDrift__Textdraw[ 1 ] = TextDrawCreate(266, 107, "Great drift!");
    TextDrawBackgroundColor(CDrift__Textdraw[ 1 ], 255);
    TextDrawFont(CDrift__Textdraw[ 1 ], 2);
    TextDrawLetterSize(CDrift__Textdraw[ 1 ], 0.370000, 2.100000);
    TextDrawColor(CDrift__Textdraw[ 1 ], COLOR_YELLOW);
    TextDrawSetOutline(CDrift__Textdraw[ 1 ], 0);
    TextDrawSetProportional(CDrift__Textdraw[ 1 ], 1);
    TextDrawSetShadow(CDrift__Textdraw[ 1 ], 1);

    // Excellent drift which shows after 7000 drifting points
    CDrift__Textdraw[ 2 ] = TextDrawCreate(266, 107, "Excellent Drift!!");
    TextDrawBackgroundColor(CDrift__Textdraw[ 2 ], 255);
    TextDrawFont(CDrift__Textdraw[ 2 ], 2);
    TextDrawLetterSize(CDrift__Textdraw[ 2 ], 0.370000, 2.100000);
    TextDrawColor(CDrift__Textdraw[ 2 ], COLOR_LIGHTBLUE);
    TextDrawSetOutline(CDrift__Textdraw[ 2 ], 0);
    TextDrawSetProportional(CDrift__Textdraw[ 2 ], 1);
    TextDrawSetShadow(CDrift__Textdraw[ 2 ], 1);

    // x2 bonus message which appears after 7100 drifting points
    CDrift__Textdraw[ 3 ] = TextDrawCreate(362, 66, "x2");
    TextDrawBackgroundColor(CDrift__Textdraw[ 3 ], 255);
    TextDrawFont(CDrift__Textdraw[ 3 ], 1);
    TextDrawLetterSize(CDrift__Textdraw[ 3 ], 0.540000, 2.600000);
    TextDrawColor(CDrift__Textdraw[ 3 ], -1);
    TextDrawSetOutline(CDrift__Textdraw[ 3 ], 0);
    TextDrawSetProportional(CDrift__Textdraw[ 3 ], 1);
    TextDrawSetShadow(CDrift__Textdraw[ 3 ], 1);

    // There isn't actually a speed bonus, it just shows for the sake of it :+
    CDrift__Textdraw[ 4 ] = TextDrawCreate(362, 88, "Speed Bonus");
    TextDrawBackgroundColor(CDrift__Textdraw[ 4 ], 255);
    TextDrawFont(CDrift__Textdraw[ 4 ], 1);
    TextDrawLetterSize(CDrift__Textdraw[ 4 ], 0.290000, 1.400000);
    TextDrawColor(CDrift__Textdraw[ 4 ], -16711681);
    TextDrawSetOutline(CDrift__Textdraw[ 4 ], 0);
    TextDrawSetProportional(CDrift__Textdraw[ 4 ], 1);
    TextDrawSetShadow(CDrift__Textdraw[ 4 ], 1);

    // Initialize the per-player text draws.
    for (new playerId = 0; playerId < sizeof(CDrift__Data); ++playerId) {
        for (new textDrawId = 0; textDrawId < 2; ++textDrawId)
            CDrift__Data[playerId][TotalScoreDisplay][textDrawId] = Text: INVALID_TEXT_DRAW;
        CDrift__Data[playerId][ScoreDisplay] = Text: INVALID_TEXT_DRAW;
    }

}


// Function: CDrift__Update
// Called a few times every second (sorry, but calling it once every second really
// wouldn't work well), this function updates the drifting scores for every player.
CDrift__Update()
{
    static iTicks = 0;

    if (!iTicks)
    {
        iTicks = GetTickCount();
        return;
    }

    new iCurrent = GetTickCount();
    new iDiff = iCurrent - iTicks; // Number of milliseconds since the previous timer execution

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if ( !IsPlayerConnected( i ))
        {
            continue;
        }

        if ( IsPlayerNPC( i ))
        {
            continue;
        }

        if( GetPlayerState( i ) != PLAYER_STATE_DRIVER)
        {
            continue;
        }

        CDrift__UpdateForPlayer( i, iDiff );

    }
    iTicks = iCurrent;
}



// Function CDrift__UpdateForPlayer
// Updates the drift score/textdraw and such for a specific player.
// Normally called from CDrift__Update().
CDrift__UpdateForPlayer( iPlayer, iDiff )
{

    if(CDrift__Data[ iPlayer ][ Enabled ] == true)
    {
        if(!IsPlayerInAnyVehicle(iPlayer) || GetPlayerVehicleSeat(iPlayer) != 0)
        {
            CDrift__DisableForPlayer( iPlayer );
            return;
        }

        // Don't update the drift counter if the player has teleported.
        if(CDrift__Data[ iPlayer ][ Teleported ] == true)
        {
            CDrift__Data[ iPlayer ][ Teleported ] = false;
            goto l_End;
        }

        new iVeh = GetPlayerVehicleID(iPlayer);

        new
            Float: fRotZ,
            Float: fPosX,
            Float: fPosY,
            Float: fPosZ,
            Float: fHealth;

        GetVehicleHealth( iVeh, fHealth );
        GetVehicleZAngle( iVeh, fRotZ ); // Vehicle's rotation
        GetVehiclePos( iVeh, fPosX, fPosY, fPosZ ); // position

        if (fHealth < CDrift__Data[ iPlayer ][ LastHP ])
        {
            // He crashed :<
            CDrift__Finish( iPlayer, false );
            goto l_End;
        }


        new iTicks = GetTickCount();
        new Float: fDiffX, Float: fDiffY, Float: fDiffZ;
        new Float: fSpeed, Float: fAngle;

        fDiffX = floatsub( fPosX, CDrift__Data[ iPlayer ][ LastX ] );
        fDiffY = floatsub( fPosY, CDrift__Data[ iPlayer ][ LastY ] );
        fDiffZ = floatabs( floatsub( fPosZ, CDrift__Data[ iPlayer ][ LastZ ] ) );

        fSpeed = floatsqroot( floatpower( fDiffX,2 ) + floatpower( fDiffY, 2 ) );
        fAngle = floatsub( atan( floatdiv( fDiffY, fDiffX ) ), 90.0 );
        fAngle = floatabs( floatsub( fRotZ, fAngle ) );

        fAngle = floatsub( fAngle, floatmul( floatround( floatdiv( fAngle, 180.0 ), floatround_floor ), 180.0 ) );
        fAngle = ( (fAngle > 90) ? floatabs( floatsub( 180.0, fAngle ) ) : fAngle );
        // Whew, we finally got the right number



        if (iTicks >= CDrift__Data[ iPlayer ][ ResetTD ] && CDrift__Data[ iPlayer ][ ResetTD ] != 0)
        {
            if (CDrift__Data[ iPlayer ][ ScoreDisplay ] != Text: INVALID_TEXT_DRAW)
            {
                TextDrawDestroy( CDrift__Data[ iPlayer ][ ScoreDisplay ] );
                CDrift__Data[ iPlayer ][ ScoreDisplay ] = Text: INVALID_TEXT_DRAW;
            }
        }


        new Float: fDiff = float( iDiff ); // Ticks, converted to a float
        new Float: fZ = floatdiv( fDiffZ, floatdiv( fDiff, 1000.0 ) );

        if(fAngle > 10.0 && fSpeed > floatdiv( fDiff, 80.0 ) &&  fZ < 10.0)
        {
             // Player is technically drifting; calculate the number of points he gains
            new iScore = CDrift__CalcScore( iDiff, fSpeed, fAngle );

            if (CDrift__Data[ iPlayer ][ Score ] == 0)
            {
                CDrift__Data[ iPlayer ][ DriftStart ] = iTicks;
            }

            // Add it to the total
            CDrift__Data[ iPlayer ][ Score ] += iScore;
            CDrift__Data[ iPlayer ][ LastTicks ] = iTicks;

            if (iTicks >= CDrift__Data[ iPlayer ][ ResetTD ])
            {
                // Display the current points
                CDrift__UpdateTextDraw( iPlayer, CDrift__Data[ iPlayer ][ Score ], 0xFFFFCCFF, fSpeed );
                CDrift__Data[ iPlayer ][ ResetTD ] = 0;
            }
        }
        else
        {
            new iMP = ((iTicks - CDrift__Data[ iPlayer ][ DriftStart ]) / 1500) + 1;
            iMP = (iMP > 5 ? 5 : iMP);
            if (CDrift__Data[ iPlayer ][ LastTicks ] > 0 && (iTicks - CDrift__Data[ iPlayer ][ LastTicks ]) > (800 - (iMP * 100)))
            {
                // Drift finished
                CDrift__Finish( iPlayer, true );
            }
        }
    l_End:
        CDrift__Data[ iPlayer ][ LastHP ] = fHealth;
        CDrift__Data[ iPlayer ][ LastX ] = fPosX;
        CDrift__Data[ iPlayer ][ LastY ] = fPosY;
        CDrift__Data[ iPlayer ][ LastZ ] = fPosZ;
    }
}

// Function: CDrift__CalcScore
// Calculates the score, according to a given speed and angle.
CDrift__CalcScore( iTicks, Float: fSpeed, Float: fAngle )
{
    new Float: fScore = floatmul( fSpeed, floatpower( fAngle, 0.4 ) );
    new iScore = floatround( floatdiv( floatmul( fScore, float( iTicks ) ), 10.0 ) );
    return iScore;
}

// Function: CDrift__Finish
// Ends a currently running drift, either successfully or not.
CDrift__Finish( iPlayer, bool:bSuccessful = true )
{

    new iScore = CDrift__Data[ iPlayer ][ Score ];

    if (iScore > 0)
    {
        if (bSuccessful)
        {
            // Check for the 2x multiplyer

            if(iScore > X2_MULTIPLYER)
            {
                iScore = floatround(iScore * 2);
            }

            // Add the drift points
            CDrift__Data[ iPlayer ][ TotalScore ] += iScore;
            CDrift__Data[ iPlayer ][ LastDrift ] = iScore;

            // Successful drift. Greenish color
            CDrift__UpdateTextDraw( iPlayer, iScore, 0x41D564FF );

            CAchieve__Drift(iPlayer, iScore);
        }

        else
        {
            // Aww. Red color
            CDrift__UpdateTextDraw( iPlayer, iScore, 0xCC0000FF );
        }
    }

    // Textdraw should be visible for at least 500ms. If this is a x2 multiplyer drift though,
    // it should show for a bit longer to show the player of the change
    if(iScore < X2_MULTIPLYER)
    {
        CDrift__Data[ iPlayer ][ ResetTD ] = GetTickCount() + 500;
    }
    else
    {
        CDrift__Data[ iPlayer ][ ResetTD ] = GetTickCount() + 900;
    }



    // Hide all the bonus textdraws
    for(new i = 0; i < sizeof( CDrift__Textdraw ); i++)
    {
        TextDrawHideForPlayer( iPlayer, CDrift__Textdraw[ i ]);
    }

    // Reset some vars
    CDrift__Data[ iPlayer ][ Score ] = 0;
    CDrift__Data[ iPlayer ][ LastTicks ] = 0;
}

// Function: CDrift__EnableForPlayer
// Enables drifting for a player. Must be used in minigames that use this handler.
CDrift__EnableForPlayer( iPlayer )
{

    if ( !IsPlayerInAnyVehicle( iPlayer ) ) return 0;

    CDrift__ShowScoreDisplay( iPlayer );

    new iVeh = GetPlayerVehicleID( iPlayer );
    new Float: fPosX, Float: fPosY, Float: fPosZ, Float: fHealth;
    GetVehiclePos( iVeh, fPosX, fPosY, fPosZ );
    GetVehicleHealth( iVeh, fHealth );

    CDrift__Data[ iPlayer ][ TotalScore ] = 0;
    CDrift__Data[ iPlayer ][ Score ] = 0;
    CDrift__Data[ iPlayer ][ LastDrift ] = 0;
    CDrift__Data[ iPlayer ][ LastTicks ] = 0;
    CDrift__Data[ iPlayer ][ DriftStart ] = 0;
    CDrift__Data[ iPlayer ][ LastHP ] = fHealth;
    CDrift__Data[ iPlayer ][ LastX ] = fPosX;
    CDrift__Data[ iPlayer ][ LastY ] = fPosY;
    CDrift__Data[ iPlayer ][ LastZ ] = fPosZ;

    CDrift__Data[ iPlayer ][ Enabled ] = true;

    // When initially enabling it, for-se any teleporting (i.e on race starts)
    // add an exception to the initial drift points calculation
    CDrift__Data[ iPlayer ][ Teleported ] = true;
    return 1;
}

// Function: CDrift__DisableForPlayer
// Disables drifting for a specific player, cleaning up textdraws etc.
CDrift__DisableForPlayer( iPlayer )
{
    if (CDrift__Data[ iPlayer ][ ScoreDisplay ] != Text: INVALID_TEXT_DRAW) {
        TextDrawDestroy( CDrift__Data[ iPlayer ][ ScoreDisplay ] );
        CDrift__Data[ iPlayer ][ ScoreDisplay ] = Text: INVALID_TEXT_DRAW;
    }

    CDrift__Data[ iPlayer ][ Enabled ] = false;
    CDrift__Data[ iPlayer ][ Score ] = false;

    for(new i = 0; i < 2; i++) {
        if (CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ i ] != Text: INVALID_TEXT_DRAW)
            TextDrawDestroy(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ i ]);

        CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ i ] = Text: INVALID_TEXT_DRAW;
    }

    for(new i = 0; i < sizeof( CDrift__Textdraw ); i++) {
        TextDrawHideForPlayer(iPlayer, CDrift__Textdraw[ i ]);
    }

    return 1;
}


// Function: CDrift__Teleport
// When a player carteleports, this function is called to ensure it won't count as "drifting".
CDrift__Teleport( iPlayer )
{
    CDrift__Data[ iPlayer ][ Teleported ] = true;
}

// Function: CDrift__ShowScoreDisplay
// Called from CDrift__EnableForPlayer
// and shows the total score of the player.
CDrift__ShowScoreDisplay( iPlayer )
{
    // Create the total score display textdraws

    if( CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ] == Text: INVALID_TEXT_DRAW)
    {
        CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ] = TextDrawCreate(41, 220, "DRIFTING");
        TextDrawBackgroundColor(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 255);
        TextDrawFont(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 1);
        TextDrawLetterSize(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 0.340000, 1.300000);
        TextDrawColor(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], -1);
        TextDrawSetOutline(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 0);
        TextDrawSetProportional(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 1);
        TextDrawSetShadow(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 1);
        TextDrawUseBox(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 1);
        TextDrawBoxColor(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 255);
        TextDrawTextSize(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ], 98, 0);
    }

    if( CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ] == Text: INVALID_TEXT_DRAW)
    {
        CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ] = TextDrawCreate(41, 236, "0");
        TextDrawBackgroundColor(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], -1);
        TextDrawFont(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 1);
        TextDrawLetterSize(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 0.319999, 1.499999);
        TextDrawColor(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 255);
        TextDrawSetOutline(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 1);
        TextDrawSetProportional(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 1);
        TextDrawUseBox(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 1);
        TextDrawBoxColor(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 0x00000033);
        TextDrawTextSize(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], 98.000000, 0.000000);
    }

    TextDrawShowForPlayer(iPlayer, CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 0 ]);
    TextDrawShowForPlayer(iPlayer, CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ]);
}

// Function: CDrift__UpdateTextDraw
// Updates the score textdraw for a player and gets called every "frame"
CDrift__UpdateTextDraw( iPlayer, iScore, iColor, Float:fSpeed = 0.0 )
{
    new szScore[12];
    format( szScore, sizeof( szScore ), "%d", iScore );

    new szTotalScore[12];
    format(szTotalScore, 12, "%d", CDrift__GetPlayerScore( iPlayer ));

    // Update the main drift points textdraw
    if (CDrift__Data[ iPlayer ][ ScoreDisplay ] != Text:INVALID_TEXT_DRAW)
    {
        TextDrawColor( CDrift__Data[ iPlayer ][ ScoreDisplay ], iColor );
        TextDrawSetString(CDrift__Data[ iPlayer ][ ScoreDisplay ], szScore);
        TextDrawShowForPlayer(iPlayer, CDrift__Data[ iPlayer ][ ScoreDisplay ]);

        TextDrawSetString(CDrift__Data[ iPlayer ][ TotalScoreDisplay ][ 1 ], szTotalScore);
    }
    else
    {
        // Create the score display textdraw
        CDrift__Data[ iPlayer ][ ScoreDisplay ] = TextDrawCreate(250, 60, szScore);
        TextDrawBackgroundColor(CDrift__Data[ iPlayer ][ ScoreDisplay ], 255);
        TextDrawFont(CDrift__Data[ iPlayer ][ ScoreDisplay ], 3);
        TextDrawLetterSize(CDrift__Data[ iPlayer ][ ScoreDisplay ], 1.189999, 5.299999);
        TextDrawColor(CDrift__Data[ iPlayer ][ ScoreDisplay ], -1);
        TextDrawSetOutline(CDrift__Data[ iPlayer ][ ScoreDisplay ], 0);
        TextDrawSetProportional(CDrift__Data[ iPlayer ][ ScoreDisplay ], 1);
        TextDrawSetShadow(CDrift__Data[ iPlayer ][ ScoreDisplay ], 3);
        TextDrawBackgroundColor( CDrift__Data[ iPlayer ][ ScoreDisplay ], 0x000000FF );
        TextDrawColor( CDrift__Data[ iPlayer ][ ScoreDisplay ], iColor );

        TextDrawShowForPlayer( iPlayer, CDrift__Data[ iPlayer ][ ScoreDisplay ] );
        return;
    }

    // Now show relevant bonus messages. Just looks cool :)
        // 0 = 2000, 1 = 4000 2 = 7000 3 = 7100

    if(iScore >= 2000 && iScore < 4000)
    {
        TextDrawShowForPlayer( iPlayer, CDrift__Textdraw[ 0 ] ); // "Good drift" textdraw
    }
    else if (iScore >= 4000 && iScore < 7000)
    {
        TextDrawHideForPlayer( iPlayer, CDrift__Textdraw[ 0 ] ); // "Great drift" textdraw
        TextDrawShowForPlayer( iPlayer, CDrift__Textdraw[ 1 ] );
    }
    else if (iScore >= 7000)
    {
        TextDrawHideForPlayer( iPlayer, CDrift__Textdraw[ 1 ] ); // "Excellent drift" textdraw
        TextDrawShowForPlayer( iPlayer, CDrift__Textdraw[ 2 ] );

        // Speed bonus msg
        if(fSpeed != 0 && fSpeed >= 4 && iScore >= 8500)
        {
            TextDrawShowForPlayer( iPlayer, CDrift__Textdraw[ 4 ]);
        }
        else
        {
            TextDrawHideForPlayer( iPlayer, CDrift__Textdraw[ 4 ]);
        }
    }

    // x2 multiplyer
    if (iScore >= X2_MULTIPLYER)
    {
        TextDrawShowForPlayer( iPlayer, CDrift__Textdraw[ 3 ] ); // "x2" Textdraw
    }
}

// Function: CDrift__GetPlayerScore
// Get the total drifting score for a player.
CDrift__GetPlayerScore( iPlayer )
{
    return CDrift__Data[ iPlayer ][ TotalScore ];
}
