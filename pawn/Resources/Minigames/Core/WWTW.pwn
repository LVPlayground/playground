// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*      Las Venturas Playground 3.0 - New Team Walkies Weapon War Minigame      *
*                                                                              *
*   LVP 3.0 introduces a few new minigames, including a new team war one.      *
*   Both teams spawn in Big Smokes Crack Denn, and the objective is to         *
*   get rid of the other team by killing them. First team that manages         *
*   to do that wins, obviously.                                                *
*                                                                              *
*   Author: Matthias                                                           *
*   Email: matthiasvaneeghem@hotmail.com                                       *
*******************************************************************************/

// Important defines

#define WWTW_TIMELIMIT 420               // How long does the minigame go on? 7 minutes.
#define WWTW_TEAMATTACK 0                // Attack team ID
#define WWTW_TEAMDEFEND 1                // Defend team ID
#define WWTW_STATE_NONE 0                // WWTW Status: Not playing.
#define WWTW_STATE_SIGNUP 1              // WWTW Status: Signup
#define WWTW_STATE_PLAYING 2             // WWTW Status: Zamg, people actually play this.
#define WWTW_MINPLAYERS 2                // Min people that can join
#define WWTW_MAXPLAYERS 10               // Max people that can join
#define WWTW_SIGNUPTIME 20               // How many seconds players have until the minigame starts
#define WWTW_VWORLD 386                  // Virtual world for this minigame.
#define WWTW_WINMONEY 5000*iSignupCount  // how much the winners actually get in $

// Variables!
static aTeamCount[2];
static iMinigameState; // 0 - Not active, 1 - signup, 2 - playing
static iSignupCount;

// CWWTW__Initialize
// This is run at OnGameModeInit, resetting some vars.
CWWTW__Initialize()
{
    aTeamCount[0] = 0;
    aTeamCount[1] = 0;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        CWWTW__ResetPlayerVars(i);

    iSignupCount = 0;
    iMinigameState = WWTW_STATE_NONE;

    CreateDynamicObject(985, 2543.9406738281, -1315.6827392578, 1032.0218505859, 0.000000, 0.000000, 180);
    return 1;
}

// CWWTW__PlayerLeft
// Called when a player /leave's.
CWWTW__PlayerLeft( iPlayerID )
{
    CWWTW__ReleaseMarkersForPlayer(iPlayerID);

    WWTW_PlayerData[iPlayerID][iStatus] = WWTW_STATE_NONE;
    iSignupCount--;
    GivePlayerMoney(iPlayerID, 250);
    return 1;
}

// CWWTW__ResetPlayerVars
// Clears player data arrays for a player
CWWTW__ResetPlayerVars( iPlayerID )
{
    ResetPlayerGameStateVariables(iPlayerID);

    WWTW_PlayerData[iPlayerID][iStatus] = 0;
    WWTW_PlayerData[iPlayerID][iPlayerTeam] = 0;
    return 1;
}

