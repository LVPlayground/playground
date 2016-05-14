// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// LVP Chase Minigame
// Improved version for LVP 2.9 by tomozj -- credits to the original authors
// for the original chase minigame (Names?)

// Declare the vars
new chaseData[6];
static Text:chaseTD_text[3] = {Text:INVALID_TEXT_DRAW, ...};

#define CHASE_TIMELIMIT 300 // 5 minutes

bool: LegacyIsPlayerChased(playerId) {
    if (chaseData[1] == playerId)
        return true;

    return false;
}

bool: LegacyIsChaseRunning() {
    if (!chaseData[0])
        return false;

    return true;
}

// CChase__Initialize
// Is called at the start of the gamemode in order to run other internals of
// this class.
CChase__Initialize()
{
    CChase__ResetVars();

    return 1;
}

// CChase__ResetVars
// Sets the main variables of the class to default values, in order to prevent
// bugs from occurring due to the handler using old data from an old chase.
CChase__ResetVars()
{
    // This function resets all the variables in the chaseData array to their
    // default values, so this way no bugs from old chases can occur!
    chaseData[0] = 0;       // Whether the chase is active
    chaseData[1] = -1;      // Who's being chased
    chaseData[2] = -1;      // The timer countdown
    chaseData[3] = -1;      // The textdraw timer
    chaseData[4] = -1;      // The ID of the textdraw being handled with timer
    chaseData[5] = -1;      // The timer used at the end of the game for the TD :)


    for(new i; i<2; i++)
    {
        TextDrawHideForAll(chaseTD_text[i]);
        TextDrawDestroy(chaseTD_text[i]);
        chaseTD_text[i] = Text:INVALID_TEXT_DRAW;
    }
    return 1;
}

// CChase__Start
// Is called when the chase is to be started -- when an administrator does
// /chase. Put code to do with the starting of the minigame in here and not in
// the command in commandsAdmin.pwn, and vice-versa for command parsing checks.
CChase__Start(tID)
{
    chaseData[0] = 1;                   // We declare the chase as started! :)
    chaseData[1] = tID;                 // Save who's being chased..
    chaseData[2] = CHASE_TIMELIMIT;     // Defined at the top

    new name[24], string[256];
    GetPlayerName(tID, name, 24);

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(g_VirtualWorld[i] == 0)
        {
            // They're in the main world.
            SendClientMessage(i, COLOR_WHITE, "-------------------------------------------------------------------------------------------------------");
            format(string, sizeof(string), "%s has been identified as a VERY dangerous terrorist,", name);
            SendClientMessage(i, COLOR_RED, string);
            SendClientMessage(i, COLOR_RED, "and should be eliminated as soon as possible. The killer receives");
            SendClientMessage(i, COLOR_RED, "two and a half million dollars in cash money.");
            SendClientMessage(i, COLOR_WHITE, "-------------------------------------------------------------------------------------------------------");
            CancelTaxi(tID);

        } else {
            // They're not :(
            format(string, sizeof(string), "* %s is currently being chased in the main world. Type /world 0 to join!", name);
            SendClientMessage(i, COLOR_PINK, string);
        }
    }

    CChase__TDShow(0, 3);

    // Change every player their color to white, except for the chased player (red).
    CChase__InitializeColorForPlayer();

    ClearPlayerMenus(tID);
}

