// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/******************************************************************************

    Las Venturas Playground v2.92.9 - Run Weapons team war


    Two teams, Reds vs Blues. Teams spawn in San Fierro Airport facing eachother.

    First team to score whatever is defined by the minigame starter.


    2nd October 2010 - James "Jay" Wilkinson

*******************************************************************************/


#define     RW_MIN_KILLS            5
#define     RW_MAX_KILLS            50

#define     RW_START_TIME           20000       // How many seconds after the initial signup does it take for the minigame start? (milliseconds)

#define     RW_MIN_PLAYER_COUNT     4

#define     RW_STATE_NONE           0
#define     RW_STATE_SIGNUP         1
#define     RW_STATE_COUNTDOWN      2
#define     RW_STATE_RUNNING        3       // Note: IsPlayerInMinigame doesn't use this define but the value of it, so be careful if changing.

#define     RW_COUNTDOWN_SECONDS    5

#define     RW_VIRTUAL_WORLD        7846373

#define     RW_TEAM_RED             10
#define     RW_TEAM_BLUE            20

#define     RW_RED_COLOUR           Color::Red
#define     RW_BLUE_COLOUR          COLOR_BLUE

#define     RW_BLUE_SKIN            230
#define     RW_RED_SKIN             212

enum    E_RW_DATA
{
    rwState,
    rwKills,
    rwBlueKills,
    rwRedKills,
    rwInitTime,
    rwCountdown,
    rwMaxScore,
    rwSignupCount,
    rwRedTeamCount,
    rwBlueTeamCount,
    Text:rwScoreText
}

static  rwData[E_RW_DATA];

enum    E_RW_PLAYER_DATA
{
    bool:rwPlayerSignedUp,
    rwPlayerTeam,
    rwTeamSignupID,
    rwPlayerKills,
    rwPlayerDeaths,
    rwSignupWorld,
    Float:rwSignupPos[4],
    rwSignupWeap[12],
    rwSignupAmmo[12],
    rwSignupSkin
}

static  rwPlayerData[MAX_PLAYERS][E_RW_PLAYER_DATA];

static  n_RwMap[2] = {INVALID_OBJECT_ID, ...};              // Store the data for the RW map objects
static  DynamicObject: n_RwDynamicMap[2] = {DynamicObject: INVALID_OBJECT_ID, ...};       // Because of a SA:MP bug we have to also create the map using Dynamic objects

static  n_TeamAssignment;                           // Team balancer.

// Initialize the minigame, whether it being to proceed to the signup
// phase or to start the actual game.
rwInitialize(n_MaxScore = 0)
{
    // Minigame is not running. Initialize it and give players 20 seconds
    // to signup.
    if(rwGetState() == RW_STATE_NONE)
    {
        if(n_MaxScore == 0)
        {
            print("[RWTW]: Error starting: No maximum score defined upon initial initialization.");
            return;
        }

        rwResetData();

        rwSetState(RW_STATE_SIGNUP);

        rwData[rwInitTime] = GetTickCount();

        rwSetMaxScore(n_MaxScore);

        return;
    }

    // Minigame is in signup phase. 20 seconds have passed - start the minigame but don't forget the countdown first.
    else if(rwGetState() == RW_STATE_SIGNUP)
    {
        if(rwGetPlayerCount() < RW_MIN_PLAYER_COUNT)
        {
            rwEnd();
            return;
        }

        // Reset the timestamp so that this doesn't get called repeatatively.
        rwData[rwInitTime] = 0;

        rwSetState(RW_STATE_COUNTDOWN);

        // Initialize the map of course
        rwInitializeMap();

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!rwIsPlayerSignedUp(i))
                continue;

            rwSpawnPlayer(i);
        }
        return;
    }

    // Okay, the minigame has been initialized from its countdown
    // phase. That means the countdown has finished and the
    // minigame can actually start.
    else if(rwGetState() == RW_STATE_COUNTDOWN)
    {
        rwSetState(RW_STATE_RUNNING);

        rwUpdateTextdraw();

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!rwIsPlayerSignedUp(i))
            {
                continue;
            }

            TogglePlayerControllable(i, true);
            SetCameraBehindPlayer(i);

            if(rwGetPlayerTeam(i) == RW_TEAM_BLUE)
            {
                SetPlayerSkinEx(i, RW_BLUE_SKIN);
            }
            else
            {
                SetPlayerSkinEx(i, RW_RED_SKIN);
            }
        }
        return;
    }
    else
    {
        rwEnd();
    }
}

