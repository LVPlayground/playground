// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/******************************************************************************

    LAS VENTURAS PLAYGROUND v2.94 ALPHA 2

    This minigame consists of players spawning in the farm in LS
    and having an objective: Be the first to reach the top of the Haystack.

    The haystack consists of a few hay piles stacked up and moving
    to random positions. A neat little textdraw displays the players
    current level. 

    When a player wins the haystack, they are not ejected from the minigame. They
    can choose to continue mucking around or just planely /leave.

    Author: James "Jay" Wilkinson - 21st April 2011

    @package        Handlers
    @copyright      (c) Las Venturas Playground 2.94
    @version

*******************************************************************************/

#define     HAY_MINIMUM_SIGN_UPS    2       // How many people must there be before the minigame can start?

#define     HAY_SIGNUP_TIME         20      // How long should the signup phase last for (in seconds)
#define     HAY_OBJECTIVE_TIME      5       // How long should the objective screen show for (in seconds)

#define     HAY_VIRTUAL_WORLD       30       // Virtual world that Haystack should be in.



enum HAY_DATA
{
    hayState,
    haySignups,
    hayInitTime,
    hayObjTime,
    hayRank,
    hayStartTime,
    Text:hayDraw
}

enum HAY_PLAYER_DATA
{
    hayWeapons[12],
    hayAmmo[12],
    Float:hayHealth,
    Float:hayArmour,
    Float:hayPosX,
    Float:hayPosY,
    Float:hayPosZ,
    hayWorld,
    bool:hayPlayerSignedUp,
    Text:hayLevel

}

static  hayData[HAY_DATA];
static  hayPlayerData[MAX_PLAYERS][HAY_PLAYER_DATA];

// This function is called on several occasions and does different
// things depending on the state of the minigame. If the minigame is
// idle, it moves it to the signup phase and promotes the signup. If it's
// in the signup phase, it moves it into the running phase and spawns all players.
hayInitialize()
{
    if(hayGetState() == HAY_STATE_IDLE)
    {
        hayInitializeTextdraw(true);
        GameTextForAllEx("~y~Haystack~w~ is now signing up!~n~Want to join? ~r~/haystack~w~!", 5000, 5);

        haySetState(HAY_STATE_SIGNUP);
        hayData[hayInitTime] = Time->currentTime();
        return;
    }

    if(hayGetState() == HAY_STATE_SIGNUP)
    {
        // Before proceeding to start, check that we have enough signups.
        if(hayGetNumberOfSignups() < HAY_MINIMUM_SIGN_UPS)
        {
            hayEnd(true);
            return;
        }

        // Okay update some flags and lets get this thing started!
        haySetState(HAY_STATE_OBJECTIVE);

        // Get the timestamp in which this minigame entered the objective
        // state so we can check later when to spawn the player
        hayData[hayObjTime] = Time->currentTime();

        // Finally just spawn every player into the objective phase.
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!hayHasPlayerSignedUp(i))
            {
                continue;
            }

            haySavePlayerData(i);
            haySpawnPlayer(i);
        }
        return;
    }

    // Hay is in the objective phase. check if 5 seconds have passed
    // and if so obviously we need to spawn the player in the minigame and begin!
    if(hayGetState() == HAY_STATE_OBJECTIVE)
    {
        haySetState(HAY_STATE_RUNNING);

        // Get the start time here so we can calculate how long
        // it takes the player to reach the top.
        hayData[hayStartTime] = GetTickCount();

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(hayHasPlayerSignedUp(i))
            {
                TogglePlayerControllable(i, true);
                GameTextForPlayer(i, "~g~Go!", 5000, 5);
                PlayerPlaySound(i, 1057, 0, 0, 0);
                haySpawnPlayer(i);
            }
            else
            {
                continue;
            }
        }
    }
}