// CChase__Stop
// This command stops the chase with a reason ID. A playerid parameter is also
// passed due to having to do things such as output which admin ended the chase,
// who the killer was etc. -- the value is -1 usually if no ID is passed.
CChase__Stop(reason, playerid)
{
    // Stops the chase with a reason ID

    if(reason == 0) {           // Leave

        new string[256], name[24];
        GetPlayerName(chaseData[1], name, 24);
        format(string, sizeof(string), "%s has left the game during the chase! The chase has been aborted!", name);
        SendClientMessageToAllEx( COLOR_YELLOW, string);
        CChase__TDShow(2, 3);

    } else if(reason == 1) {    // Killed

        new name[24], name2[24], string[256];
        GetPlayerName( playerid, name, 24 );
        GetPlayerName( chaseData[1], name2, 24 );
        format( string, sizeof ( string ) , "%s has killed %s! The chase is over!!", name, name2 );
        SendClientMessageToAllEx( COLOR_YELLOW, string );
        CChase__TDShow(1, 3); // "THE CHASE IS OVER"
        GiveRegulatedMoney(playerid, ChaseWinner);
        WonMinigame[playerid]++;
    } else if(reason == 2) {    // Stopped by admin

        new name[24], name2[24], string[256];
        GetPlayerName( chaseData[1], name, 24 );
        GetPlayerName( playerid, name2, 24 );
        format(string, sizeof(string), "The chase of %s (Id:%d) has been ended by %s (Id:%d).",
            name, chaseData[1], name2, playerid);
        Admin(playerid, string);
        SendClientMessageToAllEx( COLOR_RED, "The chase has been aborted!" );
        CChase__TDHide(0);
        CChase__TDShow(2, 3); // "THE CHASE HAS BEEN ABORTED"

    } else if(reason == 3) {     // Player died

        new string[128];
        format(string,128,"%s has died! The chase is over.",PlayerName(chaseData[1]));
        SendClientMessageToAllEx(COLOR_RED,string);
        CChase__TDShow(1, 3);
    } else {                    // Escaped

        new name[24], string[256];
        GetPlayerName( chaseData[1], name, 24  );

        format( string, sizeof ( string ) , "%s has escaped! The chase is over!!", name );
        SendClientMessageToAllEx( COLOR_YELLOW, string  );

        CChase__TDShow(1, 3); // "THE CHASE IS OVER"

        GiveRegulatedMoney(chaseData[1], ChaseEscaped);
        WonMinigame[chaseData[1]]++;
    }

    // Initialize the markers of the other players for everyone.
    CChase__ReleaseColorForPlayer();

    // Basics at the end
    chaseData[5] = 3;
    return 1;
}

// CChase__Disconnect
// This function is executed every time a player disconnects. Allows chase code
// to stay centralized in this file, and easily editable.
CChase__Disconnect(playerid)
{
    // This function checks if a player when disconnecting is being chased.

    if(chaseData[0] == 0) return 1;
    if(chaseData[1] == playerid) {
        // Shite this player is being chased! Do something!
        CChase__Stop(0, -1);
        return 1;
    } else
        return 1;
}

// CChase__TDCreate
// Creates the textdraw required, depending on which ID is passed. The textdraws
// are re-created every time due to SA-MP 0.2.2 R2 being a bitch with textdraws.
// In future versions of SA-MP, this function can be used to initialize the
// textdraws at gamemode start and then show/hide functions to show/hide without
// having to destroy the textdraw every time.
CChase__TDCreate(id)
{
    if(id == 0)
    {
        // Kill the red one
//      TextDrawDestroy(chaseTD_text[0]);
        chaseTD_text[0] = TextDrawCreate(297.000000,341.000000,"KILL THE RED ONE!");
        TextDrawAlignment(chaseTD_text[0],1);
        TextDrawBackgroundColor(chaseTD_text[0],0x000000ff);
        TextDrawFont(chaseTD_text[0],3);
        TextDrawLetterSize(chaseTD_text[0],1.100000,3.900000);
        TextDrawColor(chaseTD_text[0],0xff000099);
        TextDrawSetOutline(chaseTD_text[0],1);
        TextDrawSetProportional(chaseTD_text[0],1);
        TextDrawShowForAll(chaseTD_text[0]);
    } else if(id == 1)
    {
        // The chase is over
  //      TextDrawDestroy(chaseTD_text[1]);
        chaseTD_text[1] = TextDrawCreate(285.000000,325.000000,"THE CHASE IS OVER!");
        TextDrawAlignment(chaseTD_text[1],1);
        TextDrawBackgroundColor(chaseTD_text[1],0x000000ff);
        TextDrawFont(chaseTD_text[1],3);
        TextDrawLetterSize(chaseTD_text[1],1.000000,3.099999);
        TextDrawColor(chaseTD_text[1],0x00ff0099);
        TextDrawSetOutline(chaseTD_text[1],1);
        TextDrawSetProportional(chaseTD_text[1],1);
        TextDrawShowForAll(chaseTD_text[1]);
    } else if(id == 2)
    {
        // The chase has been aborted
//        TextDrawDestroy(chaseTD_text[2]);
        chaseTD_text[2] = TextDrawCreate(166.000000,344.000000,"THE CHASE HAS BEEN ABORTED!");
        TextDrawAlignment(chaseTD_text[2],0);
        TextDrawBackgroundColor(chaseTD_text[2],0x000000ff);
        TextDrawFont(chaseTD_text[2],3);
        TextDrawLetterSize(chaseTD_text[2],0.899999,2.500000);
        TextDrawColor(chaseTD_text[2],0xff000099);
        TextDrawSetOutline(chaseTD_text[2],1);
        TextDrawSetProportional(chaseTD_text[2],1);
        TextDrawSetShadow(chaseTD_text[2],1);
        TextDrawShowForAll(chaseTD_text[2]);
    }
    return 1;
}