// CWWTW__OnCommand
// When someone types /wwtw, we let them join into the game here.
CWWTW__OnCommand(playerid)
{
    if(iMinigameState == WWTW_STATE_PLAYING)
    {
        // People are playing already.
        SendClientMessage(playerid, COLOR_RED, "This minigame is currently underway. Please wait, and try again later.");
        return 1;

    }
    else if(WWTW_PlayerData[playerid][iStatus] == WWTW_STATE_SIGNUP)
    {
        // Signed up already
        SendClientMessage(playerid, COLOR_RED, "You've already signed up for this minigame!");
        return 1;

    }
    else if(!IsPlayerMinigameFree(playerid))
    {
        // Signed up with a different minigame
        SendClientMessage(playerid,COLOR_RED,"You've already signed up with a different minigame.");
        return 1;
    }

    if(iSignupCount == WWTW_MAXPLAYERS)
    {
        // Too many people playing already.
        SendClientMessage(playerid, COLOR_RED, "This minigame is full. Please wait, and try again later.");
        return 1;
    }

    if(GetPlayerMoney(playerid) < 250)
    {
        // Poor player is poor.
        SendClientMessage(playerid, COLOR_RED, "You need $250 to sign up for this minigame!");
        return 1;
    }

    if(iMinigameState == WWTW_STATE_NONE)
    {
        SetTimer("WWTW__CheckTimer", WWTW_SIGNUPTIME * 1000, false);
        iMinigameState = WWTW_STATE_SIGNUP;

        Announcements->announceMinigameSignup(WalkiesWeaponsTeamWarMinigame,
            "Walkies Weapons Team War", "/wwtw", 250, playerid);
        GameTextForAllEx("~y~Walkies Weapons Team War~w~ is now signing up!~n~Want to join? ~r~/wwtw~w~!", 5000, 5);
    }

    new string[128];
    format(string, sizeof(string), "%s (Id:%d) has signed up for /wwtw.", PlayerName(playerid), playerid);
    Admin(playerid, string);

    Responses->respondMinigameSignedUp(playerid, WalkiesWeaponsTeamWarMinigame, "Walkies Weapons Team War", WWTW_SIGNUPTIME);
    format(string, sizeof(string), "~r~~h~%s~w~ has signed up for ~y~Walkies Weapons Team War~w~ (~p~/wwtw~w~)", Player(playerid)->nicknameString());
    NewsController->show(string);

    iSignupCount++;
    GivePlayerMoney(playerid, -250);
    WWTW_PlayerData[playerid][iStatus] = WWTW_STATE_SIGNUP;
    return 1;
}

// CWWTW__MenuActivate
// When someone picks this minigame from the /minigames menu
CWWTW__MenuActivate(playerid)
{
    // Best way of doing it;
    CWWTW__OnCommand(playerid);
}

// CWWTW__OnText
// Called in OnPlayerText
CWWTW__OnText(playerid, text[])
{
    // He's not taking part of the minigame
    if(WWTW_PlayerData[playerid][iStatus] != WWTW_STATE_PLAYING ) return 0;

    if(!strcmp(text[0], "!", true, 1))
    {
        // Team chat here
        new string[256], sTeamName[7];
        new iTeamID = WWTW_PlayerData[playerid][iPlayerTeam];
        if(iTeamID == 0) sTeamName = "Attack"; else sTeamName = "Defend";
        format(string, 256, "* [Team %s] %s: %s", sTeamName, PlayerName(playerid), text[1]);
        CWWTW__SendTeamMsg(iTeamID, COLOR_LIGHTBLUE, string);
        return 1;
    }

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(WWTW_PlayerData[i][iStatus] == WWTW_STATE_PLAYING) SendPlayerMessageToPlayer(i, playerid, text);
    }
    return 1;
}

// WWTW__Disconnect
// Called in OnPlayerDisconnect obviously
CWWTW__OnDisconnect(playerid)
{
    if(WWTW_PlayerData[playerid][iStatus] > WWTW_STATE_NONE)
        CWWTW__OnExit(playerid, 0);
}

// WWTW_CheckTimer()
// This is called as soon as someone starts the minigame.
forward WWTW__CheckTimer();
public WWTW__CheckTimer()
{
    if(iSignupCount < WWTW_MINPLAYERS)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(WWTW_PlayerData[i][iStatus] == WWTW_STATE_SIGNUP)
            {
                // We must let them know.
                ShowBoxForPlayer(i, "Not enough players have signed up for Walkies Weapons Team War. You have been refunded.");
                GivePlayerMoney(i, 250);
            }
        }
        CWWTW__Initialize();
    }
    else
    {
        CWWTW__Start();
    }
    return 1;
}

