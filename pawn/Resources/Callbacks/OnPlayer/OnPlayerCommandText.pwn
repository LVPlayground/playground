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

forward OnPlayerCommand(playerid, cmdtext[]);
public OnPlayerCommand(playerid, cmdtext[]) {
    lvp_command(My, 2, PlayerLevel);
    lvp_command(p, 1, AdministratorLevel);
    return 1;
}

// All commands entered by players will end up in this callback.
public OnPlayerCommandText(playerid, cmdtext[]) {
    if (strlen(cmdtext) == 1)
        return 1; // we don't want crashes when the player types '/'

    if (!Player(playerid)->isConnected())
        return 1; // we haven't marked this player as being connected

    new cmd[256], idx;
    cmd = strtok(cmdtext, idx);

    // Convert uppercase to lowercase.
    for (new i = 0; i < strlen(cmd); i++)
        cmd[i] = tolower(cmd[i]);

    // Is the player currently falling? Impose limited functionality.
    if (DamageManager(playerid)->isPlayerFalling() && !IsCommandAvailableForLimitedFunctionality(cmd))
        return 1;

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

    new namex[24];
    GetPlayerName( playerid, namex, 24 );
    param_reset();
    new string[256];

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
        SendClientMessage(playerid,Color::Red,"* You cannot use commands when you are wasted!");
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
            SendClientMessage(playerid,Color::Red,"You have already signed up with a different minigame.");
            return 1;
        }
    }

#if Feature::DisableFights == 0
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
            SendClientMessage(playerid, Color::Red, "You are currently being chased -- do not abuse your administrative power to use commands.");
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

#if Feature::DisableFights == 0
    if(!strcmp(cmd, "/dm", true))
    {
        ShowDeathmatchDialog(playerid);
        return 1;
    }
#endif

    // Rivershell minigame
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

        new const price = GetEconomyValue(MinigameParticipation);

        if(GetPlayerMoney(playerid) < price)
        {
            new message[128];
            format(message, sizeof(message), "You need $%s to take part in the minigame!", formatPrice(price));

            ShowBoxForPlayer(playerid,message);
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
            SendClientMessage(playerid,Color::Red,"Rivershell is already running.");
            return 1;
        }
    }

    // Brief minigame

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

        new const price = GetEconomyValue(MinigameParticipation);
        new message[128];

        if(GetPlayerMoney(playerid) < price)
        {
            format(message, sizeof(message), "You need $%s to take part in this minigame!", formatPrice(price));
            ShowBoxForPlayer(playerid, message);
            return 1;
        }

        if(briefStatus == BRIEF_STATE_EMPTY)
        {
            CBrief__Initalize(playerid);
            format(message,sizeof(message),"%s (Id:%d) has signed up for /brief.",PlayerName(playerid),playerid);
            Admin(playerid, message);
            CBrief__SignPlayerUp(playerid);
            return 1;
        }

        if(!isPlayerBrief[playerid])
        {
            CBrief__SignPlayerUp(playerid);
            format(message,sizeof(message),"%s (Id:%d) has signed up for /brief.",PlayerName(playerid),playerid);
            Admin(playerid, message);
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
            GivePlayerMoney(playerid, -iAmount);  // /bagmoney
            iCashAddTime[playerid] = GetTickCount();
        }
        return 1;
    }

    if(strcmp(cmd, "/rconadmin", true) == 0 && IsPlayerAdmin(playerid))
    {
        // An RCON admin has requested management perms.. we give them.
        Player(playerid)->setLevel(ManagementLevel, /* isTemporary= */ false);

        // However we don't let them know, because it's tradition.
        return 0;
    }

    if(PlayerHandOfGod[playerid] == 1)
    {
    //  SendClientMessage(playerid, Color::Red, "Commands are temporary disabled for you!");
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

        if(GetPlayerInterior(playerid) != 0 || iPlayerInVipRoom[playerid])
        {
            ShowBoxForPlayer(playerid, "You can't use this command while being in an interior!");
            return 1;
        }

        if(ShipManager->isPlayerWalkingOnShip(playerid))
        {
            ShowBoxForPlayer(playerid, "You're currently on the ship, thus can't use this command.");
            return 1;
        }

        if(PlayerSpectateHandler->isSpectating(playerid)) {
            ShowBoxForPlayer(playerid, "You can't do this while spectating. Please stop spectating.");
            return 1;
        }

        preventKillLamers[playerid] = 1;
        SetPlayerHealth(playerid, 0.0);

        new notice[64];
        format(notice, sizeof(notice), "~r~~h~%s~w~ has killed themselves (~p~/kill~w~)", Player(playerid)->nicknameString());
        AnnounceNewsMessage(notice);

        return 1;
    }

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
        SendClientMessage(playerid,COLOR_LIGHTBLUE,"IRC channel, ingame ranks, commands and much more! Please check out /vip and visit https://sa-mp.nl/donate");
        return 1;
    }

    // Commands for testing:
#if Feature::DisableFights == 0
    lvp_command(Fight,          5, PlayerLevel);
#endif

    // Commands for Regulars;
    lvp_command(settings,       8, PlayerLevel);

    // Popular, large, commands:
    lvp_command(cd,             2, PlayerLevel);
    lvp_command(World,          5, PlayerLevel);

    // General player commands:
    lvp_command(Commands,       8, PlayerLevel);
    lvp_command(cmds,           4, PlayerLevel);
    lvp_command(Minigames,      9, PlayerLevel);
    lvp_command(Teles,          5, PlayerLevel);
    lvp_command(Find,           4, PlayerLevel);
    lvp_command(Has,            3, PlayerLevel);
    lvp_command(locate,         6, PlayerLevel);
    lvp_command(lyse,           4, PlayerLevel);
    lvp_command(taxi,           4, PlayerLevel);
    lvp_command(tow,            3, PlayerLevel);
    lvp_command(countdown,      9, PlayerLevel);
    lvp_command(interest,       8, PlayerLevel);
    lvp_command(stats,          5, PlayerLevel);
    lvp_command(jump,           4, PlayerLevel);
    lvp_command(tune,           4, PlayerLevel);
    lvp_command(Robbery,        7, PlayerLevel);
#if Feature::DisableFights == 0
    lvp_command(Wwtw,           4, PlayerLevel);
    lvp_command(Rwtw,           4, PlayerLevel);
#endif
    lvp_command(minigaming,    10, PlayerLevel);

    // Commands for administrators:
    lvp_command(t,              1, AdministratorLevel);
    lvp_command(hasfix,         6, AdministratorLevel);

#if Feature::DisableFights == 0
    lvp_command(resetfc,        7, AdministratorLevel);
    lvp_command(resetmatch,    10, AdministratorLevel);
#endif
    lvp_command(chase,          5, AdministratorLevel);
    lvp_command(fetch,          5, AdministratorLevel);
    lvp_command(stopchase,      9, AdministratorLevel);
    lvp_command(set,            3, AdministratorLevel);

#if Feature::DisableFights == 0
    lvp_command(fixminigames,  12, AdministratorLevel);
#endif

    lvp_command(hs,             2, PlayerLevel);

    // ----------------------------

#if Feature::DisableFights == 0
    if(!strcmp(cmdtext, "/waterfight", true))
    {
        OnWaterFightCmdText(playerid);
        return 1;
    }
#endif


#if Feature::DisableFights == 0

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