// We may have to end the minigame too.
// Sign every player out, restore their position etc and reset the data.
hayEnd(bool:n_NotEnoughSignups = false)
{

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!hayHasPlayerSignedUp(i))
        {
            continue;
        }

        hayRemovePlayer(i);

        if(n_NotEnoughSignups == true)
            ShowBoxForPlayer(i, "Not enough players have signed up for HayStack. You have been refunded.");
    }
    hayResetData();
}


// This handles creation and destroying of the main hay textdraw
hayInitializeTextdraw(bool:init = true)
{

    if(init == true)
    {
        if(hayData[hayDraw] != Text:INVALID_TEXT_DRAW)
        {
            if(hayData[hayDraw] != Text:0)
            {
                TextDrawDestroy(hayData[hayDraw]);
            }
        }

        hayData[hayDraw] = TextDrawCreate(17.000000, 207.000000, "Haystack");
        TextDrawBackgroundColor(hayData[hayDraw], 255);
        TextDrawFont(hayData[hayDraw], 0);
        TextDrawLetterSize(hayData[hayDraw], 0.820000, 3.500000);
        TextDrawColor(hayData[hayDraw], 16777215);
        TextDrawSetOutline(hayData[hayDraw], 0);
        TextDrawSetProportional(hayData[hayDraw], 1);
        TextDrawSetShadow(hayData[hayDraw], 1);
    }
    else
    {
        TextDrawDestroy(hayData[hayDraw]);
        hayData[hayDraw] = Text:INVALID_TEXT_DRAW;
    }
}

// This handler creation and destroying of the player level textdraw
hayInitializePlayerTextdraw(playerid, bool:init)
{
    if(init == true)
    {
        if(hayPlayerData[playerid][hayLevel] != Text:INVALID_TEXT_DRAW)
        {
            if(hayPlayerData[playerid][hayLevel] != Text:0)
            {
                TextDrawDestroy(hayPlayerData[playerid][hayLevel]);
            }
        }

        hayPlayerData[playerid][hayLevel] = TextDrawCreate(34.000000, 241.000000, "~w~Level: ~r~Loading..");
        TextDrawBackgroundColor(hayPlayerData[playerid][hayLevel], 255);
        TextDrawFont(hayPlayerData[playerid][hayLevel], 3);
        TextDrawLetterSize(hayPlayerData[playerid][hayLevel], 0.509999, 1.7);
        TextDrawColor(hayPlayerData[playerid][hayLevel], -1);
        TextDrawSetOutline(hayPlayerData[playerid][hayLevel], 0);
        TextDrawSetProportional(hayPlayerData[playerid][hayLevel], 1);
        TextDrawSetShadow(hayPlayerData[playerid][hayLevel], 1);
        TextDrawShowForPlayer(playerid, hayPlayerData[playerid][hayLevel]);
    }
    else
    {
        if(hayPlayerData[playerid][hayLevel] != Text:INVALID_TEXT_DRAW)
        {
            if(hayPlayerData[playerid][hayLevel] != Text:0)
            {
                TextDrawDestroy(hayPlayerData[playerid][hayLevel]);
            }
        }
        hayPlayerData[playerid][hayLevel] = Text:INVALID_TEXT_DRAW;
    }
}

// This is called every second from LVPs main timers to update the hay level
// information textdraw
hayUpdatePlayerTextdraw(playerid)
{
    if(!hayHasPlayerSignedUp(playerid))
    {
        return;
    }

    if(hayPlayerData[playerid][hayLevel] == Text:INVALID_TEXT_DRAW)
    {
        return;
    }

    new szMsg[32];
    format(szMsg, 32, "~w~Level: ~r~%d", hayGetPlayerLevel(playerid));
    TextDrawSetString(hayPlayerData[playerid][hayLevel], szMsg);
}

