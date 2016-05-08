// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Returns whether a command is valid for use when the player enjoys limited functionality.
bool: IsCommandAvailableForLimitedFunctionality(command[]) {
    switch (command[1]) {
        case 'a':
            return !strcmp(command, "/answer", true);
        case 'c':
            return !strcmp(command, "/call", true) ||
                   !strcmp(command, "/c", true) ||
                   !strcmp(command, "/continue", true);
        case 'f':
            return !strcmp(command, "/flip", true);
        case 'h':
            return !strcmp(command, "/hangup", true) ||
                   !strcmp(command, "/help", true);
        case 'l':
            return !strcmp(command, "/leave", true);
        case 'n':
            return !strcmp(command, "/nos", true);
        case 'p':
            return !strcmp(command, "/pm", true) ||
                   !strcmp(command, "/pos", true);
        case 'r':
            return !strcmp(command, "/r", true) ||
                   !strcmp(command, "/reply", true) ||
                   !strcmp(command, "/rules", true);
        case 'v':
            return !strcmp(command, "/vr", true);
    }

    return false;
}

// All commands entered by players will end up in this callback.
public OnPlayerCommandText(playerid, cmdtext[]) {
    if (strlen(cmdtext) == 1)
        return 1; // we don't want crashes when the player types /

    if (Player(playerid)->isConnected() == false)
        return 1; // we haven't marked this player as being connected.

    PlayerIdlePenalty->resetCurrentIdleTime(playerid);

    new cmd[256], idx;
    cmd = strtok(cmdtext, idx);

    // Convert uppercase to lowercase.
    for (new i = 0; i < strlen(cmd); i++)
        cmd[i] = tolower(cmd[i]);

    // If functionality is limited for this player then we need to check with the command whitelist
    // to see if they can execute the requested command. Otherwise we block it.
    if (PlayerState(playerid)->hasLimitedFunctionality() && Player(playerid)->isAdministrator() == false &&
        IsCommandAvailableForLimitedFunctionality(cmd) == false) {

        switch (PlayerState(playerid)->currentState()) {
            case JailedPlayerState:
                format(cmd, sizeof(cmd), "in jail.");
            case MapZonePlayerState:
                format(cmd, sizeof(cmd), "in a map zone. Use /leave first!");
            case VehicleTuningPlayerState:
                format(cmd, sizeof(cmd), "in a TuneShop.");
            case RacingPlayerState:
                format(cmd, sizeof(cmd), "racing. Use /leave first!");
            case SaveLoadingPlayerState:
                format(cmd, sizeof(cmd), "in a loading state.");
            default:
                format(cmd, sizeof(cmd), "[UNKNOWN].");
        }

        strcat(cmd, " Please try again later when you're normally playing again.", sizeof(cmd));

        SendClientMessage(playerid, Color::Information, "The commands available to you have been limited because you're currently");
        SendClientMessage(playerid, Color::Information, cmd);
        return 1;
    }

    // Commands implemented through the LVP PreCompiler's @command annotation get priority over all
    // other commands. If the following call returns 0, the command has been processed but isn't
    // available to the player. If the call returns 1, it has been handled. If it returns -1, the
    // command hasn't been processed and should be done so by this callback.
    if (Annotation::ProcessCommand(cmd, playerid, cmdtext[idx]) == 1)
        return 1;

    new moneys;

    // commands for testing
    if (!strcmp(cmdtext, "/pos", true)) {
        new message[64], Float: position[3], Float: rotation;
        GetPlayerPos(playerid, position[0], position[1], position[2]);
        GetPlayerFacingAngle(playerid, rotation);

        format(message, sizeof(message), "Position: [%.2f, %.2f, %.2f]; Rotation: [%.2f]",
            position[0], position[1], position[2], rotation);
        SendClientMessage(playerid, COLOR_WHITE, message);
        return 1;
    }

#if BETA_TEST == 1
        if(!strcmp(cmdtext, "/vehid", true))
        {
            new str[128];
            format(str, 128, "Vehicle ID: %d. Model: %d. Name: %s.",GetPlayerVehicleID(playerid), GetVehicleModel(GetPlayerVehicleID(playerid)), VehicleModel(GetVehicleModel(GetPlayerVehicleID(playerid)))->nameString());
            SendClientMessage(playerid, COLOR_WHITE, str);
            return 1;
        }

        if(!strcmp(cmdtext, "/timer1debug", true) ||
           !strcmp(cmdtext, "/timer2debug", true) ||
           !strcmp(cmdtext, "/1secdebug", true))
        {
            DeprecatedTimerRuntime->onSecondTimerTick();
            return 1;
        }

        if(strcmp(cmdtext,"/hax",true) == 0)
        {
            GivePlayerMoney ( playerid, 2500000 );
            SendClientMessage ( playerid, COLOR_GREEN, "No problem sir." );
            return 1;
        }

        if(!strcmp(cmdtext, "/gta", true))
        {
            CTheft__Initalize();
            ShowBoxForPlayer(playerid, "GTA Initialized.");
            return 1;
        }

        if(!strcmp(cmdtext, "/addspawn", true))
        {
            SavePlayerSpawnData(playerid);
            SendClientMessage(playerid, COLOR_GREEN, "Spawn data saved to file.");

            new szMsg[128];
            format(szMsg, 128, "[dev] LVP On-foot Spawn Point added by %s: City: %s. Area: %s.", PlayerName(playerid), GetPlayerCity(playerid), GetPlayerZone(playerid));
            AddEcho(szMsg);
            return 1;
        }
    #endif

    new namex[24];
    GetPlayerName( playerid, namex, 24 );
    param_reset();
    new string[256];

    if(!strcmp(cmdtext, "/radio", true))
    {
        if(iRadioEnabledForPlayer[playerid] == true)
        {
            radioToggleForPlayer(playerid, false);
            ShowBoxForPlayer(playerid, "LVP Radio disabled.");
            return 1;
        }
        radioToggleForPlayer(playerid, true);
        ShowBoxForPlayer(playerid, "LVP Radio enabled.");
        return 1;
    }

    if(CHideGame__GetPlayerState(playerid) == HS_STATE_PLAYING && Player(playerid)->isAdministrator() == false)
    {
        if(strcmp(cmd, "/leave", true) != 0 && strcmp(cmd, "/lay", true) !=0 && strcmp(cmd, "/sit", true) !=0 && strcmp(cmd, "/find", true) !=0
        && strcmp(cmd, "/pm", true) !=0 && strcmp(cmd, "/r", true) !=0)
        {
            ShowBoxForPlayer(playerid, "You need to /leave Hide n Seek first!");
            return 1;
        }
    }

    if(GetPlayerState(playerid) == PLAYER_STATE_WASTED && Player(playerid)->isAdministrator() == false)
    {
        SendClientMessage(playerid,COLOR_RED,"* You cannot use commands when you are wasted!");
        return 1;
    }

    if(strcmp(cmd, "/fight", true) == 0)
    {
        // Prevents players from having anything to do with FightClub if they're in a minigame
        if(IsPlayerInMinigame(playerid))
        {
            ShowBoxForPlayer(playerid, "You're already taking part in another minigame.");
            return 1;
        }
        if(!IsPlayerMinigameFree(playerid))
        {
            SendClientMessage(playerid,COLOR_RED,"You have already signed up with a different minigame.");
            return 1;
        }
    }

#if Feature::EnableFightClub == 0
    // Prevents players from using commands whilst fighting in the FightClub
    if (CFightClub__GetPlayerStatus(playerid) == FC_STATUS_FIGHTING && Player(playerid)->isAdministrator() == false)
    {
        ShowBoxForPlayer(playerid, "You can't use commands when in a fightclub fight!");
        return 1;
    }

    // If player has invited someone, only allow certain commands.
    if (CFightClub__GetPlayerStatus(playerid) == FC_STATUS_WAITING && Player(playerid)->isAdministrator() == false) 
    {
        if(!CFightClub__IsWaitCommand(cmdtext))
        {
            ShowBoxForPlayer(playerid, "You've invited someone to a fight, so you can only use /fight [cancel/help/matches]");
            return 1;
        }
    }

    // If player is watching a fight, only allow certain commands.
    if(IsPlayerWatchingFC[playerid] && Player(playerid)->isAdministrator() == false) 
    {
        if(!CFightClub__IsWatchCommand(cmdtext))
        {
            ShowBoxForPlayer(playerid, "You're watching a fight so you can only use /fight [help/matches/stopwatch/switch/watch]");
            return 1;
        }
    }
#endif

    if(chaseData[1] == playerid && chaseData[0] == 1) {
        if(Player(playerid)->isAdministrator() == true) {
            SendClientMessage(playerid, COLOR_RED, "You are currently being chased -- do not abuse your administrative power to use commands.");
        } else {
            ShowBoxForPlayer(playerid, "You cannot use commands when you're being chased.");
            return 1;
        }
    }


    if(PlayerInfo[playerid][PlayerStatus] == STATUS_DELIVERY && Player(playerid)->isAdministrator() == false)
    {
        ShowBoxForPlayer(playerid, "You're currently on the delivery mission! Get out of the truck to cancel the mission.");
        return 1;
    }

    if(!strcmp(cmd, "/dm", true))
    {
        ShowDeathmatchDialog(playerid);
        return 1;
    }

    // rivershell game for admins
    if(strcmp(cmd,"/rivershell",true) == 0)
    {
        if(IsPlayerInMinigame(playerid))
        {
            ShowBoxForPlayer(playerid,"You're already in another minigame! Use /leave to signout.");
            return 1;
        }
        if(!IsPlayerMinigameFree(playerid))
        {
            ShowBoxForPlayer(playerid,"You have already signed up with a different minigame.");
            return 1;
        }

        if(GetPlayerMoney(playerid) < 250)
        {
            ShowBoxForPlayer(playerid,"You need $250 to take part in the minigame!");
            return 1;
        }

        if(g_RivershellState == RIVERSHELL_STATE_NONE)
        {
            CShell__SignupProcess(playerid);
            CShell__SignPlayerUp(playerid);
            return 1;
        }

        else if(g_RivershellState == RIVERSHELL_STATE_SIGNUP)
        {
            if(g_RivershellPlayer[playerid])
            {
                ShowBoxForPlayer(playerid,"You already signed up for rivershell!");
                return 1;
            }
            CShell__SignPlayerUp(playerid);
            return 1;
        }

        else
        {
            SendClientMessage(playerid,COLOR_RED,"Rivershell is already running.");
            return 1;
        }
    }

    // Brief minigame for admins

    if(strcmp(cmd, "/brief", true) == 0)
    {
        if(IsPlayerInMinigame(playerid))
        {
            ShowBoxForPlayer(playerid,"You're already in another minigame!");
            return 1;
        }

        if(!IsPlayerMinigameFree(playerid))
        {
            ShowBoxForPlayer(playerid,"You have already signed up with a different minigame.");
            return 1;
        }

        if(briefStatus == BRIEF_STATE_RUNNING)
        {
            ShowBoxForPlayer(playerid,"The capture the brief minigame is already running!");
            return 1;
        }

        if(isPlayerBrief[playerid])
        {
            ShowBoxForPlayer(playerid,"You have already signed up for the capture the brief minigame!");
            return 1;
        }

        if(GetPlayerMoney(playerid) < 100)
        {
            ShowBoxForPlayer(playerid,"You need $100 to take part in the game!");
            return 1;
        }

        new str[256];

        if(briefStatus == BRIEF_STATE_EMPTY)
        {
            CBrief__Initalize(playerid);
            format(str,256,"%s (Id:%d) has signed up for /brief.",PlayerName(playerid),playerid);
            Admin(playerid, str);
            CBrief__SignPlayerUp(playerid);
            return 1;
        }

        if(!isPlayerBrief[playerid])
        {
            CBrief__SignPlayerUp(playerid);
            format(str,256,"%s (Id:%d) has signed up for /brief.",PlayerName(playerid),playerid);
            Admin(playerid, str);
            return 1;
        }
        else
        {
            ShowBoxForPlayer(playerid,"You have already signed up!");
            return 1;
        }

    }

    if(strcmp( cmd, "/bagmoney", true ) == 0 )
    {

        if(iMoneyBagCashPickup == -1)
        {
            SendClientMessage(playerid, Color::Error, "* No money bags have been dropped.");
            return 1;
        }

        new params[128];
        params = strtok( cmdtext, idx );

        if(!strlen(params))
        {
            SendClientMessage(playerid, Color::Information, "Usage: /bagmoney [amount]");
            return 1;
        }

        if(iCashAddTime[playerid] != 0)
        {
            if(GetTickCount() - iCashAddTime[playerid] < 10*1000)
            {
                SendClientMessage(playerid, Color::Error, "* You can only add cash every 10 seconds.");
                return 1;
            }
        }

        new iAmount = strval(params);
        if(iAmount < 0 || iAmount > GetPlayerMoney(playerid))
        {
            SendClientMessage(playerid, Color::Error, "* You don't have enough cash!");
            return 1;
        }

        if(iAmount < MIN_MONEY_BAG_CASH)
        {
            new szMsg[128];
            format(szMsg, 128, "The minimum you can add is $%s.", formatPrice(MIN_MONEY_BAG_CASH));
            SendClientMessage(playerid, Color::Information, szMsg);
            return 1;
        }

        if(!UpdateMoneyAmount(iAmount, playerid))
        {
            new szMsg[128];
            format(szMsg, 128, "The bag can only hold $%s.", formatPrice(MAX_MONEY_BAG_CASH));
            SendClientMessage(playerid, Color::Error, szMsg);
        }
        else
        {
            GivePlayerMoney(playerid, -iAmount);
            iCashAddTime[playerid] = GetTickCount();
        }
        return 1;
    }

    if(strcmp(cmd, "/rconadmin", true) == 0 && IsPlayerAdmin(playerid))
    {
        // An RCON admin has requested management perms.. we give them.
        Player(playerid)->setLevel(ManagementLevel);

        // However we don't let them know, because it's tradition.
        return 0;
    }

    if(PlayerHandOfGod[playerid] == 1)
    {
    //  SendClientMessage(playerid, COLOR_RED, "Commands are temporary disabled for you!");
        return 0;
    }

    if(isPlayerBrief[playerid] && briefStatus == BRIEF_STATE_RUNNING && Player(playerid)->isAdministrator() == false
        && !IsCommandAvailableForLimitedFunctionality(cmd)) {
        ShowBoxForPlayer(playerid,"You cannot use commands because you are in the capture the brief mini game. Use /leave");
        return 1;
    }

    if (!(strcmp(cmd,"/help", true) == 0 || strcmp(cmd,"/rules", true) == 0 || strcmp(cmd,"/register", true) == 0))
    {
        if(Player(playerid)->isRegistered() && Player(playerid)->isLoggedIn() == false)
        {
            if(strcmp(cmd,"/login", true) != 0)
            {
                SendClientMessage(playerid,COLOR_YELLOW,"* Login to your account first! Use /login [your password].");
                SendClientMessage(playerid,COLOR_YELLOW,"* If you have any problems, you can contact admins using @<your message>.");
                SendClientMessage(playerid,COLOR_YELLOW,"* For example: @Help, I cannot login.");
                return 1;
            }
        }
    }

#if Feature::EnableDeathmatchCommands == 0
    if(strcmp(cmd, "/kill", true) == 0)
    {
        if(IsPlayerInMinigame(playerid) && Player(playerid)->isAdministrator() == false)
        {
            ShowBoxForPlayer(playerid, "You can't kill yourself in a minigame! Are you stuck? Ask an admin! Type /leave to leave the minigame.");
            return 1;
        }

        if(DamageManager(playerid)->isPlayerFighting() == true)
        {
            ShowBoxForPlayer(playerid, "You are currently in a gunfight and therefore cannot /kill yourself.");
            return 1;
        }

        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You can't use this command while being in an interior!");
            return 1;
        }

        if(ShipManager->isPlayerWalkingOnShip(playerid))
        {
            ShowBoxForPlayer(playerid, "You're currently on the ship, thus can't use this command.");
            return 1;
        }

        preventKillLamers[playerid] = 1;
        SetPlayerHealth(playerid, 0.0);

        new notice[64];
        format(notice, sizeof(notice), "~r~~h~%s~w~ has killed themselves (~p~/kill~w~)", Player(playerid)->nicknameString());
        NewsController->show(notice);

        return 1;
    }