// End RWTW with the specified reason
rwEnd()
{
    if(rwGetState() == RW_STATE_NONE)
    {
        return;
    }

    new Float:ratio, message[128];

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!rwIsPlayerSignedUp(i))
        {
            continue;
        }

        // If this minigame could not start because enough
        // players haven't signed up, issue a refund.
        if(rwGetState() == RW_STATE_SIGNUP)
        {
            ShowBoxForPlayer(i, "Not enough players have signed up for Run Weapons Team War. You have been refunded.");
            ClearPlayerMenus(i);
        }

        if(rwGetState() == RW_STATE_RUNNING)
        {
            if(rwPlayerData[i][rwPlayerDeaths] == 0)
            {
                ratio = 1.0;
            }
            else
            {
                ratio = floatdiv(rwPlayerData[i][rwPlayerKills], rwPlayerData[i][rwPlayerDeaths]);
            }
            format(message, 128, "You killed %d people and died %d times (Ratio: %.2f) in RWTW.", rwPlayerData[i][rwPlayerKills], rwPlayerData[i][rwPlayerDeaths], ratio);
            ShowBoxForPlayer(i, message);
        }

        rwRemovePlayerFromMinigame(i);
    }

    rwResetData();
}

rwInitializeTextdraw()
{
    if(rwData[rwScoreText] != Text:INVALID_TEXT_DRAW)
    {
        TextDrawDestroy(rwData[rwScoreText]);
        rwData[rwScoreText] = Text:INVALID_TEXT_DRAW;
    }

    rwData[rwScoreText] = TextDrawCreate(482, 311, "Loading...");
    TextDrawBackgroundColor(rwData[rwScoreText], 255);
    TextDrawFont(rwData[rwScoreText], 2);
    TextDrawLetterSize(rwData[rwScoreText], 0.33, 1.5);
    TextDrawColor(rwData[rwScoreText], -1);
    TextDrawSetOutline(rwData[rwScoreText], 1);
    TextDrawSetProportional(rwData[rwScoreText], 1);
}

rwUpdateTextdraw()
{
    rwInitializeTextdraw();

    new szTextdraw[128];
    format(szTextdraw, 128, "~r~Red Team:~w~ %d/%d~n~~n~~b~Blue Team:~w~ %d/%d", rwGetScore(RW_TEAM_RED), rwGetMaxScore(), rwGetScore(RW_TEAM_BLUE), rwGetMaxScore());
    TextDrawSetString(rwData[rwScoreText], szTextdraw);

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!rwIsPlayerSignedUp(i))
        {
            continue;
        }
        TextDrawShowForPlayer(i, rwData[rwScoreText]);
    }
}