// CWWTW__Start
// We start the minigame -- split into teams, set colours etc.
CWWTW__Start()
{
    iMinigameState = WWTW_STATE_PLAYING;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(WWTW_PlayerData[i][iStatus] == WWTW_STATE_SIGNUP)
        {
            new iTeamID;
            if(aTeamCount[WWTW_TEAMATTACK] == aTeamCount[WWTW_TEAMDEFEND])
            {
                // Teamcount is equal, random team
                iTeamID = random(2);
            }
            else
            {
                if(aTeamCount[WWTW_TEAMATTACK] > aTeamCount[WWTW_TEAMDEFEND])
                {
                    // Attack team is bigger, make him a defender
                    iTeamID = WWTW_TEAMDEFEND;
                }
                else
                {
                    // The other way around
                    iTeamID = WWTW_TEAMATTACK;
                }
            }

            aTeamCount[iTeamID]++;

            SetPlayerTeam(i, iTeamID);
            WWTW_PlayerData[i][iPlayerTeam] = iTeamID;
            WWTW_PlayerData[i][iStatus] = WWTW_STATE_PLAYING;

            EnablePlayerInteriorWeapons(i, 2); // Allow them to fight inside
            SendClientMessage(i, COLOR_PINK, "* Use the ! prefix to talk to your team.");

            CWWTW__SavePos(i);
            CWWTW__SpawnPlayer(i);
            ClearPlayerMenus(i);
        }
    }

    CWWTW__InitializeMarkersForPlayer();

    return 1;
}

// CWWTW__End
// Some shizzle needs resetting @ the end of the minigame.
CWWTW__End(iWinningTeam)
{
    if(iMinigameState == 0) return 0;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(WWTW_PlayerData[i][iStatus] != WWTW_STATE_PLAYING) continue;
        if(WWTW_PlayerData[i][iPlayerTeam] == iWinningTeam)
        {
            GivePlayerMoney(i, WWTW_WINMONEY);
        }
        CWWTW__LoadPos(i);
        CWWTW__ResetPlayerVars(i);
        SetPlayerTeam(i, NO_TEAM);
        DisablePlayerInteriorWeapons(i, 2);
        CWWTW__ResetPlayerVars(i);
        CWWTW__ReleaseMarkersForPlayer(i);
    }

    CWWTW__Initialize();
    return 1;
}

// CWWTW__OnExit
// When someone leaves via /leave any time
CWWTW__OnExit(playerid, iReason)
{
    // iReason:
    // 0 - disconnect
    // 1 - bam, he's dead
    iSignupCount--;

    new iTeamID = WWTW_PlayerData[playerid][iPlayerTeam];
    aTeamCount[ iTeamID ] --;

    if(iReason == 1)
    {
        CWWTW__ReleaseMarkersForPlayer(playerid);

        CWWTW__LoadPos(playerid);
        CWWTW__ResetPlayerVars(playerid);
        SetPlayerTeam(playerid, NO_TEAM);
        DisablePlayerInteriorWeapons(playerid, 2);

        if(aTeamCount[ iTeamID ] == 0)
        {
            // the team is empty! other team wins!
            if(iTeamID == WWTW_TEAMATTACK)
            {
                SendClientMessageToAllEx(COLOR_YELLOW, "* No players left in the Attack Team, the defenders win the minigame!");
                CWWTW__End(WWTW_TEAMDEFEND);
                return 1;
            }
            else
            {
                SendClientMessageToAllEx(COLOR_YELLOW, "* No players left in the Defend Team, the attackers win the minigame!");
                CWWTW__End(WWTW_TEAMATTACK);
                return 1;
            }
        }
    }
    else
    {
        if(WWTW_PlayerData[playerid][iStatus] == WWTW_STATE_SIGNUP)
        {
            ShowBoxForPlayer(playerid, "Not enough players have signed up for Walkies Weapons Team War. You have been refunded.");
            GivePlayerMoney(playerid, 250);
            return 1;
        }
        else
        {
            // They're playing.
            CWWTW__ReleaseMarkersForPlayer(playerid);

            CWWTW__LoadPos(playerid);
            CWWTW__ResetPlayerVars(playerid);
            SetPlayerTeam(playerid, NO_TEAM);
            DisablePlayerInteriorWeapons(playerid, 2);

            if(aTeamCount[ iTeamID ] == 0)
            {
                CWWTW__ResetPlayerVars(playerid);

                // the team is empty! other team wins!
                if(iTeamID == WWTW_TEAMATTACK)
                {
                    SendClientMessageToAllEx(COLOR_YELLOW, "* No players left in the Attack Team, the defenders win the minigame!");
                    CWWTW__End(WWTW_TEAMDEFEND);
                    return 1;
                }
                else
                {
                    SendClientMessageToAllEx(COLOR_YELLOW, "* No players left in the Defend Team, the attackers win the minigame!");
                    CWWTW__End(WWTW_TEAMATTACK);
                    return 1;
                }
            }
        }
    }
    return 1;
}