#endif

    if(IsPlayerInMinigame(playerid) && Player(playerid)->isAdministrator() == false
        && !IsCommandAvailableForLimitedFunctionality(cmd)) {
#if !defined ENABLE_COMMANDS_DURING_MINIGAMES

        new tmp[256];
        tmp = strtok(cmdtext, idx);

        // Check whether one of the following commands has been given by the user,
        // in which case they're fine to proceed, otherwise show a message that
        // commands are disabled while the player is in a minigame.
        if (strcmp(cmd, "/sync", true) != 0 &&
            strcmp(cmd, "/find", true) != 0 &&
            strcmp(cmd, "/fight", true) != 0 &&
            strcmp(tmp, "cancel", true)) // cancel a minigame-request
        {
            ShowBoxForPlayer(playerid, "You are taking part in a minigame - Use /leave first");
            return 1;
        }

#endif
    }

    if(strcmp(cmd,"/donate",true) == 0)
    {
        SendClientMessage(playerid,COLOR_LIGHTBLUE, "Donating to Las Venturas Playground is highly appreciated and offers a lot of");
        SendClientMessage(playerid,COLOR_LIGHTBLUE,"additional and fun features for players; from access to a VIP room, forum board,");
        SendClientMessage(playerid,COLOR_LIGHTBLUE,"IRC channel, ingame ranks, commands and much more! Please visit http://donate.sa-mp.nl!");
        return 1;
    }

    // Commands for testing:
#if Feature::EnableFightClub == 0
    lvp_command(Fight,          5, PlayerLevel);
#endif

    // Commands for Regulars;
    lvp_command(Ignore,         6, PlayerLevel);
    lvp_command(Unignore,       8, PlayerLevel);
    lvp_command(Ignored,        7, PlayerLevel);
    lvp_command(settings,       8, PlayerLevel);

    // Popular, large, commands:
    lvp_command(cd,             2, PlayerLevel);
    lvp_command(World,          5, PlayerLevel);

    // Spawn vehicle commands.
    lvp_command(Ele,            3, PlayerLevel);
    lvp_command(Inf,            3, PlayerLevel);
    lvp_command(Nrg,            3, PlayerLevel);
    lvp_command(Sul,            3, PlayerLevel);

    // General player commands:
    lvp_command(Commands,       8, PlayerLevel);
    lvp_command(cmds,           4, PlayerLevel);
    lvp_command(Minigames,      9, PlayerLevel);
    lvp_command(Teles,          5, PlayerLevel);
    lvp_command(Find,           4, PlayerLevel);
    lvp_command(Has,            3, PlayerLevel);
    lvp_command(Derby,          5, PlayerLevel);
    lvp_command(locate,         6, PlayerLevel);
    lvp_command(leave,          5, PlayerLevel);
    lvp_command(lyse,           4, PlayerLevel);
    lvp_command(taxi,           4, PlayerLevel);
    lvp_command(tow,            3, PlayerLevel);
    lvp_command(slap,           4, PlayerLevel);
    lvp_command(slapb,          5, PlayerLevel);
    lvp_command(slapback,       8, PlayerLevel);
    lvp_command(taxiprice,      9, PlayerLevel);
    lvp_command(countdown,      9, PlayerLevel);
    lvp_command(interest,       8, PlayerLevel);
    lvp_command(stats,          5, PlayerLevel);
    lvp_command(showmessage,   11, PlayerLevel);
    lvp_command(jump,           4, PlayerLevel);
    lvp_command(tune,           4, PlayerLevel);
    lvp_command(pos,            3, PlayerLevel);
    lvp_command(My,             2, PlayerLevel);
    lvp_command(Robbery,        7, PlayerLevel);
    lvp_command(Wwtw,           4, PlayerLevel);
    lvp_command(Rwtw,           4, PlayerLevel);
    lvp_command(minigaming,    10, PlayerLevel);

    // Commands for  administrators:
    lvp_command(clear,          5, AdministratorLevel);
    lvp_command(crew,           4, AdministratorLevel);
    lvp_command(show,           4, AdministratorLevel);
    lvp_command(p,              1, AdministratorLevel);
    lvp_command(t,              1, AdministratorLevel);
    lvp_command(announce,       8, AdministratorLevel);

#if Feature::EnableFightClub == 0
    lvp_command(resetfc,        7, AdministratorLevel);
    lvp_command(resetmatch,    10, AdministratorLevel);
#endif
    lvp_command(asay,           4, AdministratorLevel);
    lvp_command(reactiontest,  12, AdministratorLevel);
    lvp_command(fakeact,        7, AdministratorLevel);
    lvp_command(chase,          5, AdministratorLevel);
    lvp_command(fetch,          5, AdministratorLevel);
    lvp_command(killtime,       8, AdministratorLevel);
    lvp_command(up,             2, AdministratorLevel);
    lvp_command(forward,        7, AdministratorLevel);
    lvp_command(stopchase,      9, AdministratorLevel);
    lvp_command(set,            3, AdministratorLevel);
    lvp_command(fixminigames,  12, AdministratorLevel);

    // Commands for management
    lvp_command(man,            3, ManagementLevel);

    // ----------------------------

    if(!strcmp(cmdtext, "/waterfight", true))
    {
        OnWaterFightCmdText(playerid);
        return 1;
    }