// Initialize the map of course when we start the minigame
rwInitializeMap()
{
    // Check to destroy the map first.
    if(n_RwMap[0] != INVALID_OBJECT_ID || n_RwMap[1] != INVALID_OBJECT_ID)
    {
        rwDestroyMap();
    }

    n_RwMap[0] = CreateObject(7417, -1365.6173095703, 1005.8671264648, 1096.7430419922, 0, 0, 0);
    CreateObject(7617, -1374.8547363281, 950.59869384766, 1098.798828125, 0, 0, 0);
    CreateObject(3453, -1322.9377441406, 1049.2974853516, 1094.5430908203, 0, 0, 90.075012207031);
    CreateObject(3452, -1316.6075439453, 1020.0397338867, 1094.5396728516, 0, 0, 89.780029296875);
    CreateObject(3452, -1316.63671875, 990.62689208984, 1094.5532226563, 0, 0, 90.075012207031);
    CreateObject(3452, -1316.5935058594, 961.05126953125, 1094.5452880859, 0, 0, 90.075012207031);
    CreateObject(3452, -1353.15625, 1054.7438964844, 1094.5458984375, 0, 0, 180.03996276855);
    CreateObject(3452, -1382.7836914063, 1054.7335205078, 1094.5595703125, 0, 359.9700012207, 180.06994628906);
    CreateObject(3452, -1412.3895263672, 1054.6687011719, 1094.5693359375, 0, 0, 180.09033203125);
    CreateObject(7017, -1425.3951416016, 1009.0256958008, 1088.7198486328, 0, 0, 90.060028076172);
    CreateObject(7017, -1425.3673095703, 982.89935302734, 1088.6948242188, 0, 0, 90.030029296875);
    CreateObject(7017, -1388.5163574219, 946.17474365234, 1088.7130126953, 0, 0, 0);
    CreateObject(7017, -1323.3875732422, 946.18090820313, 1088.7239990234, 0, 0, 179.93005371094);
    CreateObject(3865, -1423.1163330078, 899.61669921875, 1053.1737060547, 0, 0, 0);
    CreateObject(10903, -1449.0710449219, 1010.6331176758, 1097.5864257813, 0, 0, 0.2349853515625);
    CreateObject(10903, -1341.20703125, 1090.2918701172, 1097.6175537109, 0, 0, 270.14498901367);
    CreateObject(10903, -1371.7742919922, 923.99505615234, 1097.5953369141, 0, 0, 89.810028076172);
    CreateObject(10903, -1253.0295410156, 1003.4315185547, 1098.1303710938, 0, 0, 180.85504150391);
    CreateObject(7416, -1457.1330566406, 996.03631591797, 1087.6384277344, 0, 0, 179.3649597168);
    CreateObject(7305, -1426.9749755859, 975.3251953125, 1101.0767822266, 0, 0, 135.48004150391);
    CreateObject(7306, -1427.1549072266, 1028.1179199219, 1100.9964599609, 0, 0, 135.21502685547);
    CreateObject(7307, -1343.1624755859, 945.84088134766, 1100.9869384766, 0, 0, 134.73004150391);
    CreateObject(7306, -1398.5505371094, 946.02557373047, 1100.9482421875, 0, 0, 224.7900390625);
    CreateObject(8417, -1322.7552490234, 1045.9118652344, 1087.8192138672, 0, 0, 0);
    CreateObject(8417, -1322.7548828125, 1045.9111328125, 1087.8192138672, 0, 0, 0);
    CreateObject(8417, -1353.0557861328, 1018.8237304688, 1087.8215332031, 0, 0, 0);
    CreateObject(8417, -1353.0979003906, 978.96380615234, 1087.8134765625, 0, 0, 0);
    CreateObject(8417, -1394.1214599609, 1018.7452392578, 1087.8262939453, 0, 0, 0);
    CreateObject(8417, -1394.1865234375, 978.86822509766, 1087.8334960938, 0, 0, 0);
    CreateObject(8417, -1407.0517578125, 966.27813720703, 1087.8298339844, 0, 0, 0);
    CreateObject(8417, -1406.4799804688, 1006.1165161133, 1087.8226318359, 0, 0, 0);
    CreateObject(8417, -1407.3251953125, 1045.6943359375, 1087.8178710938, 0, 0, 0);
    CreateObject(8417, -1385.4575195313, 1058.0306396484, 1087.8118896484, 0, 0, 0);
    CreateObject(8417, -1344.1072998047, 962.19464111328, 1087.8098144531, 0, 0, 0);
    CreateObject(8417, -1375.2553710938, 942.17614746094, 1087.7860107422, 0, 0, 0);
    n_RwMap[1] = CreateObject(8417, -1312.5499267578, 984.54852294922, 1087.7901611328, 0, 0, 0);

    n_RwDynamicMap[0] = CreateDynamicObject(7417, -1365.6173095703, 1005.8671264648, 1096.7430419922, 0, 0, 0);
    CreateDynamicObject(7617, -1374.8547363281, 950.59869384766, 1098.798828125, 0, 0, 0);
    CreateDynamicObject(3453, -1322.9377441406, 1049.2974853516, 1094.5430908203, 0, 0, 90.075012207031);
    CreateDynamicObject(3452, -1316.6075439453, 1020.0397338867, 1094.5396728516, 0, 0, 89.780029296875);
    CreateDynamicObject(3452, -1316.63671875, 990.62689208984, 1094.5532226563, 0, 0, 90.075012207031);
    CreateDynamicObject(3452, -1316.5935058594, 961.05126953125, 1094.5452880859, 0, 0, 90.075012207031);
    CreateDynamicObject(3452, -1353.15625, 1054.7438964844, 1094.5458984375, 0, 0, 180.03996276855);
    CreateDynamicObject(3452, -1382.7836914063, 1054.7335205078, 1094.5595703125, 0, 359.9700012207, 180.06994628906);
    CreateDynamicObject(3452, -1412.3895263672, 1054.6687011719, 1094.5693359375, 0, 0, 180.09033203125);
    CreateDynamicObject(7017, -1425.3951416016, 1009.0256958008, 1088.7198486328, 0, 0, 90.060028076172);
    CreateDynamicObject(7017, -1425.3673095703, 982.89935302734, 1088.6948242188, 0, 0, 90.030029296875);
    CreateDynamicObject(7017, -1388.5163574219, 946.17474365234, 1088.7130126953, 0, 0, 0);
    CreateDynamicObject(7017, -1323.3875732422, 946.18090820313, 1088.7239990234, 0, 0, 179.93005371094);
    CreateDynamicObject(3865, -1423.1163330078, 899.61669921875, 1053.1737060547, 0, 0, 0);
    CreateDynamicObject(10903, -1449.0710449219, 1010.6331176758, 1097.5864257813, 0, 0, 0.2349853515625);
    CreateDynamicObject(10903, -1341.20703125, 1090.2918701172, 1097.6175537109, 0, 0, 270.14498901367);
    CreateDynamicObject(10903, -1371.7742919922, 923.99505615234, 1097.5953369141, 0, 0, 89.810028076172);
    CreateDynamicObject(10903, -1253.0295410156, 1003.4315185547, 1098.1303710938, 0, 0, 180.85504150391);
    CreateDynamicObject(7416, -1457.1330566406, 996.03631591797, 1087.6384277344, 0, 0, 179.3649597168);
    CreateDynamicObject(7305, -1426.9749755859, 975.3251953125, 1101.0767822266, 0, 0, 135.48004150391);
    CreateDynamicObject(7306, -1427.1549072266, 1028.1179199219, 1100.9964599609, 0, 0, 135.21502685547);
    CreateDynamicObject(7307, -1343.1624755859, 945.84088134766, 1100.9869384766, 0, 0, 134.73004150391);
    CreateDynamicObject(7306, -1398.5505371094, 946.02557373047, 1100.9482421875, 0, 0, 224.7900390625);
    CreateDynamicObject(8417, -1322.7552490234, 1045.9118652344, 1087.8192138672, 0, 0, 0);
    CreateDynamicObject(8417, -1322.7548828125, 1045.9111328125, 1087.8192138672, 0, 0, 0);
    CreateDynamicObject(8417, -1353.0557861328, 1018.8237304688, 1087.8215332031, 0, 0, 0);
    CreateDynamicObject(8417, -1353.0979003906, 978.96380615234, 1087.8134765625, 0, 0, 0);
    CreateDynamicObject(8417, -1394.1214599609, 1018.7452392578, 1087.8262939453, 0, 0, 0);
    CreateDynamicObject(8417, -1394.1865234375, 978.86822509766, 1087.8334960938, 0, 0, 0);
    CreateDynamicObject(8417, -1407.0517578125, 966.27813720703, 1087.8298339844, 0, 0, 0);
    CreateDynamicObject(8417, -1406.4799804688, 1006.1165161133, 1087.8226318359, 0, 0, 0);
    CreateDynamicObject(8417, -1407.3251953125, 1045.6943359375, 1087.8178710938, 0, 0, 0);
    CreateDynamicObject(8417, -1385.4575195313, 1058.0306396484, 1087.8118896484, 0, 0, 0);
    CreateDynamicObject(8417, -1344.1072998047, 962.19464111328, 1087.8098144531, 0, 0, 0);
    CreateDynamicObject(8417, -1375.2553710938, 942.17614746094, 1087.7860107422, 0, 0, 0);
    n_RwDynamicMap[1] = CreateDynamicObject(8417, -1312.5499267578, 984.54852294922, 1087.7901611328, 0, 0, 0);

}