// This function is called every second to check if a player
// has reached the top of the haystack.
hayCheckFinish(playerid)
{
    if(!hayHasPlayerSignedUp(playerid))
    {
        return;
    }



    // Alright, the player has reached the top of the
    // haystack! Whipee!
    if(hayGetPlayerLevel(playerid) == HAY_HEIGHT_Z + 1)
    {
        // Increase the number of players that have finished the haystack by 1
        // so we can calculate the rank this player has finished.
        hayData[hayRank]++;

        new
            szMsg[128];

        // We have a winner!
        if(hayGetNumberOfFinishedPlayers() == 1)
        {
            // Increase the amount of minigames the player has won
            WonMinigame[ playerid ]++;

            format(szMsg, 128, "~n~~g~!!Winner!!~n~~b~%s~w~ has reached the top of the ~y~Haystack~w~!", PlayerName(playerid));

            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(!hayHasPlayerSignedUp(i))
                {
                    continue;
                }
                PlayerPlaySound(i, 1057, 0, 0, 0);
                GameTextForPlayer(i, szMsg, 5000, 5);
            }
        }
        else
        {
            format(szMsg, 128, "* %s has finished the Haystack in %.2f seconds, rank %d.", PlayerName(playerid), floatdiv( GetTickCount() - hayData[hayStartTime], 1000 ), hayGetNumberOfFinishedPlayers());

            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if(!hayHasPlayerSignedUp(i))
                {
                    continue;
                }
                SendClientMessage(i, Color::White, szMsg);
            }
        }

        hayRemovePlayer(playerid);
        format(szMsg, sizeof(szMsg), "~r~~h~%s~w~ has reached the top of the haystack in ~p~%.2f seconds~w~!",
            Player(playerid)->nicknameString(), floatdiv(GetTickCount() - hayData[hayStartTime], 1000));
        NewsController->show(szMsg);
        return;
    }
}




// This function returns the current level of haystacks the player is on.
hayGetPlayerLevel(playerid)
{
    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ;

    GetPlayerPos(playerid, fPosX, fPosY, fPosZ);

    if (fPosX <= 2.0 && fPosX >= -15.0 && fPosY <= 2.0 && fPosY >= -15.0)
    {
        return floatround( fPosZ / 3 - 1);
    }
    return 0;
}

// This is called every second from LVPs main timers to
// check to start the minigame.
hayProcess()
{

    // Has the 25 second signup phase passed? start the minigame if so.
    if(hayGetState() == HAY_STATE_SIGNUP)
    {
        if(Time->currentTime() - hayData[hayInitTime] > HAY_SIGNUP_TIME)  // yey, 25 secs passed - start the minigame.
        {
            hayInitialize();
            return;
        }
    }

    // Has the five second "objective" phase passed?
    if(hayGetState() == HAY_STATE_OBJECTIVE)
    {
        if(Time->currentTime() - hayData[hayObjTime] > HAY_OBJECTIVE_TIME)
        {
            hayInitialize();
            return;
        }
    }

    if (hayGetState() != HAY_STATE_IDLE) {
        new signUps = 0;

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
            if (hayHasPlayerSignedUp(i))
                signUps++;
        }

        if (signUps == 0)
            hayResetData();
    }
}

// Again this is called every second from LVPs main timer
// However, it's called in the loop so we can pass the playerid
// arguement across functions for more efficiency.
hayPlayerProcess(playerid)
{
    hayUpdatePlayerTextdraw(playerid);
    hayCheckFinish(playerid);
}

// This is called when the minigame ends and obviously resets all associated data.
hayResetData()
{
    hayData[haySignups] = 0;
    hayData[hayInitTime] = 0;
    hayData[hayObjTime] = 0;
    hayData[hayRank] = 0;
    hayData[hayStartTime] = 0;
    haySetState(HAY_STATE_IDLE);
    hayInitializeTextdraw(false);
}