#if Feature::DisableRaces == 0
    if (strcmp(cmdtext, "/race", true, 5) == 0)
    {

        if(CheckMapZoneRaceCmd(playerid))
        {
            return 1;
        }

        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You need to be outside to compete in races!");
            return 1;
        }

        // Simple fix for now. Support for interior starting isn't really needed.
        new szParameters[ 256 ], iLen = 5;
        if (strlen(cmdtext) <= 5) {
            return CRace__OnCommand( playerid, "" );
        }
        else
        {
            if (cmdtext[5] == ' ') iLen = 6;
            format( szParameters, 256, "%s", cmdtext[ iLen ] );
            return CRace__OnCommand( playerid, szParameters);
        }
    }

    if(!strcmp(cmdtext, "/drift", true))
    {
        CRace__ShowPlayerDialog( playerid, RACE_TYPE_DRIFT);
        return 1;
    }
#endif

    // There's plenty of people missing here?
    if(strcmp(cmd, "/credits", true) == 0) 
    {
        new szVerString[128];
        format(szVerString, 128, "Las Venturas Playground v%d.%d (build: %d, revision: %d) Credits:", Version::Major, Version::Minor, __BUILD__, __REVISION__);
        SendClientMessage(playerid, Color::Error, szVerString);
        SendClientMessage(playerid, Color::Success, " Developers: {CCFFFF}Russell, Peter, Kase, Jay, MrBondt, cake, thiaZ, Matthias, Xanland, TransporterX,");
        SendClientMessage(playerid, Color::Success, " {CCFFFF}Fireburn, Wesley, JUTD, iou, tomozj, Badeend, Harry.");
        SendClientMessage(playerid, Color::Success, " Testers & Mappers: {CCFFFF}xBlueXFoxx, [Dx]SuicidalSpree, LilBoy, Plugy, LasTRace, Maikovich, Tpimp, Epiccc, LetzFetz, Joeri, Beaner,");
        SendClientMessage(playerid, Color::Success, " {CCFFFF}Biesmen, ZheMafo, Sadik, Rien, nielz, MacSto, Lithirm, Hitman, Halo, Gibbs, Cyrix404, Bloodster, Fuse, Darius, BRKHN, Holden.");
        SendClientMessage(playerid, Color::Success, " Special Thanks: {CCFFFF}striker, Sophia, eF.Pedro, Pugwipe, [Griffin], Chillosophy, JUTD, theHolyCow.");
        SendClientMessage(playerid, Color::Success, " Others: {CCFFFF}Pablo_Borsellino (pBoom), Slim.- (SF Airport), Incognito (Streamer Plugin), Y_Less (sscanf).");
        return 1;
    }


    if(strcmp(cmd, "/batfight", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }
        MiniGamesSignup(playerid, STATUS_BATFIGHT);
        return 1;
    }

    if(strcmp(cmd, "/massacre", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_CHAINSAW);
        return 1;
    }

    if(strcmp(cmd, "/spankme", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_DILDO);
        return 1;
    }

    if(strcmp(cmd, "/knockout", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_KNOCKOUT);
        return 1;
    }

    if(strcmp(cmd, "/grenade", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_GRENADE);
        return 1;
    }

    if(strcmp(cmd, "/rocket", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_ROCKET);
        return 1;
    }

    if(strcmp(cmd, "/sniper", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_SNIPER);
        return 1;
    }

    if (strcmp(cmd, "/shiptdm", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup( playerid, STATUS_SHIPTDM );
        return 1;
    }

    if(!strcmp(cmd, "/islanddm", true))
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_ISLANDDM);
        return 1;
    }

    if(strcmp(cmd,"/minigun", true) == 0) 
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid,STATUS_MINIGUN);
        return 1;
    }

    if(!strcmp(cmd,"/sawnoff",true))
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid,STATUS_SAWNOFF);
        return 1;
    }

    if(!strcmp(cmd, "/ww", true))
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_WALKWEAPON);
        return 1;
    }

    if(!strcmp(cmd, "/random", true))
    {
        if(GetPlayerInterior(playerid) != 0)
        {
            ShowBoxForPlayer(playerid, "You cannot use this command while you're in an interior!");
            return 1;
        }

        MiniGamesSignup(playerid, STATUS_RANDOMDM);
        return 1;
    }

#if Feature::DisableHay == 0
    if(!strcmp(cmd, "/haystack", true))
    {
        return hayOnCommand(playerid);
    }