// And we may need to destroy it when the minigame ends too
rwDestroyMap()
{
    // First of all check the map is initialized. Shouldn't be necessary tho
    if(!IsValidObject(n_RwMap[0]))
    {
        return;
    }

    DestroyObject(n_RwMap[0]);
    DestroyObject(n_RwMap[1]);

    n_RwMap[0] = INVALID_OBJECT_ID;
    n_RwMap[1] = INVALID_OBJECT_ID;

    DestroyDynamicObject(n_RwDynamicMap[0]);
    DestroyDynamicObject(n_RwDynamicMap[1]);

    n_RwDynamicMap[0] = DynamicObject: INVALID_OBJECT_ID;
    n_RwDynamicMap[1] = DynamicObject: INVALID_OBJECT_ID;
}


// Called from the main timers every second
// to process countdowns etc
rwProcess()
{
    if(rwGetState() == RW_STATE_SIGNUP)
    {
        if(GetTickCount() - rwData[rwInitTime] > RW_START_TIME)
        {
            rwInitialize();
        }
    }

    if(rwGetState() == RW_STATE_COUNTDOWN)
    {
        new szCountdownString[128];

        if(rwData[rwCountdown] > 3)
        {
            format(szCountdownString, 128, "~y~The fight begins in...~n~~n~~g~%d", rwData[rwCountdown]);
        }
        else if (rwData[rwCountdown] == 3)
        {
            format(szCountdownString, 128, "~r~%d", rwData[rwCountdown]);
        }
        else if (rwData[rwCountdown] == 2)
        {
            format(szCountdownString, 128, "~y~%d", rwData[rwCountdown]);
        }
        else if (rwData[rwCountdown] == 1)
        {
            format(szCountdownString, 128, "~g~%d", rwData[rwCountdown]);
        }
        else if (rwData[rwCountdown] == 0)
        {
            format(szCountdownString, 128, "~g~Go go go!");
            rwInitialize();
        }

        // Countdown stuff here
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!rwIsPlayerSignedUp(i))
            {
                continue;
            }
            GameTextForPlayer(i, szCountdownString, 1000, 5);

            if (rwData[rwCountdown] != 0)
            {
                PlayerPlaySound(i, 1056, 0, 0, 0);
            }
            else
            {
                PlayerPlaySound(i, 1057, 0, 0, 0);
                TogglePlayerControllable(i, true);
            }
        }


        rwData[rwCountdown] --;
        return;
    }

    if(rwGetState() == RW_STATE_RUNNING)
    {
        if(rwGetPlayerCount() < RW_MIN_PLAYER_COUNT)
        {
            rwEnd();
        }

        // This little doo-hikey makes sure the players team is always toggled
        // due to a SA-MP bug
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!rwIsPlayerSignedUp(i))
            {
                continue;
            }

            SetPlayerTeam(i, rwGetPlayerTeam(i));

            // Just add a quick check also in case a player has fell under the map
            // and respawn em if so
            new
                Float:fPosX,
                Float:fPosY,
                Float:fPosZ;
            GetPlayerPos(i, fPosX, fPosY, fPosZ);

            if(fPosZ < 1080)
            {
                rwSpawnPlayer(i);
                Streamer_Update(i);
            }
        }
    }
}