// CChase__TDDestroy
// Simple function -- destroys a textdraw element.
CChase__TDDestroy(id)
{
    TextDrawHideForAll(chaseTD_text[id]);
    TextDrawDestroy(chaseTD_text[id]);
    chaseTD_text[id] = Text:INVALID_TEXT_DRAW;
    return 1;
}

// CChase__TDShow
// This function is used to show/hide the textdraws for a certain amount of time.
CChase__TDShow(id, time)
{

    for(new i; i < 2; i++)
        CChase__TDDestroy(i);

    CChase__TDCreate(id);
    chaseData[3] = time;
    chaseData[4] = id;
    return 1;
}

// CChase__TDHide
// This function just destroys the textdraw -- but is kept in order to render it
// easy to upgrade the code to a better textdraw show/hide system in the future.
CChase__TDHide(id)
{
    CChase__TDDestroy(id);
    return 1;
}

// CChase__Process
// This function is executed every second, by LVP's main timer.
CChase__Process()
{

    // Make sure the chase is actually active..
    if(chaseData[0] == 0) return 0;

    // This check is for the end of the game timer
    if(chaseData[5] != -1) {
        if(chaseData[5] > 0) {
            // Game is starting to end.
            chaseData[5]--;
            return 1;
        } else {
            CChase__End();
            return 1;
        }
    }


    // Stuff for text draw timer
    if(chaseData[3] != -1)
    {
        if(chaseData[3] > 0)
        {
            chaseData[3]--;
        } else {
            CChase__TDHide(chaseData[4]);
            chaseData[3] = -1;
            chaseData[4] = -1;
        }
    }

    // Stuff for the main timer of the chase
    if(chaseData[2] > 0)
    {
        chaseData[2]--;
    } else {
        // Time's up!
        if( IsPlayerConnected(chaseData[1]) )
        {
            CChase__Stop(5, -1);
        }
    }

    // Check if the player is on the ship.
    CChase__CheckShip();
    return 1;
}

// CChase__End
// This function is executed right at the end of the cooldown period at the end
// of the chase. This is here so that the textdraws aren't destroyed straight
// after they're created, and also prevents the need to keep textdraws showing
// after the handler thinks the minigame is completely over.
CChase__End()
{
    // We have to wait a bit.
    CChase__TDHide(chaseData[4]);
    CChase__ResetVars( );
}

// CChase__CheckShip
// Run every second by the class' CChase__Process, this function checks if a
// player is on the ship, and if so throws them out.
CChase__CheckShip()
{
    // This function checks if the user is on the ship, and throws them off if so.
    new Float:fPosX, Float:fPosY, Float:fPosZ;
    GetPlayerPos( chaseData[1], fPosX, fPosY, fPosZ );
    if (( fPosX >= 2007.00 && fPosX <= 2025.47 && fPosY >= 1538.00 && fPosY <= 1551.00 ) ||     // ramp area
        ( fPosX >= 1994.00 && fPosX <= 2007.00 && fPosY >= 1515.00 && fPosY <= 1575.00 ) ) {
        // They're on!
        SetPlayerPos(chaseData[1],2033.8163,1544.3827,10.8203); // Set the pos in front..

        SetPlayerFacingAngle(chaseData[1],274.1228);            // And face them away!
        SendClientMessage(chaseData[1], COLOR_RED, "Stay away from the ship! That's simply lame!");
    }
}

// Initializes the colors of all players.
CChase__InitializeColorForPlayer() {
    new chasedPlayer = chaseData[1];
    for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
        if (Player(player)->isNonPlayerCharacter() == true || IsPlayerInMinigame(player))
            continue;

        new color = Color::NonPlayerCharacterColor;
        if (player == chasedPlayer)
            color = Color::Red;

        ColorManager->setPlayerOverrideColor(player, color);
    }
}

// Releases the colors of all players which we previously overrode.
CChase__ReleaseColorForPlayer() {
    for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
        if (Player(player)->isNonPlayerCharacter() == false)
            ColorManager->releasePlayerOverrideColor(player);
    }
}

/**
 * A small class to be able to add functionality to other parts of LVP without having to place them
 * outside this file.
 *
 * @author Xander "Xanland" Hoogland <home@xanland.nl>
 */
class Chase {
    /**
     * Sets the color of a player joining the server to white when there is a chase actually
     * running.
     *
     * @param playerId Id of the player who just connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        if(LegacyIsChaseRunning())
            ColorManager->setPlayerOverrideColor(playerId, Color::NonPlayerCharacterColor);
    }
}