#endif

    if(strcmp(cmd, "/ramping", true) == 0){

        if(ramping[playerid] == 0){

            // Check if ramping is disabled
            if ( RampingEnabled == false )
            {
                SendClientMessage(playerid,COLOR_RED, "Ramping has been temporary disabled by an administrator. Try again later.");
                return 1;
            }
            // End disabled check

            new cash = GetPlayerMoney(playerid);

            if(cash < 50000)
            {
                ShowBoxForPlayer(playerid, "Enabling of the ramping feature costs $50,000.");
                return 1;
            }

            ramping[playerid] = 1;
            SendClientMessage(playerid,COLOR_YELLOW, "You've enabled the ramping feature, get in a vehicle, press CTRL");
            SendClientMessage(playerid,COLOR_YELLOW, "to create a ramp and /my ramp [1-12] to change the kind of ramp.");

            GivePlayerMoney(playerid, -50000);

            return 1;
        } else if (ramping[playerid] == 1){
            ramping[playerid] = 0;
            SendClientMessage(playerid,COLOR_YELLOW, "You've disabled the ramping feature!");
            return 1;
        }

    }

    if(strcmp(cmd, "/animations", true) == 0)
    {
        SendClientMessage(playerid, COLOR_YELLOW, "These are the animation commands:");
        SendClientMessage(playerid, COLOR_WHITE, "/fu, /smoke, /haha, /wank, /vomit, /handsup, /sit, /kiss,");
        SendClientMessage(playerid, COLOR_WHITE, "/bitchslap, /piss, /wave, /lay, /dance.");
        SendClientMessage(playerid, COLOR_WHITE, "To end an animation, press the enter/leave vehicle key.");

        return 1;
    }

    if(!strcmp(cmdtext, "/lock", true))
    {
        if(GetPlayerState(playerid) != PLAYER_STATE_DRIVER)
        {
            ShowBoxForPlayer(playerid, "You need to be driving a vehicle to lock it.");
            return 1;
        }
        if(IsVehicleLocked(GetPlayerVehicleID(playerid)))
        {
            ShowBoxForPlayer(playerid, "This vehicle is already locked.");
            return 1;
        }
        SetVehicleLocked(GetPlayerVehicleID(playerid), true);
        ShowBoxForPlayer(playerid, "Vehicle locked!");
        return 1;
    }

    if(!strcmp(cmdtext, "/unlock", true))
    {
        if(GetPlayerState(playerid) != PLAYER_STATE_DRIVER)
        {
            ShowBoxForPlayer(playerid, "You need to be driving a vehicle to unlock it.");
            return 1;
        }
        if(!IsVehicleLocked(GetPlayerVehicleID(playerid)))
        {
            ShowBoxForPlayer(playerid, "This vehicle is already unlocked.");
            return 1;
        }
        SetVehicleLocked(GetPlayerVehicleID(playerid), false);
        ShowBoxForPlayer(playerid, "Vehicle unlocked!");
        return 1;
    }



    if(GetPlayerState(playerid) == PLAYER_STATE_ONFOOT) { // To make sure they can do the anim
        if(strcmp(cmd, "/dance", true) == 0) {

            if(DamageManager(playerid)->isPlayerFighting() == true)
            {
                SendClientMessage(playerid, COLOR_RED, "* You cannot use this command at the moment because you have recently been in a gun fight.");
                return 1;
            }

            new tmp[256];

            // Get the dance style param
            tmp = strtok(cmdtext, idx);
            if(!tmp[0]) {
                SendClientMessage(playerid,0xFF0000FF,"Usage: /dance [style 1-4]");
                return 1;
            }

            new dancestyle = strval(tmp);
            if(dancestyle < 1 || dancestyle > 4) {
                SendClientMessage(playerid,0xFF0000FF,"Usage: /dance [style 1-4]");
                return 1;
            }

            if(dancestyle == 1) {
                SetPlayerSpecialAction(playerid,SPECIAL_ACTION_DANCE1);
            } else if(dancestyle == 2) {
                SetPlayerSpecialAction(playerid,SPECIAL_ACTION_DANCE2);
            } else if(dancestyle == 3) {
                SetPlayerSpecialAction(playerid,SPECIAL_ACTION_DANCE3);
            } else if(dancestyle == 4) {
                SetPlayerSpecialAction(playerid,SPECIAL_ACTION_DANCE4);
            }
            return 1;
        }

        if (strcmp("/sit", cmdtext, true, 4) == 0) {
            // Small overhaul to use SA-MP's own Sit functions.
            ApplyAnimation(playerid,"MISC","SEAT_LR",4.1,0,0,0,1,1);
            iPlayerAnimation[playerid] = true;
            return 1;
        }

        if(strcmp(cmd, "/handsup", true) == 0) {
            SetPlayerSpecialAction( playerid, SPECIAL_ACTION_HANDSUP );
            iPlayerAnimation[playerid] = true;
            return 1;
        }

        if (strcmp(cmd, "/fu", true ) == 0)
        {
            ApplyAnimation( playerid,"ped", "fucku", 4.1, 0, 1, 1, 0, 0 );
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if (strcmp(cmd, "/smoke", true ) == 0)
        {
            SetPlayerSpecialAction(playerid, 21);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if (strcmp(cmd, "/haha", true ) == 0)
        {
            ApplyAnimation(playerid,"RAPPING","Laugh_01",4.1,0,1,1,0,0);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if (strcmp(cmd, "/wank", true ) == 0 || strcmp(cmd, "/fap", true, 4) == 0)
        {
            ApplyAnimation(playerid,"PAULNMAC","wank_loop",4.1,0,1,1,0,0);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if (strcmp(cmd, "/vomit", true ) == 0)
        {
            ApplyAnimation(playerid,"FOOD","EAT_Vomit_P",4.1,0,1,1,0,0);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if(strcmp(cmd, "/bitchslap", true) == 0)
        {
            new Target, tName[2][MAX_PLAYER_NAME+1], Float:tCoord[3], sNear[MAX_PLAYERS];

            if(GetPlayerMoney(playerid) < 15000) return ShowBoxForPlayer(playerid, "This animation costs $15000." );
            if(Time->currentTime() - g_LastSlapTime[playerid] < 10 && Player(playerid)->isAdministrator() == false)
            {
                ShowBoxForPlayer(playerid, "You can only slap every 10 seconds." );
                return 1;
            }
            if(GetPlayerState(playerid) != PLAYER_STATE_ONFOOT) return ShowBoxForPlayer(playerid, "You can only use this animation on foot!" );

            for (new slappedPlayerId = 0; slappedPlayerId <= PlayerManager->highestPlayerId(); slappedPlayerId++) {
                if (Player(slappedPlayerId)->isConnected() == false || Player(slappedPlayerId)->isNonPlayerCharacter() == true)
                    continue;

                if(slappedPlayerId != playerid) {
                    GetPlayerPos(slappedPlayerId, tCoord[0], tCoord[1], tCoord[2]);
                    if(IsPlayerInRangeOfPoint(playerid, 3, tCoord[0], tCoord[1], tCoord[2]) && GetPlayerState(slappedPlayerId) == PLAYER_STATE_ONFOOT)
                    {
                        Target = slappedPlayerId;
                        sNear[playerid] = 1;
                    }
                }
            }
            if(sNear[playerid] == 0) return ShowBoxForPlayer(playerid, "There's no one near you to slap!" );

            tName[0] = PlayerName(playerid);
            tName[1] = PlayerName(Target);

            ApplyAnimation(Target, "SWEET", "ho_ass_slapped", 4.1,0,1,1,0,0);
            ApplyAnimation(playerid,"SWEET","sweet_ass_slap",4.1,0,1,1,0,0);

            format(string, sizeof(string), "* %s slaps %s's ass!", tName[0], tName[1]);
            SendClientMessageToAllEx(0x0099FFAA, string);
            GivePlayerMoney(playerid, -15000);

            g_LastSlapTime[playerid] = Time->currentTime();
            g_LastSlappedBy[Target] = playerid;

            return 1;
        }

        if (strcmp(cmd, "/piss", true ) == 0)
        {
            SetPlayerSpecialAction(playerid,68);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if (strcmp(cmd, "/wave", true ) == 0)
        {
            ApplyAnimation(playerid,"KISSING","BD_GF_Wave",4.1,0,1,1,0,0);
            new Float: pAngle;
            GetPlayerFacingAngle(playerid, pAngle);
            SetPlayerFacingAngle(playerid, pAngle + 180);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if (strcmp(cmd, "/kiss", true ) == 0)
        {
            ApplyAnimation(playerid, "BD_FIRE", "Grlfrd_Kiss_03", 4.1, 0, 1, 1, 0, 0);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
        if (strcmp(cmd, "/lay", true ) == 0)
        {
            ApplyAnimation(playerid,"SUNBATHE","batherdown",4.1,0,1,1,1,1, 1);
            iPlayerAnimation[playerid] = true;
            return 1;
        }
    }

    if(strcmp(cmd, "/customtax", true) == 0)
    {
        // If a player owns L.V airport, they can set the customs tax value.
        new tmp[256];
        new ctax;

        new propertyId = PropertyManager->propertyForSpecialFeature(CustomTaxAirportFeature),
            endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

        // Does the player own the airport?
        if (endid != playerid)
            return 0;

        // Have they used the correct params?
        tmp = strtok(cmdtext, idx);

        new message[128];

        new const maximumTax = GetEconomyValue(AirportCustomsTaxMax);
        new const minimumTax = GetEconomyValue(AirportCustomsTaxMin);

        if(!tmp[0])
        {
            SendClientMessage(playerid, COLOR_WHITE, "Use: /customtax [amount]");
            format(message, sizeof(message), "The custom tax must be between $%s and $%s.",
                formatPrice(minimumTax), formatPrice(maximumTax));

            SendClientMessage(playerid, COLOR_WHITE, message);
            return 1;
        }

        // have they used the cmd within the last 5 mins?
        if(Time->currentTime() - g_FlagTime[playerid][0] < 60*5)
        {
            ShowBoxForPlayer(playerid, "You can only change the airport custom tax every five minutes.");
            return 1;
        }

        ctax = strval(tmp);

        // Have they set a valid value?
        if (ctax > maximumTax) {
            format(message, sizeof(message), "You can't set the custom tax above $%s.", formatPrice(maximumTax));
            ShowBoxForPlayer(playerid, message);
            return 1;
        }

        if (ctax < minimumTax) {
            format(message, sizeof(message), "You can't set the custom tax below $%s.", formatPrice(minimumTax));
            ShowBoxForPlayer(playerid, message);
            return 1;
        }

        // Otherwise, set the customs tax :>
        SetEconomyValue(AirportCustomsTax, ctax);

        format(message, sizeof(message), "~r~~h~%s~w~ has set the airport customs tax as ~y~$%d~w~ (~p~/customtax~w~)",
            Player(playerid)->nicknameString(), ctax);
        NewsController->show(message);

        g_FlagTime[playerid][0] = Time->currentTime();
        return 1;
    }

    if(strcmp(cmd, "/borrow", true) == 0){

        new tmp[256];
        tmp = strtok(cmdtext, idx);

        if(!tmp[0]) {
            SendClientMessage(playerid, COLOR_WHITE, "Usage: /borrow [amount]");
            return 1;
        }

        moneys = strval(tmp);

        if( moneys < 0 )
        {
            ShowBoxForPlayer(playerid, "You can't borrow a negative amount of money!");
            return 1;
        }

        if( moneys < 100)
        {
            ShowBoxForPlayer(playerid, "You have to borrow at least $100!");
            return 1;
        }

        if( moneys == 0 ){
            moneys = MAX_LOAN - iLoan[playerid];
        }

        if( iLoan[playerid] >= MAX_LOAN ){
            ShowBoxForPlayer(playerid, "You have already borrowed 500.000 dollar!");
            return 1;
        }

        if( ( iLoan[playerid] + moneys ) > MAX_LOAN )
        {

            new over;
            over = MAX_LOAN - iLoan[playerid];

            format(string, sizeof(string), "You can borrow $%d before you reach your limit!", over);
            ShowBoxForPlayer(playerid, string);
            return 1;
        }

        if(iLoan[playerid] > 0 && iLoanPercent[playerid] != bankRente){
            format(string,sizeof(string), "The interest rate of your loan has changed to %d%%.",bankRente);
            ShowBoxForPlayer(playerid, string);
        }

        canMoney[playerid] += moneys;
        GivePlayerMoney(playerid, moneys);
        iLoan[playerid] += moneys;
        iLoanPercent[playerid] = bankRente;

        new name[24];
        GetPlayerName(playerid, name, 24);

        format(string, sizeof(string), "You have borrowed $%d at this moment,", iLoan[playerid]);
        SendClientMessage(playerid, COLOR_RED, string );
        format(string, sizeof(string), "at an interest of %d percent per minute.", iLoanPercent[playerid]);
        SendClientMessage(playerid, COLOR_RED, string);
        return 1;

    }

    if(strcmp(cmd, "/locations", true) == 0)
    {
        SendClientMessage(playerid, COLOR_GREEN, "Taxi locations:");
        SendClientMessage(playerid, COLOR_ORANGE, "0: Pirate Ship    1: Police Station    2: LV Airport");
        SendClientMessage(playerid, COLOR_ORANGE, "3: Mount Chiliad  4: Ammu-Nation  5: Area 69");
        SendClientMessage(playerid, COLOR_ORANGE, "6: Airstrip       7: Basejumping       8: San Fierro Airport");
        SendClientMessage(playerid, COLOR_ORANGE, "9: Los Santos Airport 10: LV Main Bank 11: LV Train Station");
        SendClientMessage(playerid, COLOR_ORANGE, "12: LV Fight Club");
        return 1;
    }

    if(strcmp(cmd, "/me", true) == 0 ){
        new tmp[256];
        tmp = strtok(cmdtext, idx);

        if (MuteManager->isMuted(playerid)) {
            ShowBoxForPlayer(playerid, "You can't use this command whilst being muted.");
            return 1;
        }

        if(!tmp[0])
        {
            SendClientMessage(playerid, COLOR_WHITE, "Usage: /me [message");
            return 1;
        }

        new name[32];
        GetPlayerName(playerid, name, 32);

        new color = ColorManager->playerColor(playerid);

        format(string,256,"[me] %d %s %s",playerid, name, right(cmdtext,(strlen(cmdtext)-4)));
        AddEcho(string);

        format(string,sizeof(string), "* %s %s", name, right(cmdtext,(strlen(cmdtext)-4)));

        SetPlayerChatBubble(playerid, right(cmdtext,(strlen(cmdtext)-4)), color, 50, 10*1000);

        new iMyWorld = GetPlayerVirtualWorld( playerid );

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if (!IsPlayerConnected( i ))
                continue;

            if (g_Ignore[ i ][ playerid ] == true)
                continue;

            if (GetPlayerVirtualWorld(i) != iMyWorld && (PlayerSettings(i)->isAllVirtualWorldChatEnabled() == false
                || Player(i)->isAdministrator() == false))
                continue;

            SendClientMessage(i, color, string);
        }

        return 1;

    }

    if(strcmp(cmd, "/payoff", true) == 0) {

        new tmp[256];
        tmp = strtok(cmdtext, idx);

        if(!tmp[0]) 
        format(tmp,sizeof(tmp),"%d",iLoan[playerid]);

        moneys = strval(tmp);

        // hebben we wel een lening?
        if( iLoan[playerid] == 0 )
        {
            ShowBoxForPlayer(playerid, "You don't have a loan!");
            return 1;
        }

        // minder dan 1 dollar aflossen?
        if( moneys < 1 )
        {
            ShowBoxForPlayer(playerid, "You have to pay off a minimum of 1 dollar!");
            return 1;
        }

        // Meer dan wat je bezit aflossen?
        if( GetPlayerMoney(playerid) < 0 )
        {
            ShowBoxForPlayer(playerid, "You can't pay off a loan with money which isn't yours!");
            return 1;
        }

        if( GetPlayerMoney(playerid) < moneys ){
            moneys = GetPlayerMoney(playerid);
        }
        // meer dan de lening aflossen?
        if( moneys > iLoan[playerid] )
        moneys = iLoan[playerid];


        GivePlayerMoney(playerid, 0-moneys);
        iLoan[playerid] = iLoan[playerid] - moneys;

        if( iLoan[playerid] == 0 ) 
        {
            ShowBoxForPlayer(playerid, "Your loan is paid off!");
            return 1;
        }
        else{
            format(string, sizeof(string), "Your outstanding loan is $%s (%d percent interest).", formatPrice(iLoan[playerid]), iLoanPercent[ playerid ]);
            ShowBoxForPlayer(playerid, string );
        }

        return 1;

    }

    if (strcmp(cmd, "/admins", true) == 0) {
        SendClientMessage(playerid, Color::Success, "Crew connected:");

        new message[128], crewCount = 0, playerLevel[30];
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == false) continue;
            if (Player(player)->isAdministrator() == false) continue;

            if (Player(player)->isAdministrator() == true && Player(player)->isManagement() == false)
                format(playerLevel, sizeof(playerLevel), "Administrator");
            else if (Player(player)->isManagement() == true)
                format(playerLevel, sizeof(playerLevel), "Manager");

            // Format the message for any general player.
            format(message, sizeof(message), " %s (Id:%d) - {FF8E02}%s", Player(player)->nicknameString(),
                player, playerLevel);

            // If the user was temp'd, show admins who temp'd the player.
            if (tempLevel[player] == 1 || tempLevel[player] == 2) {
                if (Player(playerid)->isAdministrator() == true)
                    format(message, sizeof(message), " %s {CCCCCC}(temp'd by %s){FFFFFF} (Id:%d) - {FF8E02}%s",
                        Player(player)->nicknameString(), UserTemped[player], player, playerLevel);
            }

            // If a player is undercover, show this to other admins.
            if (UndercoverAdministrator(player)->isUndercoverAdministrator() == true) {
                if (Player(playerid)->isAdministrator() == true) {
                    new originalUsername[MAX_PLAYER_NAME+1];
                    UndercoverAdministrator(player)->getOriginalUsername(originalUsername, sizeof(originalUsername));
                    format(playerLevel, sizeof(playerLevel), "Undercover %s",
                        (Player(player)->isManagement() ? "Manager" : "Administrator"));

                    format(message, sizeof(message), " %s {CCCCCC}(%s){FFFFFF} (Id:%d) - {FF8E02}%s",
                        Player(player)->nicknameString(), originalUsername, player, playerLevel);
                } else continue;
            }

            SendClientMessage(playerid, Color::Information, message);
            crewCount++;
        }

        if (crewCount == 0)
            SendClientMessage(playerid, Color::Information, " There is currently no crew online!");

        return 1;
    }

    if(strcmp(cmd, "/dev", true) == 0) {
        if (Player(playerid)->isDeveloper() == true || Player(playerid)->isAdministrator() == true) {
            if (strlen(cmdtext) <= 5) {
                SendClientMessage(playerid, Color::Information, "This command sends a message to #LVP.Dev.");
                SendClientMessage(playerid, Color::Information, " Usage: /dev [message]");
                return 1;
            }

            new message[128];
            format(message, sizeof(message), "[dev] %s %s", Player(playerid)->nicknameString(), cmdtext[5]);
            AddEcho(message);

            format(message, sizeof(message), "Message sent to #LVP.Dev: %s", cmdtext[5]);
            SendClientMessage(playerid, Color::Success, message);
        }

        return 1;
    }

    // The /regular command shows a bunch of options for regular
    // players. Extra commands and stuff, that, or the time left
    // to go for people who aren't regulars yet.
    if (strcmp( cmd, "/regular", true) == 0) {
        if (Player(playerid)->isRegular() == false) {
            if (Player(playerid)->isRegistered() == false) {
                SendClientMessage( playerid, COLOR_WHITE, "Please register on www.sa-mp.nl/ before");
                SendClientMessage( playerid, COLOR_WHITE, "even thinking about access to regular commands ;)" );
                return 1;
            }
            else
            {
                format( string, sizeof( string ), "You have %d hours to go before you become a regular!", ( Player::RegularHours - gameplayhours[ playerid ] ) );
                ShowBoxForPlayer(playerid, string);
                return 1;
            }
        }

        // Now just send an overview of commands for the player.
        SendClientMessage( playerid, COLOR_YELLOW, "Available regular commands" );
        SendClientMessage( playerid, COLOR_WHITE, "/regular /settings /ignore /unignore /ignored" );
        SendClientMessage( playerid, COLOR_WHITE, "Note: use ;<message> to talk in the regular chat.");

        return 1;
    }

    if(strcmp(cmd, "/cardive", true) == 0 )
    {
        if(DamageManager(playerid)->isPlayerFighting() == true)
        {
            SendClientMessage(playerid,COLOR_RED,"You cannot teleport at the moment because you have recently been in a gun fight.");
            return 1;
        }

        if( GetPlayerMoney( playerid ) > 9999 || Player(playerid)->isAdministrator()){

            new Float:x;
            new Float:y;
            new Float:z;

            new pid = playerid;

            if(Player(playerid)->isAdministrator() == true){
                new tmp[256];
                tmp = strtok(cmdtext, idx);
                if(tmp[0]){
                    if(IsNumeric(tmp))
                    pid = strval(tmp);
                    else
                    pid = GetPlayerId(tmp);

                    if(!Player(pid)->isConnected()){
                        format(string,sizeof(string), "The requested player (ID:%d) is not present!", pid);
                        SendClientMessage(playerid, COLOR_RED, string);
                        return 1;
                    }
                }
            }

            if(Time->currentTime() - iDiveTime[playerid] > 1*60 || Player(playerid)->isAdministrator())
            {

                if(IsPlayerInAnyVehicle(pid) == 1)
                {

                    if(GetPlayerState(playerid) == PLAYER_STATE_PASSENGER && Player(playerid)->isAdministrator() == false)
                    {
                        SendClientMessage(playerid, COLOR_RED, "Only the driver can do this!");
                        return 1;
                    }

                    if (Player(playerid)->isAdministrator() == false)
                        GivePlayerMoney( playerid, -10000 );

                    new vehicleID;
                    vehicleID = GetPlayerVehicleID(pid);
                    GetPlayerPos(pid, x, y, z);
                    iDiveTime[playerid] = Time->currentTime();
                    if( (z+500) > 650 )
                    z = 150;
                    SetVehiclePos(vehicleID, x,y,z+500);
                    ClearPlayerMenus(playerid);

                    GameTextForPlayer(pid, "Jump!!!", 2000, 5 );

                    new name[24];
                    if(pid != playerid)
                    {
                        new name2[24];
                        GetPlayerName(playerid, name, 24);
                        GetPlayerName(pid, name2, 24);
                        if(strcmp(name2,"Peter",true) != 0)
                        format(string,sizeof(string),"%s (Id:%d) has forced a cardive on %s (Id:%d).", name, playerid, name2, pid);
                        Admin(playerid, string);
                    }
                    else
                    {
                        GetPlayerName(playerid, name, 24);
                        format(string,sizeof(string),"%s (Id:%d) did a cardive.", name, playerid);
                        Admin(playerid, string);
                    }
                    return 1;
                }
                else 
                {
                    SendClientMessage(playerid, 0xAA3333AA, "You've to be in a car to use this command!");
                    return 1;
                }
            }
            else 
            {
                SendClientMessage(playerid,COLOR_RED, "You can dive only once per 3 minutes");
                return 1;
            }
        }
        else 
        {
            SendClientMessage(playerid,COLOR_RED, "You don't have enough cash (10000 dollar)");
            return 1;
        }
    }

    if(strcmp(cmd, "/dive", true) == 0 )
    {
        if(DamageManager(playerid)->isPlayerFighting() == true)
        {
            SendClientMessage(playerid, COLOR_RED, "You cannot dive at the moment because you have recently been in a gun fight.");
            return 1;
        }

        if(iPlayerInVipRoom[playerid])
        {
            SendClientMessage(playerid, COLOR_RED, "You cannot dive out of the VIP room.");
            return 1;
        }

        new Interior = GetPlayerInterior( playerid );
        new Float:fX, Float:fY, Float:fZ;
        GetPlayerPos( playerid, fX, fY, fZ );
        if (Interior != 0)
        {
            SendClientMessage( playerid, COLOR_RED, "You cannot teleport in interiors!" );
            return 1;
        }

        if (GetPlayerSpecialAction( playerid ) == SPECIAL_ACTION_USECELLPHONE)
        {
            SendClientMessage( playerid, COLOR_RED, "You cannot dive when you're on the phone!" );
            return 1;
        }

        if( GetPlayerMoney( playerid ) < 7499 && Player(playerid)->isAdministrator() == false)
        {
            SendClientMessage(playerid,COLOR_RED, "You don't have enough cash (7500 dollar)");
            return 1;
        }

        if( Time->currentTime() - iDiveTime[playerid] < 1*60 && Player(playerid)->isAdministrator() == false)
        {
            SendClientMessage(playerid,COLOR_RED, "You can dive only once per 3 minutes");
            return 1;
        }

        GivePlayerMoney( playerid, -7500 );

        GiveWeapon(playerid, 46, 0 );
        GetPlayerPos(playerid, fX, fY, fZ );
        iDiveTime[playerid] = Time->currentTime();
        if( (fZ+500) > 650 )
        fZ = 0;
        ClearPlayerMenus(playerid);
        SetPlayerPos(playerid, fX, fY, fZ+500);

        GameTextForPlayer(playerid, "Jump!!!", 2000, 5 );

       new adminNotice[128], sPlayerName[MAX_PLAYER_NAME+1];
        GetPlayerName(playerid, sPlayerName, sizeof(sPlayerName));
        format(adminNotice, sizeof(adminNotice), "%s (Id:%d) has used /dive.", sPlayerName, playerid);
        Admin(playerid, adminNotice);

        return 1;
    }

    if(strcmp(cmd, "/wanted", true) == 0)
    {
        WantedLevel__OnPlayerCommandText (playerid);
        return 1;
    }

    if( strcmp( cmd, "/givecash", true) == 0 )
    {
        new iTmp[ 256 ], iGivePlayerID;
        iTmp = strtok(cmdtext, idx);

        if(Time->currentTime() - iCashTime[playerid] < 15 && Player(playerid)->isAdministrator() == false)
        {
            SendClientMessage( playerid, COLOR_RED, "You can only send money every 15 seconds." );
            return 1;
        }

        if( !strlen( iTmp ) )
        {
            SendClientMessage( playerid, COLOR_WHITE, "Usage: /givecash [player] [amount]");
            return 1;
        }

        if( IsNumeric( iTmp ) )
        {
            iGivePlayerID = strval( iTmp );
        }
        else
        {
            iGivePlayerID = GetPlayerId( iTmp );

            if( iGivePlayerID == Player::InvalidId )
            {
                format(string,sizeof(string), "Player '%s' is not connected.", iTmp);
                SendClientMessage(playerid, COLOR_RED, string);
                return 1;
            }
        }

        iTmp = strtok(cmdtext, idx);

        if( !strlen( iTmp ) )
        {
            SendClientMessage( playerid, COLOR_WHITE, "Usage: /givecash [player] [amount]");
            return 1;
        }

        new iMoney = strval( iTmp );

        if ( !IsPlayerConnected( iGivePlayerID ) )
        {
            format(string, sizeof(string), "%d is not an active player.", iGivePlayerID);
            SendClientMessage(playerid, COLOR_YELLOW, string);
            return 1;
        }

        if(IsPlayerInMinigame(iGivePlayerID))
        {
            SendClientMessage(playerid,COLOR_RED,"* You can't transfer money to a player who is taking part in a minigame.");
            return 1;
        }

        if(iMoney <= 0)
        {
            SendClientMessage( playerid, COLOR_RED, "Error: A minimum of $1 is required." );
            return 1;
        }

        if(iMoney > 10000000)
        {
            SendClientMessage( playerid, COLOR_RED, "Error: You can send a maximum of $10,000,000 per transaction." );
            return 1;
        }

        if(GetPlayerMoney( playerid ) < iMoney)
        {
            SendClientMessage( playerid, COLOR_RED, "Error: You have insufficient funds to carry out this transaction." );
            return 1;
        }

        new iGivePlayerName[ 24 ], iSenderName[ 24 ];
        GetPlayerName( iGivePlayerID, iGivePlayerName, 24);
        GetPlayerName( playerid, iSenderName, 24);

        GivePlayerMoney( playerid, ( 0 - iMoney ) );
        GivePlayerMoney( iGivePlayerID, iMoney );

        format(string, sizeof(string), "You have sent %s (id: %d), $%d.", iGivePlayerName, iGivePlayerID, iMoney);
        SendClientMessage(playerid, COLOR_YELLOW, string);

        format(string, sizeof(string), "You have received $%d from %s (id: %d).", iMoney, iSenderName, playerid);
        SendClientMessage(iGivePlayerID, COLOR_YELLOW, string);

        iCashTime[playerid] = Time->currentTime();
        canMoney[ iGivePlayerID ] += iMoney;

        format(string,sizeof(string), "%s (Id:%d) has transfered $%s to %s (Id:%d).", iSenderName, playerid, formatPrice(iMoney), iGivePlayerName, iGivePlayerID);
        Admin(playerid, string);

        return 1;
    }

    if(strcmp(cmd, "/back", true) == 0 ){

        // Lets block Rhino's from being teleported into town.
        if(GetVehicleModel(GetPlayerVehicleID(playerid)) == 432)
            return SendClientMessage(playerid, COLOR_RED, "You can't tow a Rhino!");

        // Lets also block town for vortexes to prevent the annoying driveby's with it.
        if(GetVehicleModel(GetPlayerVehicleID(playerid)) == 539)
            return SendClientMessage(playerid, COLOR_RED, "You can't teleport a Vortex!");

        if(isInSF[playerid])
        {
            if(GetPlayerInterior(playerid) != 0)
            {
                SendClientMessage(playerid,COLOR_RED,"You have to be outside any interior to use this command.");
                return 1;
            }

            if(Time->currentTime() - iTuneTime[playerid] < 15)
                return SendClientMessage(playerid, COLOR_RED, "* You have to wait 15 seconds to use this command.");

            isInSF[playerid] = false;
            new mVID = GetPlayerVehicleID(playerid);
            SetVehiclePos(mVID, 2257.6133,2233.3518,10.4252);

            SendClientMessage(playerid,COLOR_WHITE,"* Welcome back to Las Venturas.");
            return 1;
        }

        else
        { // Ironically, this would have worked as is, perfectly, anyway
            SendClientMessage(playerid, COLOR_RED, "You have to use /tune before you can use /back!");
            return 1;
        }
    }

    if (strcmp( cmd, "/export", true ) == 0)
    {
        CExport__OnCommand( playerid );
        return 1;
    }


    if(strcmp(cmd, "/deliver", true) == 0){
        PrepareDelivery(playerid);
        return 1;
    }

    // End of OnPlayerCommandText callback.
    ShowBoxForPlayer(playerid, "That command was not found. Try /commands.");
    return 1;
}