rwRemovePlayerFromMinigame(playerid)
{
    if(!rwIsPlayerSignedUp(playerid))
    {
        return;
    }

    if(rwGetState() == RW_STATE_SIGNUP)
        GiveRegulatedMoney(playerid, MinigameParticipation);

    ReleasePlayerGameColor(playerid);
    TimeController->releasePlayerOverrideTime(playerid);

    if(rwGetState() == RW_STATE_COUNTDOWN)
    {
        TogglePlayerControllable(playerid, true);
        ClearPlayerMenus(playerid);
    }

    if(rwGetState() > RW_STATE_SIGNUP && GetPlayerState(playerid) != PLAYER_STATE_WASTED)
    {
        rwRestorePlayerData(playerid);
    }

    rwResetPlayerData(playerid);

    if(rwGetState() != RW_STATE_NONE)
        rwData[rwSignupCount]--;
}

rwSignPlayerUp(playerid)
{
    // Error checking - shouldn't be neccesary though
    if(!Player(playerid)->isConnected() || IsPlayerNPC(playerid) || !IsPlayerMinigameFree(playerid))
    {
        return;
    }

    if(rwGetState() > RW_STATE_SIGNUP)
    {
        return;
    }

    rwPlayerData[playerid][rwPlayerSignedUp] = true;

    if(n_TeamAssignment == 1)
    {
        n_TeamAssignment = 0;
        rwSetPlayerTeam(playerid, RW_TEAM_BLUE);
    }
    else
    {
        rwSetPlayerTeam(playerid, RW_TEAM_RED);
        n_TeamAssignment = 1;
    }

    new szAdminMsg[128];
    format(szAdminMsg, 128, "%s (Id:%d) has signed up for /rwtw.", PlayerName(playerid), playerid);
    Admin(playerid, szAdminMsg);

    Responses->respondMinigameSignedUp(playerid, RunWeaponsTeamWarMinigame, "Run Weapons Team War", 20);
    format(szAdminMsg, sizeof(szAdminMsg), "~r~~h~%s~w~ has signed up for ~y~Run Weapons Team War~w~ (~p~/rwtw~w~)", Player(playerid)->nicknameString());
    NewsController->show(szAdminMsg);

    rwData[rwSignupCount]++;
}