#endif

    if(strcmp(cmd, "/ramping", true) == 0){

        if(ramping[playerid] == 0){
            ramping[playerid] = 1;

            SendClientMessage(playerid,COLOR_YELLOW, "You've enabled the ramping feature, get in a vehicle, press CTRL");
            SendClientMessage(playerid,COLOR_YELLOW, "to create a ramp and /my ramp [1-12] to change the kind of ramp.");

            return 1;
        } else if (ramping[playerid] == 1){
            ramping[playerid] = 0;
            SendClientMessage(playerid,COLOR_YELLOW, "You've disabled the ramping feature!");
            return 1;
        }

    }

    if(GetPlayerState(playerid) == PLAYER_STATE_ONFOOT) { // To make sure they can do the anim
        if(strcmp(cmd, "/bitchslap", true) == 0)
        {
            new Target, tName[2][MAX_PLAYER_NAME+1], Float:tCoord[3], sNear[MAX_PLAYERS];

            new const price = GetEconomyValue(BitchSlapCommand);

            if(GetPlayerMoney(playerid) < price) {
                format(string, sizeof(string), "This animation costs $%s.", formatPrice(price));
                ShowBoxForPlayer(playerid, string);
                return 1;
            }

            if(Time->currentTime() - g_LastSlapTime[playerid] < 10 && !Player(playerid)->isAdministrator()) {
                ShowBoxForPlayer(playerid, "You can only slap every 10 seconds." );
                return 1;
            }

            if(GetPlayerState(playerid) != PLAYER_STATE_ONFOOT) {
                ShowBoxForPlayer(playerid, "You can only use this animation on foot!" );
                return 1;
            }

            for (new slappedPlayerId = 0; slappedPlayerId <= PlayerManager->highestPlayerId(); slappedPlayerId++) {
                if (!Player(slappedPlayerId)->isConnected() || Player(slappedPlayerId)->isNonPlayerCharacter())
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

            if(sNear[playerid] == 0) {
                ShowBoxForPlayer(playerid, "There's no one near you to slap!" );
                return 1;
            }

            tName[0] = PlayerName(playerid);
            tName[1] = PlayerName(Target);

            ApplyAnimation(Target, "SWEET", "ho_ass_slapped", 4.1,0,1,1,0,0);
            ApplyAnimation(playerid,"SWEET","sweet_ass_slap",4.1,0,1,1,0,0);

            format(string, sizeof(string), "* %s slaps %s's ass!", tName[0], tName[1]);
            SendClientMessageToAllEx(0x0099FFAA, string);
            TakeRegulatedMoney(playerid, BitchSlapCommand);

            g_LastSlapTime[playerid] = Time->currentTime();
            g_LastSlappedBy[Target] = playerid;

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
            return 1;

        // Have they used the correct params?
        tmp = strtok(cmdtext, idx);

        new message[128];

        new const maximumTax = GetEconomyValue(AirportCustomsTaxMax);
        new const minimumTax = GetEconomyValue(AirportCustomsTaxMin);

        if(!tmp[0])
        {
            SendClientMessage(playerid, Color::White, "Use: /customtax [amount]");
            format(message, sizeof(message), "The custom tax must be between $%s and $%s.",
                formatPrice(minimumTax), formatPrice(maximumTax));

            SendClientMessage(playerid, Color::White, message);
            return 1;
        }

        // have they used the cmd within the last 5 mins?
        if(Time->currentTime() - g_FlagTime[playerid] < 60*5)
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
        AnnounceNewsMessage(message);

        g_FlagTime[playerid] = Time->currentTime();
        return 1;
    }

    if (strcmp(cmd, "/locations", true) == 0) {
        SendClientMessage(playerid, Color::Green, "Taxi locations:");
        SendClientMessage(playerid, COLOR_ORANGE, "0: Pirate Ship    1: Police Station    2: LV Airport");
        SendClientMessage(playerid, COLOR_ORANGE, "3: Mount Chiliad  4: Ammu-Nation  5: Area 69");
        SendClientMessage(playerid, COLOR_ORANGE, "6: Airstrip       7: Basejumping       8: San Fierro Airport");
        SendClientMessage(playerid, COLOR_ORANGE, "9: Los Santos Airport   10: LV Main Bank  11: LV Train Station");
        SendClientMessage(playerid, COLOR_ORANGE, "12: LV Fight Club       13: Bayside Marina   14: San Fierro Pier");
        if (Player(playerid)->isAdministrator())
            SendClientMessage(playerid, COLOR_ORANGE, "15: Los Santos Beach 16: Balloon (/t only)");
        else
            SendClientMessage(playerid, COLOR_ORANGE, "15: Los Santos Beach");
        return 1;
    }

    if (strcmp(cmd, "/borrow", true) == 0) {
        new amount[128];
        amount = strtok(cmdtext, idx);

        new maxAvailableLoan = Player(playerid)->isRegistered() ? 500000
                                                                :  10000;

        if (!strlen(amount)) {
            SendClientMessage(playerid, Color::Information, "Usage: /borrow [amount]");
            return 1;
        }

        new cashAmount = strval(amount);
        if (cashAmount < 100) {
            SendClientMessage(playerid, Color::Error, "Error: Borrow $100 or more.");
            return 1;
        }

        if (iLoan[playerid] >= maxAvailableLoan){
            format(string, sizeof(string), "Error: You've already borrowed $%s, use /payoff first.", formatPrice(maxAvailableLoan));
            SendClientMessage(playerid, Color::Error, string);
            return 1;
        }

        if ((iLoan[playerid] + cashAmount) > maxAvailableLoan) {
            new amountUntilLimit = maxAvailableLoan - iLoan[playerid];
            format(string, sizeof(string), "Error: You can borrow $%s before you reach the limit of $%s.",
                formatPrice(amountUntilLimit), formatPrice(maxAvailableLoan));
            SendClientMessage(playerid, Color::Error, string);
            return 1;
        }

        if (iLoan[playerid] > 0 && iLoanPercent[playerid] != bankRente){
            format(string, sizeof(string), "Notice: The interest rate of your loan has changed from %d to %d percent.",
                iLoanPercent[playerid], bankRente);
            SendClientMessage(playerid, Color::Information, string);
        }

        GivePlayerMoney(playerid, cashAmount);
        iLoan[playerid] += cashAmount;
        iLoanPercent[playerid] = bankRente;

        format(string, sizeof(string), "Success: You have borrowed $%s, at an interest of %d percent per minute.",
            formatPrice(iLoan[playerid]), iLoanPercent[playerid]);
        SendClientMessage(playerid, Color::Success, string);

        return 1;
    }

    if (strcmp(cmd, "/payoff", true) == 0) {
        new amount[128];
        amount = strtok(cmdtext, idx);

        if (iLoan[playerid] == 0) {
            SendClientMessage(playerid, Color::Error, "Error: You don't have a loan, use /borrow first.");
            return 1;
        }

        if (!strlen(amount)) 
            format(amount, sizeof(amount), "%d", iLoan[playerid]);

        new cashAmount = strval(amount);
        if (cashAmount < 100) {
            SendClientMessage(playerid, Color::Error, "Error: You have to pay off a minimum of $100.");
            return 1;
        }

        if (GetPlayerMoney(playerid) < cashAmount) {
            SendClientMessage(playerid, Color::Error, "Error: Insufficient funds to carry out this transaction.");
            return 1;
        }

        if (cashAmount > iLoan[playerid])
            cashAmount = iLoan[playerid];


        GivePlayerMoney(playerid, -cashAmount);
        iLoan[playerid] -= cashAmount;

        if (iLoan[playerid] == 0)
            SendClientMessage(playerid, Color::Success, "Success: Your loan is paid off.");
        else {
            SendClientMessage(playerid, Color::Success, "Success: Your loan is partly paid off.");
            format(string, sizeof(string), " Your outstanding loan is $%s (%d percent interest).", formatPrice(iLoan[playerid]), iLoanPercent[playerid]);
            SendClientMessage(playerid, Color::Information, string);
        }

        return 1;
    }

    if (strcmp(cmd, "/admins", true) == 0) {
        SendClientMessage(playerid, Color::Success, "Crew connected:");

        new message[128], crewCount = 0, playerLevel[30];
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (!Player(player)->isConnected()) continue;
            if (!Player(player)->isAdministrator()) continue;
            if (IsPlayerAdmin(player)) continue;

            if (Player(player)->isAdministrator() && !Player(player)->isManagement())
                format(playerLevel, sizeof(playerLevel), "Administrator");
            else if (Player(player)->isManagement())
                format(playerLevel, sizeof(playerLevel), "Manager");

            // Format the message for any general player.
            format(message, sizeof(message), " %s (Id:%d) - {FF8E02}%s", Player(player)->nicknameString(),
                player, playerLevel);

            // If the user was temp'd, show admins who temp'd the player.
            if (tempLevel[player] == 1 || tempLevel[player] == 2) {
                if (Player(playerid)->isAdministrator())
                    format(message, sizeof(message), " %s {CCCCCC}(temp'd by %s){FFFFFF} (Id:%d) - {FF8E02}%s",
                        Player(player)->nicknameString(), UserTemped[player], player, playerLevel);
            }

            // If a player is undercover, show this to other admins.
            if (UndercoverAdministrator(player)->isUndercoverAdministrator()) {
                if (tempLevel[playerid] == 2)
                    continue;  // people with temporary rights cannot see other undercover players

                if (Player(playerid)->isAdministrator()) {
                    new originalUsername[MAX_PLAYER_NAME+1];
                    UndercoverAdministrator(player)->getOriginalUsername(originalUsername, sizeof(originalUsername));
                    format(playerLevel, sizeof(playerLevel), "Undercover %s",
                        (Player(player)->isManagement() ? "Manager" : "Administrator"));

                    format(message, sizeof(message), " %s {CCCCCC}(%s){FFFFFF} (Id:%d) - {FF8E02}%s",
                        Player(player)->nicknameString(), originalUsername, player, playerLevel);
                } else
                    continue;
            }

            SendClientMessage(playerid, Color::Information, message);
            crewCount++;
        }

        if (crewCount == 0)
            SendClientMessage(playerid, Color::Information, " There is currently no crew ingame.");

        return 1;
    }

    if (strcmp(cmd, "/cardive", true) == 0) {
        if ((Time->currentTime() - iDiveTime[playerid]) < 3 * 60 && !Player(playerid)->isAdministrator()) {
            SendClientMessage(playerid, Color::Error, "Error: You can use this command once every 3 minutes.");
            return 1;
        }

        if (!CanPlayerTeleport(playerid)) {
            SendClientMessage(playerid, Color::Error, "Error: You can't use this command because you have recently been in a gun fight.");
            return 1;
        }

        if (IsPlayerInMinigame(playerid)) {
            SendClientMessage(playerid, Color::Error, "Error: You can't use this command during a minigame.");
            return 1;
        }

        if (GetPlayerInterior(playerid) != 0 || iPlayerInVipRoom[playerid]) {
            SendClientMessage(playerid, Color::Error, "Error: You can't use this command in interiors.");
            return 1;
        }

        if (GetPlayerState(playerid) != PLAYER_STATE_DRIVER) {
            SendClientMessage(playerid, Color::Error, "Error: You need to be driving a vehicle to execute this command.");
            return 1;
        }

        new const usagePrice = GetEconomyValue(CarDiveCommand);
        if (GetPlayerMoney(playerid) < usagePrice && !Player(playerid)->isAdministrator()) {
            format(string, sizeof(string), "Error: Insufficient funds, you'll need: $%s.", formatPrice(usagePrice));
            SendClientMessage(playerid, Color::Error, string);
            return 1;
        }

        new vehicleId = GetPlayerVehicleID(playerid), Float: position[3];
        GetVehiclePos(vehicleId, position[0], position[1], position[2]);
        if (position[2] > 750)
            position[2] = 750;

        ReportPlayerTeleport(playerid);

        ClearPlayerMenus(playerid);
        SetVehiclePos(vehicleId, position[0], position[1], position[2]+500);

        TakeRegulatedMoney(playerid, CarDiveCommand);
        iDiveTime[playerid] = Time->currentTime();

        format(string, sizeof(string), "%s (Id:%d) has used /cardive.", Player(playerid)->nicknameString(), playerid);
        Admin(playerid, string);

        return 1;
    }

    if (strcmp(cmd, "/dive", true) == 0) {
        if ((Time->currentTime() - iDiveTime[playerid]) < 3 * 60 && !Player(playerid)->isAdministrator()) {
            SendClientMessage(playerid, Color::Error, "Error: You can use this command once every 3 minutes.");
            return 1;
        }

        if (!CanPlayerTeleport(playerid)) {
            SendClientMessage(playerid, Color::Error, "Error: You can't use this command because you have recently been in a gun fight.");
            return 1;
        }

        if (IsPlayerInMinigame(playerid)) {
            SendClientMessage(playerid, Color::Error, "Error: You can't use this command during a minigame.");
            return 1;
        }

        if (GetPlayerInterior(playerid) != 0 || iPlayerInVipRoom[playerid]) {
            SendClientMessage(playerid, Color::Error, "Error: You can't use this command in interiors.");
            return 1;
        }

        new const usagePrice = GetEconomyValue(DiveCommand);
        if (GetPlayerMoney(playerid) < usagePrice && !Player(playerid)->isAdministrator()) {
            format(string, sizeof(string), "Error: Insufficient funds, you'll need: $%s.", formatPrice(usagePrice));
            SendClientMessage(playerid, Color::Error, string);
            return 1;
        }

        GiveWeapon(playerid, WEAPON_PARACHUTE, 1);

        new Float: position[3];
        GetPlayerPos(playerid, position[0], position[1], position[2]);
        if (position[2] > 750)
            position[2] = 750;

        ReportPlayerTeleport(playerid);

        ClearPlayerMenus(playerid);
        SetPlayerPos(playerid, position[0], position[1], position[2]+500);

        TakeRegulatedMoney(playerid, DiveCommand);
        iDiveTime[playerid] = Time->currentTime();

        format(string, sizeof(string), "%s (Id:%d) has used /dive.", Player(playerid)->nicknameString(), playerid);
        Admin(playerid, string);

        return 1;
    }

    if (strcmp(cmd, "/wanted", true) == 0) {
        WantedLevel__OnPlayerCommandText(playerid);
        return 1;
    }

    if (strcmp(cmd, "/back", true) == 0) {
        if (GetVehicleModel(GetPlayerVehicleID(playerid)) == 432) {
            SendClientMessage(playerid, Color::Error, "Error: You can't teleport a Rhino.");
            return 1;
        }

        if (GetVehicleModel(GetPlayerVehicleID(playerid)) == 539) {
            SendClientMessage(playerid, Color::Error, "Error: You can't teleport a Vortex.");
            return 1;
        }

        if (isInSF[playerid]) {
            if (GetPlayerInterior(playerid) != 0 || iPlayerInVipRoom[playerid]) {
                SendClientMessage(playerid, Color::Error, "Error: You have to be outside any interior to use this command.");
                return 1;
            }

            isInSF[playerid] = false;
            new vehicleId = GetPlayerVehicleID(playerid);
            SetVehiclePos(vehicleId, 2257.6133, 2233.3518, 10.4252);

            SendClientMessage(playerid, Color::Success, "Success: Welcome back to Las Venturas!");
        } else
            SendClientMessage(playerid, Color::Error, "Error: You have to use /tune before you can use /back.");

        return 1;
    }

    if (strcmp(cmd, "/export", true) == 0) {
        CExport__OnCommand(playerid);
        return 1;
    }


    if (strcmp(cmd, "/deliver", true) == 0) {
        PrepareDelivery(playerid);
        return 1;
    }

    ShowBoxForPlayer(playerid, "Error: This command does not exist. Try /commands or /help");
    return 1;
}