// This is called when a player types the /haystack command
hayOnCommand(playerid)
{
    new szMsg[128];

    if(IsPlayerInMinigame(playerid) || !IsPlayerMinigameFree(playerid))
    {
        format(szMsg, 128, "* You have already signed up for the %s minigame.", GetPlayerMinigameName(playerid));
        SendClientMessage(playerid, Color::Red, szMsg);
        return 1;
    }

    new const price = GetEconomyValue(MinigameParticipation);

    if(GetPlayerMoney(playerid) < price)
    {
        format(szMsg, 128, "* You need $%s to signup for Haystack.", formatPrice(price));
        SendClientMessage(playerid, Color::Red, szMsg);
        return 1;
    }

    if(hayGetState() > HAY_STATE_SIGNUP)
    {
        SendClientMessage(playerid, Color::Red, "* Haystack is already running. Try again later.");
        return 1;
    }

    TakeRegulatedMoney(playerid, MinigameParticipation);

    if (hayGetState() == HAY_STATE_IDLE) {
        hayInitialize();
        Announcements->announceMinigameSignup(HayStackMinigame, "HayStack", "/haystack", price, playerid);
    }
    Responses->respondMinigameSignedUp(playerid, HayStackMinigame, "HayStack", HAY_SIGNUP_TIME);

    format(szMsg, sizeof(szMsg), "~r~~h~%s~w~ has signed up for ~y~HayStack~w~ (~p~/haystack~w~)", Player(playerid)->nicknameString());
    NewsController->show(szMsg);

    format(szMsg, 128, "%s (Id:%d) has signed up for /haystack.", PlayerName(playerid), playerid);
    Admin(playerid, szMsg);

    haySignPlayerUp(playerid);
    return 1;
}

// This function is called from OnPlayerSelectedMenuRow
// and, obviously, triggers the signup/startup phase.
hayMenuActivate(playerid)
{
    hayOnCommand(playerid);
}

// Sign the player up for the minigame obviously.
haySignPlayerUp(playerid)
{
    hayData[haySignups]++;
    hayPlayerData[playerid][hayPlayerSignedUp] = true;
}

// This function spawns a player in front of the haystack.
// depending on the current state it will put them in the screen
// which shows the objective in the textdraw or it will spawn them directly
// in the minigame.
haySpawnPlayer(playerid)
{
    ResetPlayerWeapons(playerid);


    hayInitializePlayerTextdraw(playerid, true);
    TextDrawShowForPlayer(playerid, hayData[hayDraw]);

    SetPlayerVirtualWorld(playerid, HAY_VIRTUAL_WORLD);
    SetPlayerPos(playerid, 35.0, 6.5, 3.2);
    SetPlayerFacingAngle(playerid, 135.1425);

    SetPlayerArmour(playerid, 0);
    SetPlayerHealth(playerid, 100);

    Streamer_Update(playerid);

    if(hayGetState() == HAY_STATE_OBJECTIVE)
    {
        TogglePlayerControllable(playerid,0);
        SetPlayerCameraPos(playerid, 32.9946,47.2079,78.5389);
        SetPlayerCameraLookAt(playerid, -5.6487,1.4449,50.5060);
        GameTextForPlayer(playerid, "~n~~n~~n~~n~~n~~y~Haystack:~n~~w~Be the first to reach the top!", 5000, 5);
        return;
    }
    else
    {
        SetCameraBehindPlayer(playerid);
    }
}

// This function is called from OnPlayerSpawn
// to check if we need to handle this spawn for the player.
hayOnPlayerSpawn(playerid)
{
    if(hayHasPlayerSignedUp(playerid) && hayGetState() >= HAY_STATE_OBJECTIVE)
    {
        haySpawnPlayer(playerid);
        ShowBoxForPlayer(playerid, "Use /leave to leave HayStack.");
        return 1;
    }
    return 0;
}