// This is called when a player types /rwtw
rwOnCommand(playerid, params[])
{

    // Is the player already taking part in another minigame?
    if(IsPlayerInMinigame(playerid) || !IsPlayerMinigameFree(playerid))
    {
        new szMsg[128];

        if(strlen(GetPlayerMinigameName(playerid)) > 0)
        {
            format(szMsg, 128, "* You are already taking part in %s!", GetPlayerMinigameName(playerid));
            ShowBoxForPlayer(playerid, szMsg);
            return 1;
        }
        SendClientMessage(playerid, Color::Red, "* You are already taking part in a minigame!");
        return 1;
    }

    // Is this minigame already running?
    if(rwGetState() > RW_STATE_SIGNUP)
    {
        SendClientMessage(playerid, Color::Red, "* Run Weapons Team War is already in progress. Please try again later.");
        return 1;
    }

    new const price = GetEconomyValue(MinigameParticipation);

    // Has the player got enough money to signup?
    if(GetPlayerMoney(playerid) < price)
    {
        new szMsg[128];
        format(szMsg, 128, "You need $%s to signup for this minigame.", formatPrice(price));
        ShowBoxForPlayer(playerid, szMsg);
        return 1;
    }

    // Check if the minigame is running. If not we need to initialize it.

    if(rwGetState() == RW_STATE_NONE)
    {
        if(!strlen(params) || !IsNumeric(params))
        {
            SendClientMessage(playerid, Color::White, "Use: /rwtw [Maximum Kills]");
            return 1;
        }

        new rounds = strval(params);
        if(rounds < RW_MIN_KILLS || rounds > RW_MAX_KILLS)
        {
            new str[128];
            format(str, 128, "Use: /rwtw [Maximum Kills]. Valid values are %d - %d", RW_MIN_KILLS, RW_MAX_KILLS);
            SendClientMessage(playerid, Color::White, str);
            return 1;
        }

        rwInitialize(rounds);

        Announcements->announceMinigameSignup(RunWeaponsTeamWarMinigame, "Run Weapons Team War", "/rwtw", price, playerid);
        GameTextForAllEx("~y~Run Weapons Team War~w~ is now signing up!~n~Want to join? ~r~/rwtw~w~!", 5000, 5);
    }

    // All good, sign the player up and we're done.
    rwSignPlayerUp(playerid);

    TakeRegulatedMoney(playerid, MinigameParticipation);

    return 1;
}

rwOnPlayerDeath(playerid, killerid)
{
    if(!Player(killerid)->isConnected())
    {
        rwPlayerData[playerid][rwPlayerDeaths]++;
        return;
    }

    rwPlayerData[killerid][rwPlayerKills]++;
    rwPlayerData[playerid][rwPlayerDeaths]++;

    new n_Team = rwGetPlayerTeam(killerid);
    new n_Score = rwGetScore(n_Team);

    rwSetScore(n_Team, n_Score+1);

    rwUpdateTextdraw();

    // This adds a little camera affect for the person who is killed.
    // Credits to Slice. Yeh.
    new
        Float:x[ 2 ],
        Float:y[ 2 ],
        Float:z[ 2 ];

    GetPlayerPos( playerid, x[ 0 ], y[ 0 ], z[ 0 ] );
    GetPlayerPos( killerid, x[ 1 ], y[ 1 ], z[ 1 ] );

    GetPosInFrontOfPlayer(killerid, x[ 1 ], y[ 1 ],   -1.5 );
    SetPlayerCameraPos   (playerid, x[ 1 ], y[ 1 ], z[ 1 ] + 1.0 );
    SetPlayerCameraLookAt(playerid, x[ 0 ], y[ 0 ], z[ 0 ] );

    GameTextForPlayer(killerid, "~n~~n~~n~~n~~n~~y~Smoked em!", 5000, 5);

    if(n_Score + 1 == rwGetMaxScore())
    {
        new notice[128];
        if(n_Team == RW_TEAM_BLUE)
        {
            rwEnd();
            format(notice, sizeof(notice), "~y~Run Weapons Team War~w~ has finished: ~b~~h~Blue Team~w~ have won!");
            NewsController->show(notice);
        }
        else
        {
            rwEnd();
            format(notice, sizeof(notice), "~y~Run Weapons Team War~w~ has finished: ~r~~h~Red Team~w~ have won!");
            NewsController->show(notice);
        }
    }
}