// CWWTW__SendTeamMsg
// This sends a message to a team
CWWTW__SendTeamMsg(iTeamID, sHex, sMessage[])
{
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(WWTW_PlayerData[i][iStatus] == WWTW_STATE_PLAYING && WWTW_PlayerData[i][iPlayerTeam] == iTeamID)
        {
            SendClientMessage(i, sHex, sMessage);
        }
    }
    return 1;
}

// Initializes the markers of other players so they can't see the other team.
CWWTW__InitializeMarkersForPlayer() {
    for (new contestentId = 0; contestentId <= PlayerManager->highestPlayerId(); ++contestentId) {
        if (WWTW_PlayerData[contestentId][iStatus] != WWTW_STATE_PLAYING)
            continue;

        if (WWTW_PlayerData[contestentId][iPlayerTeam] == WWTW_TEAMATTACK)
            ColorManager->setPlayerMinigameColor(contestentId, Color::MinigameTransparentRed);

        if (WWTW_PlayerData[contestentId][iPlayerTeam] == WWTW_TEAMDEFEND)
            ColorManager->setPlayerMinigameColor(contestentId, Color::MinigameTransparentBlue);
    }
}

// Releases the markers of all other players which we previously overrode.
CWWTW__ReleaseMarkersForPlayer(contestentId) {
    if (WWTW_PlayerData[contestentId][iStatus] == WWTW_STATE_PLAYING)
        ColorManager->releasePlayerMinigameColor(contestentId);
}

// CWWTW__OnDeath
// Called in OnPlayerDeath
CWWTW__OnDeath(playerid)
{
    CWWTW__OnExit(playerid, 1);
    return 1;
}

// CWWTW__SavePos
// Saves the position and weapons of a player when they joined the minigame!
CWWTW__SavePos(playerid)
{
    SavePlayerGameState(playerid);
}

// CWWTW__SpawnPlayer
// Spawns the player in the correct place
CWWTW__SpawnPlayer(playerid)
{
    SetPlayerInterior(playerid, 2);
    if(WWTW_PlayerData[playerid][iPlayerTeam] == WWTW_TEAMDEFEND)
    {
        SetPlayerPos(playerid, 2547.7571,-1296.1005,1054.6406);
        SetPlayerSkinEx(playerid, 104);
    }
    if(WWTW_PlayerData[playerid][iPlayerTeam] == WWTW_TEAMATTACK)
    {
        SetPlayerPos(playerid, 2541.4524,-1318.5604,1031.4219);
        SetPlayerSkinEx(playerid, 105);
    }


    SetPlayerHealth(playerid, 100);
    SetPlayerArmour(playerid, 100);

    ResetPlayerWeapons(playerid);
    GiveWeapon(playerid, 24, 999);
    GiveWeapon(playerid, 27, 999);
    GiveWeapon(playerid, 29, 999);
    GiveWeapon(playerid, 31, 999);
    GiveWeapon(playerid, 34, 999);
    return 1;
}

// CWWTW__LoadPos
// Puts the player back to their previous state.
CWWTW__LoadPos(playerid)
{
    // First it's easiest to simply respawn them
    OnPlayerSpawn(playerid);

    LoadPlayerGameState(playerid);
    return 1;
}