// Remove the player from the actual minigame-  reset relevant data
// and restore their position ett
hayRemovePlayer(playerid)
{
    if(!hayHasPlayerSignedUp(playerid))
    {
        return;
    }

    hayData[haySignups]--;
    hayPlayerData[playerid][hayPlayerSignedUp] = false;
    hayInitializePlayerTextdraw(playerid, false);

    TextDrawHideForPlayer(playerid, hayData[hayDraw]);

    // Only restore their position if the minigame
    // is running.
    if(hayGetState() >= HAY_STATE_OBJECTIVE)
    {
        hayLoadPlayerData(playerid);
    }
    else
    {   // Player signed out so give them a refund
        GiveRegulatedMoney(playerid, MinigameParticipation);
    }

    // Check to end the minigame if not enough people
    // are taking part.
    if(hayGetNumberOfSignups() < HAY_MINIMUM_SIGN_UPS)
        hayEnd();
}


// This is called from OnPlayerDisconnect
// Resets all relevant data for haystack when a player leaves the minigame
hayResetPlayerData(playerid)
{
    if(!hayHasPlayerSignedUp(playerid))
    {
        return;
    }
    hayData[haySignups]--;
    hayPlayerData[playerid][hayPlayerSignedUp] = false;
    hayInitializePlayerTextdraw(playerid, false);

}

// Is the player taking part in the minigame?
hayHasPlayerSignedUp(playerid)
{
    return hayPlayerData[playerid][hayPlayerSignedUp];
}

// This is called from OnPlayerKeyStateChange
// to check for when a player punches during the minigame
hayOnPlayerPunch(playerid, newkeys, oldkeys)
{
    if(!hayHasPlayerSignedUp(playerid))
    {
        return 0;
    }

    if(hayGetState() != HAY_STATE_RUNNING)
    {
        return 0;
    }


    if(PRESSED(KEY_FIRE) || PRESSED(KEY_SECONDARY_ATTACK))
    {
        ClearAnimations(playerid, 1);
        return 1;
    }

    return 0;
}

// When a player signs up for the minigame, prior to teleporting them
// we have to save their data such as pos and weapons to restore it later when
// they sign out of the minigame or leave.
haySavePlayerData(playerid)
{
    GetPlayerPos(playerid, hayPlayerData[playerid][hayPosX], hayPlayerData[playerid][hayPosY], hayPlayerData[playerid][hayPosZ]);

    GetPlayerHealth(playerid, hayPlayerData[playerid][hayHealth]);
    GetPlayerArmour(playerid, hayPlayerData[playerid][hayArmour]);



    hayPlayerData[playerid][hayWorld] = GetPlayerVirtualWorld(playerid);

    for(new i = 0; i < 12; i++)
    {
        GetPlayerWeaponData(playerid, i, hayPlayerData[playerid][hayWeapons][i], hayPlayerData[playerid][hayAmmo][i]);
    }
}


// As above, we load the player data when they leave the minigame
hayLoadPlayerData(playerid)
{
    SetPlayerPos(playerid, hayPlayerData[playerid][hayPosX], hayPlayerData[playerid][hayPosY], hayPlayerData[playerid][hayPosZ]);

    SetPlayerHealth(playerid, hayPlayerData[playerid][hayHealth]);
    SetPlayerArmour(playerid, hayPlayerData[playerid][hayArmour]);

    SetPlayerVirtualWorld(playerid, hayPlayerData[playerid][hayWorld]);

    TogglePlayerControllable(playerid, true);

    // Restore their saved weapons
    for(new i = 0; i < 12; i++)
    {
        GiveWeapon(playerid, hayPlayerData[playerid][hayWeapons][i], hayPlayerData[playerid][hayAmmo][i]);
    }

    SetCameraBehindPlayer(playerid);
}


hayGetState()
{
    return hayData[hayState];
}


haySetState(iState)
{
    hayData[hayState] = iState;
}


hayGetNumberOfSignups()
{
    return hayData[haySignups];
}

// Return the number of players that have finished this minigame.
hayGetNumberOfFinishedPlayers()
{
    return hayData[hayRank];
}