// Spawn the player in the minigame.
// If the mapfix param is 1, it will spawn them with a slight higher Z height.
rwSpawnPlayer(playerid, bool:n_MapFix = true)
{
    // Countdown phase - freeze the player, store their data.
    if(rwGetState() == RW_STATE_COUNTDOWN)
    {
        TogglePlayerControllable(playerid, 0);
        rwStorePlayerData(playerid);
    }

    // Update the streamer first of all
    Streamer_UpdateEx(playerid, -1341.20703125, 1090.2918701172, 1097.6175537109);

    ClearPlayerMenus(playerid);

    ResetPlayerWeapons(playerid);

    GiveWeapon(playerid, 26, 10000);

    SetPlayerInterior(playerid, 0);

    GiveWeapon(playerid, 28, 4000);

    SetPlayerHealth(playerid, 100);
    SetPlayerArmour(playerid, 0);

    SetPlayerWeather(playerid, 10);

    TimeController->setPlayerOverrideTime(playerid, 12, 0);

    // Is the player in the red team?
    if(rwGetPlayerTeam(playerid) == RW_TEAM_RED)
    {

        SetPlayerFacingAngle(playerid, 358.7354);
        SetPlayerTeam(playerid, RW_TEAM_RED);
        SetPlayerSkinEx(playerid, RW_RED_SKIN);

        SetPlayerGameColor(playerid, RW_RED_COLOUR);

        Streamer_UpdateEx(playerid, -1352.9841 + rwGetPlayerSignupID(playerid)* 3, 964.3445, 1088.7744);
        if(n_MapFix == true)
        {
            SetPlayerPos(playerid, -1352.9841 + rwGetPlayerSignupID(playerid)* 3, 964.3445, 1092.7744);
        }
        else
        {
            SetPlayerPos(playerid, -1352.9841 + rwGetPlayerSignupID(playerid)* 3, 964.3445, 1088.7744);
        }
        Streamer_Update(playerid);

    }

    // Or maybe he's in the blue team?
    else
    {
        Streamer_UpdateEx(playerid, -1351.8190 + rwGetPlayerSignupID(playerid) * 3, 1019.7844, 1088.7825);

        if(n_MapFix == true)
        {
            SetPlayerPos(playerid, -1351.8190 + rwGetPlayerSignupID(playerid) * 3, 1019.7844, 1092.7825);
        }
        else
        {
            SetPlayerPos(playerid, -1351.8190 + rwGetPlayerSignupID(playerid) * 3, 1019.7844, 1088.7825);
        }
        Streamer_Update(playerid);
        SetPlayerFacingAngle(playerid, 187.3639);
        SetPlayerTeam(playerid, RW_TEAM_BLUE);
        SetPlayerSkinEx(playerid, RW_BLUE_SKIN);

        SetPlayerGameColor(playerid, RW_BLUE_COLOUR);
    }

    SetCameraBehindPlayer(playerid);
    SetPlayerVirtualWorld(playerid, RW_VIRTUAL_WORLD);

    // Update the streamer once more to be sure
    Streamer_Update(playerid);
}

rwSetPlayerTeam(playerid, n_Team)
{
    rwPlayerData[playerid][rwPlayerTeam] = n_Team;

    if(n_Team == RW_TEAM_RED)
    {
        rwPlayerData[playerid][rwTeamSignupID] = rwData[rwRedTeamCount];
        rwData[rwRedTeamCount]++;
    }
    else if (n_Team == RW_TEAM_BLUE)
    {
        rwPlayerData[playerid][rwTeamSignupID] = rwData[rwBlueTeamCount];
        rwData[rwBlueTeamCount]++;
    }
}

rwGetPlayerTeam(playerid)
{
    return rwPlayerData[playerid][rwPlayerTeam];
}

rwGetPlayerSignupID(playerid)
{
    return rwPlayerData[playerid][rwTeamSignupID];
}

rwIsPlayerSignedUp(playerid)
{
    if(rwPlayerData[playerid][rwPlayerSignedUp] == true)
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

// This is called from when a player selects RWTW from the /minigames menu.
rwMenuActivate(playerid)
{
    rwOnCommand(playerid, "10");
    return 1;
}

rwStorePlayerData(playerid)
{
    if (LegacyIsPlayerInBombShop(playerid))
        RemovePlayerFromBombShop(playerid);

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ,
        Float:fAng;

    GetPlayerPos(playerid, fPosX, fPosY, fPosZ);
    GetPlayerFacingAngle(playerid, fAng);

    rwPlayerData[playerid][rwSignupSkin] = GetPlayerSkin(playerid);

    rwPlayerData[playerid][rwSignupPos][0] = fPosX;
    rwPlayerData[playerid][rwSignupPos][1] = fPosY;
    rwPlayerData[playerid][rwSignupPos][2] = fPosZ;
    rwPlayerData[playerid][rwSignupPos][3] = fAng;

    rwPlayerData[playerid][rwSignupWorld] = GetPlayerVirtualWorld(playerid);

    for(new i = 0; i < 12; i++)
    {
        GetPlayerWeaponData(playerid, i, rwPlayerData[playerid][rwSignupWeap][i], rwPlayerData[playerid][rwSignupAmmo][i]);
    }

}

rwRestorePlayerData(playerid)
{
    SetPlayerPos(playerid, rwPlayerData[playerid][rwSignupPos][0], rwPlayerData[playerid][rwSignupPos][1], rwPlayerData[playerid][rwSignupPos][2]);
    SetPlayerFacingAngle(playerid, rwPlayerData[playerid][rwSignupPos][3]);

    SetPlayerVirtualWorld(playerid, rwPlayerData[playerid][rwSignupWorld]);

    SetPlayerSkinEx(playerid, rwPlayerData[playerid][rwSignupSkin]);

    for(new i = 0; i < 12; i++)
    {
        GiveWeapon(playerid, rwPlayerData[playerid][rwSignupWeap][i], rwPlayerData[playerid][rwSignupAmmo][i]);
    }
}

rwResetData(bool: initialReset = false) {
    if (initialReset == true)
        rwData[rwScoreText] = Text:INVALID_TEXT_DRAW;

    rwData[rwState] = 0;
    rwData[rwBlueKills] = 0;
    rwData[rwRedKills] = 0;
    rwData[rwInitTime] = 0;
    rwData[rwCountdown] = RW_COUNTDOWN_SECONDS;
    rwData[rwMaxScore] = 0;
    rwData[rwSignupCount] = 0;
    rwData[rwRedTeamCount] = 0;
    rwData[rwBlueTeamCount] = 0;
    if (rwData[rwScoreText] != Text:INVALID_TEXT_DRAW) {
        TextDrawDestroy(rwData[rwScoreText]);
        rwData[rwScoreText] = Text:INVALID_TEXT_DRAW;
    }
    // destroy the map ofc
    rwDestroyMap();
}

rwResetPlayerData(playerid)
{
    TextDrawHideForPlayer(playerid, rwData[rwScoreText]);
    rwPlayerData[playerid][rwPlayerSignedUp] = false;
    rwPlayerData[playerid][rwPlayerTeam] = 0;
    rwPlayerData[playerid][rwPlayerKills] = 0;
    rwPlayerData[playerid][rwPlayerDeaths] = 0;
    rwPlayerData[playerid][rwSignupWorld] = 0;
    rwPlayerData[playerid][rwSignupSkin] = 0;
    rwPlayerData[playerid][rwTeamSignupID] = 0;


    TogglePlayerControllable(playerid, true);
    ClearPlayerMenus(playerid);

    SetPlayerTeam(playerid, NO_TEAM);

    for(new i = 0; i < 4; i++)
    {
        rwPlayerData[playerid][rwSignupPos][i] = 0.0;
    }

    for(new i = 0; i < 12; i++)
    {
        rwPlayerData[playerid][rwSignupWeap][i] = 0;
        rwPlayerData[playerid][rwSignupAmmo][i] = 0;
    }
}


rwSetScore(n_Team, score)
{
    if(n_Team == RW_TEAM_RED)
    {
        rwData[rwRedKills] = score;
    }
    else if (n_Team == RW_TEAM_BLUE)
    {
        rwData[rwBlueKills] = score;
    }
    return 1;
}

rwGetScore(n_Team)
{
    if(n_Team == RW_TEAM_RED)
    {
        return rwData[rwRedKills];
    }
    else if (n_Team == RW_TEAM_BLUE)
    {
        return rwData[rwBlueKills];
    }
    else
    {
        return 0;
    }
}

rwGetMaxScore()
{
    return rwData[rwMaxScore];
}

rwSetMaxScore(n_Score)
{
    rwData[rwMaxScore] = n_Score;
}

rwGetPlayerCount()
{
    return rwData[rwSignupCount];
}

rwSetState(n_State)
{
    rwData[rwState] = n_State;
}

rwGetState()
{
    return rwData[rwState];
}

GetPosInFrontOfPlayer( playerid, &Float:x, &Float:y, Float:distance )
{
    new Float:a;

    GetPlayerPos        ( playerid, x, y, a );
    GetPlayerFacingAngle( playerid,       a );

    if ( GetPlayerVehicleID( playerid ) )
        GetVehicleZAngle( GetPlayerVehicleID( playerid ), a );

    x += ( distance * floatsin( -a, degrees ) );
    y += ( distance * floatcos( -a, degrees ) );
}