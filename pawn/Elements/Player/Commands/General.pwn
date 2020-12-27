// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Command: /minigames
// Desc: Displays the minigame menu
// Author: Kase
lvp_Minigames(playerid, params[])
{
    if(DamageManager(playerid)->isPlayerFighting() == true)
    {
        ShowBoxForPlayer(playerid, "You can't bring up the minigames menu when you are fighting.");
        return 1;
    }

    if(GetPlayerInterior(playerid) != 0)
    {
        ShowBoxForPlayer(playerid, "You can't use this command while being in an interior!");
        return 1;
    }

#if Feature::DisableFights == 0
    ShowPlayerDialog(playerid, DIALOG_MINIGAMES, DIALOG_STYLE_LIST, "Choose your minigame!", "Deathmatch\nRace\nRobbery\nBriefcase\nRivershell\nLYSE\nWWTW\nRWTW\nWaterfight", "Play!", "Cancel");
#else
    ShowPlayerDialog(playerid, DIALOG_MINIGAMES, DIALOG_STYLE_LIST, "Choose your minigame!", "Robbery\nBriefcase\nRivershell\nLYSE", "Play!", "Cancel");
#endif

    #pragma unused params
    return 1;
}

// Command: minigaming
// Desc: Shows the players that are currently in a minigame
lvp_minigaming(playerid, params[]) {
    new minigaming[1800], colorBuffer[2][Color::TextualColorLength];

    for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
        if (Player(subjectId)->isConnected() == false || Player(subjectId)->isNonPlayerCharacter() == true)
            continue;

        if (!IsPlayerInMinigame(subjectId))
            continue;

        if (PlayerActivity(subjectId)->isJavaScriptActivity()) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t-", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (IsPlayerInMapZone(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s jump\t-", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (PlayerInfo[subjectId][PlayerStatus] >= STATUS_BATFIGHT && PlayerInfo[subjectId][PlayerStatus] <= STATUS_ISLANDDM) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t-", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (CHideGame__GetPlayerState(subjectId) == HS_STATE_PLAYING) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::White, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t{%s}%s", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                CHideGame__SeekerId() == subjectId ? colorBuffer[0] : colorBuffer[1],
                CHideGame__SeekerId() == subjectId ? "Seeker" : "Hider");
            continue;
        }

        if (CRobbery__GetPlayerStatus(subjectId) == ROBSTATUS_PLAYING) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t{%s}%s", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                CRobbery__GetPlayerTeam(subjectId) == ROBBERY_TEAMATTACK ? colorBuffer[0] : colorBuffer[1],
                CRobbery__GetPlayerTeam(subjectId) == ROBBERY_TEAMATTACK ? "Attackers" : "Defenders");
            continue;
        }

#if Feature::DisableFights == 0
        if (CFightClub__IsPlayerFighting(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s (/fight watch %d)\t-", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId), PlayerMatch[subjectId]);
            continue;
        }

        if (waterFightIsPlayerPlaying(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t-", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (rwIsPlayerSignedUp(subjectId) && rwGetState() == 3) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t{%s}%s", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                rwGetPlayerTeam(subjectId) == RW_TEAM_RED ? colorBuffer[0] : colorBuffer[1],
                rwGetPlayerTeam(subjectId) == RW_TEAM_RED ? "Red Team" : "Blue Team");
            continue;
        }
#endif

        if (CLyse__GetPlayerState(subjectId) != LYSE_STATE_NONE) {
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentGreen, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t{%s}%s", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                CLyse__GetPlayerTeam(subjectId) == TEAM_BLUE ? colorBuffer[0] : colorBuffer[1],
                CLyse__GetPlayerTeam(subjectId) == TEAM_BLUE ? "Blue Team" : "Green Team");
            continue;
        }

        if (isPlayerBrief[subjectId] && briefStatus == BRIEF_STATE_RUNNING) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t-", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (g_RivershellPlayer[subjectId] && g_RivershellState == RIVERSHELL_STATE_RUNNING) {
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentGreen, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t{%s}%s", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                p_Team[subjectId] == TEAM_BLUE ? colorBuffer[0] : colorBuffer[1],
                p_Team[subjectId] == TEAM_BLUE ? "Team Blue" : "Team Green");
            continue;
        }

#if Feature::DisableFights == 0
        if (WWTW_PlayerData[subjectId][iStatus] == 2) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id:%d)\t%s\t{%s}%s", minigaming,
                GetPlayerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                WWTW_PlayerData[subjectId][iPlayerTeam] == WWTW_TEAMATTACK ? colorBuffer[0] : colorBuffer[1],
                WWTW_PlayerData[subjectId][iPlayerTeam] == WWTW_TEAMATTACK ? "Attackers" : "Defenders");
            continue;
        }
#endif
    }

    if (!strlen(minigaming))
        SendClientMessage(playerid, Color::Error, "* No player is currently in a minigame.");
    else {
        strdel(minigaming, 0, 1); /* strip the first \n */
        strins(minigaming, "Player\tMinigame\tTeam\n", 0); /* insert tab headers */
        ShowPlayerDialog(playerid, 30000, DIALOG_STYLE_TABLIST_HEADERS, "Players in Minigames", minigaming, "Okay", "");
    }

    #pragma unused params
    return 1;
}

// Command: /teles
// Author: Jay
// Params: N/A
// Desc: Command used in many servers that a lot of new players will use when they first join LVP.
// Shows a list of available teleports such as stunt zones and taxi destinations
lvp_Teles(playerid, params[])
{
#if Feature::DisableFights == 0
    ShowPlayerDialog(playerid, DIALOG_TELES_MAIN, DIALOG_STYLE_LIST, "LVP Teles", "Jumps\r\nTune shops\r\nTaxi Destinations\r\nRaces\r\nDerbies\r\nDM\r\nAll Mini-Games", "Select", "Close");
#else
    ShowPlayerDialog(playerid, DIALOG_TELES_MAIN, DIALOG_STYLE_LIST, "LVP Teles", "Jumps\r\nTune shops\r\nTaxi Destinations\r\nRaces\r\nDerbies\r\nAll Mini-Games", "Select", "Close");
#endif

    #pragma unused params

    return 1;
}

// /cmds
lvp_cmds(playerid, params[])
{
    return lvp_Commands(playerid, params);
}

// /commands
lvp_Commands(playerid, params[])
{
    ShowPlayerDialog(playerid, DIALOG_COMMANDS_LIST, DIALOG_STYLE_LIST, "Choose a category!", "Main\r\nCommunication\r\nTeleportation\r\nFighting\r\nMoney", "Select", "Exit");
    #pragma unused params
    return 1;
}

// Command: /find
// Parameters: playerid/name
// Author: Matthias
lvp_Find(playerid, params[])
{
    CHideGame__onFindCommand(playerid, params);
    return 1;
}

// Command: /has
// Parameters: -
// Author: Matthias
lvp_Has(playerid, params[])
{
    CHideGame__onStartCommand(playerid, params);
    return 1;
}

new g_lastHasFixCommand = 0;

// Command: /hasfix
// Parameters: -
// Author: Russell
lvp_hasfix(playerId, params[])
{
    new const diff = Time->currentTime() - g_lastHasFixCommand;

    g_lastHasFixCommand = Time->currentTime();
    if (iHideGameState != HS_STATE_NONE && diff > 5) {
        SendClientMessage(playerId, Color::Error, "The game is still in progress, you probably don't want to fix the minigame.");
        SendClientMessage(playerId, Color::Error, "Type /hasfix again if you are sure nobody is playing.");
        return 1;
    }

    CHideGame__ResetVariables();

    SendClientMessage(playerId, Color::Success, "The Hide and Seek minigame has been reset.");
    return 1;
    #pragma unused params
}

// Command: /stats
// Level: Player
// Params: n/a
// Desc: show various server statistics
// Author: Jay
lvp_stats(playerid, params[])
{
    #pragma unused params

    new
    szStatMsg[128],
    iPlayersOnline,
    iAdminsOnline,
    iNPCSOnline,
    iProperties;

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected())
        continue;

        if(IsPlayerNPC(i))
        {
            iNPCSOnline++;
            continue;
        }

        iPlayersOnline++;

        if(Player(i)->isAdministrator() == true && UndercoverAdministrator(i)->isUndercoverAdministrator() == false)
        {
            iAdminsOnline++;
            continue;
        }
    }

    for (new propertyId = 0; propertyId < MAX_PROPERTIES; ++propertyId) {
        if (Property(propertyId)->isPropertySlotInUse())
            iProperties++;
    }

    format(szStatMsg, 128, "Las Venturas Playground v%d.%d build %d.", Version::Major, Version::Minor, __BUILD__);
    SendClientMessage(playerid, COLOR_YELLOW, szStatMsg);

    format(szStatMsg, 128, "Players Online: %d  Admins Online: %d", iPlayersOnline, iAdminsOnline);
    SendClientMessage(playerid, Color::Green, szStatMsg);

    format(szStatMsg, 128, "Vehicles: %d Properties: %d", VehicleManager->vehicleCount(), iProperties);
    SendClientMessage(playerid, Color::Green, szStatMsg);

    return 1;
}

// -------------------------------------------------------------------------------------------------

// Command: /lyse
// Level: Player
// Params: -
// Desc: Signs a player up for Lyse
// Author: Jay
lvp_lyse(playerid, params[]) {
    return CLyse__OnCommand(playerid);
    #pragma unused params
}

// Command: /locate
// Level: Player
// Parameters: -
// Authhor: Jay
// Desc: Simply shows some general information about where a player is located,
// if they are in a minigame, driving a vehicle, in a different world, etc.
// Date: 20.01.2008
lvp_locate(playerid,params[])
{
    // Has the player used the correct params?
    if(!params[0])
    {
        SendClientMessage(playerid,Color::White,"Use: /locate [player]");
        return 1;
    }

    // Variables used in this command.
    new
        iCount,
        szName[24],
        szMessage[128],
        iPlayerID,
        iInteriorID;


    if(IsNumeric(params))
    {
        if(Player(strval(params))->isConnected()) {
            iPlayerID = strval(params);
            goto l_Proceed;
        } else {
            SendClientMessage(playerid,Color::Red,"Invalid Player ID.");
            return 1;
        }
    }

    // First of all, we find a player.
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        // If more than 6 searches are found, the player needs to be more specific so there is no need
        // to try to find more.
        if (iCount >= 6) break;

        if (Player(i)->isConnected())
        {
            GetPlayerName( i, szName, sizeof( szName ));

            // Increase the count for the amount of players foundd.
            for (new j = 0, k = ( strlen( szName ) - strlen( params ) ); j <= k; j++)
            {
                if (strcmp( params, szName[ j ], true, strlen( params ) ) == 0 )
                {
                    format( szMessage , sizeof( szMessage ), "%s%s(%d), ", szMessage, szName, i);
                    iPlayerID = i;
                    iCount++;
                    break;
                }
            }
        }
    }

    // More than 1 search found, we need to explain about narrowing the search
    if( iCount > 1 )
    {
        format( szMessage, sizeof( szMessage ), "* Narrow your search down! Matches found: %s.", szMessage );
        SendClientMessage( playerid, Color::Green, szMessage );
        return 1;
    }

    // Nobody has been found..
    if( iCount < 1 )
    {
        format( szMessage, sizeof( szMessage ), "* Player %s was not found.", params );
        SendClientMessage( playerid, Color::Red, szMessage );
        return 1;
    }

    l_Proceed:
    // Right, because we are still here, a player was successfully found, so we can proceed with the command.
    iInteriorID = GetPlayerInteriorNr(iPlayerID);

    // Right, if the player is in a minigame, we tell them the name of it.
    if(IsPlayerInMinigame(iPlayerID))
    format(szMessage,128,"%s is taking part in the %s minigame, somewhat near", PlayerName(iPlayerID), GetPlayerMinigameName(iPlayerID));

#if Feature::DisableFights == 0
    if(CFightClub__IsPlayerFighting(iPlayerID))
    {
        format(szMessage,128,"%s is currently fighting in the FightClub, use '/fight watch %d' to watch them!", PlayerName(iPlayerID), PlayerMatch[iPlayerID]);
        SendClientMessage(playerid,COLOR_ORANGE,szMessage);
        return 1;
    }
#endif

    if(PlayerSpectateHandler->isSpectating(iPlayerID) == true && UndercoverAdministrator(iPlayerID)->isUndercoverAdministrator() == false)
    {
        format(szMessage,128,"%s is currently on foot, somewhat near",PlayerName(iPlayerID));
        SendClientMessage(playerid,COLOR_ORANGE,szMessage);
        SendClientMessage(playerid,COLOR_ORANGE,"an unknown location. This player is in the main world.");
        return 1;
    }

    else if(IsPlayerInAnyVehicle(iPlayerID)) {
        new vehicleId = GetPlayerVehicleID(iPlayerID);
        format(szMessage,128,"%s is currently driving a %s, somewhat near", PlayerName(iPlayerID),
            VehicleModel(GetVehicleModel(vehicleId))->nameString());

    // If they're in an interior, we also show the name of that...
    } else if(iInteriorID > 0)
        format(szMessage,128,"%s is currently walking around %s in",PlayerName(iPlayerID),intval[iInteriorID][intname]);

    // Otherwise they're on foto and outside.
    else
        format(szMessage,128,"%s is currently on foot, somewhat near",PlayerName(iPlayerID));


    SendClientMessage(playerid,COLOR_ORANGE,szMessage);

    if (iInteriorID > 9)
    {
        szMessage = "an unknown location. ";
    }
    else
    {
        new zone[64];
        zone = GetPlayerZone(iPlayerID);
        if(strlen(zone) > 0)
        {
            szMessage = "";
            format(szMessage, 128, "%s", zone);
        }else{
            format(szMessage, 128, "an unknown location. ");
        }

        new city[64];
        city = GetPlayerCity(iPlayerID);
        if(strlen(city) > 0)
        {
            format(szMessage, 128, "%s, in %s. ", szMessage, city);
        }else{
            format(szMessage, 128, "%s. ", szMessage);
        }
    }
    if (g_VirtualWorld[ iPlayerID ] == 0)
    {
        format(szMessage, sizeof(szMessage), "%sThis player is in the main world.", szMessage);
    }else{
        if (Player(playerid)->isAdministrator())
            format(szMessage, 128, "%sThis player is in world %d.", szMessage, g_VirtualWorld[iPlayerID]);
        else
            format(szMessage, 128, "%sThis player is in a virtual world.", szMessage);
    }

    SendClientMessage(playerid, COLOR_ORANGE, szMessage);
    return 1;
}

// Command: /tune
// Level: Player
// Parameters: [1/2]
// Author: Jay
lvp_tune(playerid,params[])
{
    if (!CanPlayerTeleport(playerid)) {
        ShowBoxForPlayer(playerid, "You cannot use this command because you have recently been in a fight.");
        return 1;
    }

    if(GetPlayerState(playerid) != PLAYER_STATE_DRIVER)
    {
        ShowBoxForPlayer(playerid, "You have to be driving a vehicle!");
        return 1;
    }

    if (VehicleModel(GetVehicleModel(GetPlayerVehicleID(playerid)))->isNitroInjectionAvailable() == false) {
        ShowBoxForPlayer(playerid, "You cannot teleport to a tuneshop in this type of vehicle!");
        return 1;
    }

    if(Time->currentTime() - iTuneTime[playerid] < 3*60 && Player(playerid)->isAdministrator() == false)
    {
        ShowBoxForPlayer(playerid, "You can only teleport to a tune shop every 3 minutes.");
        return 1;
    }

    if(!params[0])
        goto l_Tune;

    new const price = GetEconomyValue(TuneCommand);
    new message[128];

    if(!Player(playerid)->isAdministrator() && GetPlayerMoney(playerid) < price) {
        format(message, sizeof(message), "You need $%s to teleport to a tune shop.", formatPrice(price));
        ShowBoxForPlayer(playerid, message);
        return 1;
    }

    if(!IsNumeric(params))
        goto l_Tune;

    new iTune = strval(params);
    new szName[18];
    GetPlayerName(playerid, szName, sizeof(szName));
    new tuneLocation[2][32] =
    {
        "Wheel Arch Angles",
        "Loco Low Co"
    };

    if(iTune >= 1 && iTune <= 2)
    {
        switch(iTune)
        {
            case 1: SetVehiclePos(GetPlayerVehicleID(playerid), -2693.2271,217.9183,4.1797);
            case 2: SetVehiclePos(GetPlayerVehicleID(playerid), 2644.1753,-2007.4167,13.2542);
            default: goto l_Tune;
        }

        ReportPlayerTeleport(playerid);

        ClearPlayerMenus(playerid);
        PlayerInfo[playerid][playerInCheckpoint] = 0;
        format(message, sizeof(message), "%s (Id:%d) went to TuneShop %s (Id:%d).", szName, playerid, tuneLocation[iTune - 1], iTune);
        Admin(playerid, message);
        SendClientMessage(playerid,Color::Green,"You have been teleported to the tune shop. Use /back to go back to L.V.");

        if (Player(playerid)->isAdministrator() == false)
            TakeRegulatedMoney(playerid, TuneCommand);

        iTuneTime[playerid] = Time->currentTime();
        isInSF[playerid] = true;
        return 1;
    }

l_Tune:
    SendClientMessage(playerid,Color::White,"Use: /tune [1/2] - Wheel Arch Angles / Loco Low Co.");
    return 1;
}

// Command: /leave
//
// The /leave command will be triggered by JavaScript when it cannot handle the event.
forward OnPlayerLeaveCommand(playerid, targetid);
public OnPlayerLeaveCommand(playerid, targetid) {
    new targetPlayer = playerid;

    if (Player(playerid)->isAdministrator() && Player(targetid)->isConnected())
        targetPlayer = targetid;

    new MinigameType: minigameType = GetPlayerMinigameType(targetPlayer), name[48];
    strncpy(name, GetPlayerMinigameName(targetPlayer), sizeof(name));

    // if the player id is valid, we simply remove them from whatever it is they are in.
    if (Player(targetPlayer)->isConnected() == true) {
        if (RemovePlayerFromAnyGame(targetPlayer)){
            // Send a message to the player depending on whether the player left themselves, or
            // has been forced to leave the minigame by an administrator.
            if (Player(playerid)->isAdministrator() && targetPlayer != playerid)
                Responses->respondMinigameDropout(targetPlayer, minigameType, name, RemovedByAdministratorDropoutReason);
            else
                Responses->respondMinigameDropout(targetPlayer, minigameType, name, LeaveCommandDropoutReason);

        } else {
            new string[128];

            // Otherwise, the player is not in any minigame!
            if(targetPlayer != playerid)
                format(string, sizeof(string), "%s is currently not in a minigame or map zone!", PlayerName(targetPlayer));
            else
                format(string, sizeof(string), "You're currently not in a minigame or map zone!");

            SendClientMessage(playerid, Color::Error, string);
        }
    } else
        SendClientMessage(playerid, Color::Error, "Invalid player.");

    return 1;
}

// Command: /interest
// Level: Player
// Parameters: amount
// Author: Jay
// Notes: A command for the owner of the frisia, it sets the interest rate.
new iInterestTime[MAX_PLAYERS];

lvp_interest(playerid,params[])
{
    new propertyId = PropertyManager->propertyForSpecialFeature(LoansFeature),
        endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    // does the player own the frisia?
    if(endid != playerid) return 0;
    // has the player used the cmd within the last 5 minutes?
    if(Time->currentTime() - iInterestTime[playerid] < 5*60)
    {
        ShowBoxForPlayer(playerid, "Interest rates can only be changed every 5 minutes.");
        return 1;
    }
    // have they used the correct params?
    if(!params[0])
    {
        SendClientMessage(playerid,Color::White,"Usage: /interest [percent 1 - 7]");
        return 1;
    }
    // are the params numeric?
    if(!IsNumeric(params))
    {
        SendClientMessage(playerid,Color::White,"Usage: /interest [percent 1 - 7]");
        return 1;
    }
    new iInterest = strval(params);
    // is the interest rate there trying to set valid?
    if(iInterest < 1 || iInterest > 7)
    {
        SendClientMessage(playerid,Color::White,"Usage: /interest [percent 1 - 7]");
        return 1;
    }
    iInterestTime[playerid] = Time->currentTime();
    new str[256];
    format(str,256,"~r~~h~%s~w~ has changed the interest rate to ~y~%d~w~ percent (~p~/interest~w~)",
        Player(playerid)->nicknameString(),iInterest);
    AnnounceNewsMessage(str);
    bankRente = iInterest;
    ShowBoxForPlayer(playerid, "Interest rates updated!");
    return 1;
}

// Command: /countdown
// Level: Player
// Parameters: seconds
// Author: Jay
lvp_countdown(playerid,params[])
{
    new str[128];

    // is a countdown already in progress?
    if(Countdown->isGlobalCountdownActiveForPlayer(playerid) && Player(playerid)->isAdministrator() == false)
    {
        ShowBoxForPlayer(playerid, "A countdown is already running.");
        return 1;
    }

    // has the player used the correct parameters?
    if(!params[0])
    {
        SendClientMessage(playerid,Color::White,"Usage: /cd [seconds]");
        return 1;
    }

    param_shift_int(iSec);

    // Right, if the seconds param is less than 3, we auto set it to 3.

    if(iSec < 3)
    {
        iSec = 3;
    }

    // if it's more than 10 and the player aint an admin, we set it to 10.
    if(iSec > 10 && Player(playerid)->isAdministrator() == false)
    {
        ShowBoxForPlayer(playerid, "The countdown cannot be more than 10 seconds.");
        return 1;
    }

    if(iSec > Countdown::MaximumDuration) {
        ShowBoxForPlayer(playerid, "The countdown cannot be more than 300 seconds.");
        return 1;
    }

    // now, we set the countdown variable to the amount of seconds and set it
    // so a countdown is in progress.
    format(str,128,"%s (Id:%d) has started a %d second countdown.",PlayerName(playerid), playerid, iSec);
    Admin(playerid, str);

    Countdown->startGlobalCountdown(iSec);
    return 1;
}

// Command: /cd
// Level: Player
// Parameters: seconds
// Author: Matthias (the original one was made by Jay)
// Update for 2.91.11: Now mirrors the /countdown command instead of duplicating it.
lvp_cd(playerid,params[])
{
    return lvp_countdown(playerid, params);
}

// Command: /world
// Author: JUTD ( The old code was written by Peter ).
lvp_World( playerid, params[] )
{
    // Handled in Elements/Player/World
    OnPlayerWorldCommand(playerid, params);
    return 1;
}

// Command: /my
// Author: JUTD
lvp_My( playerid, params[] )
{
    param_shift( szParameter );

    if( !strlen ( szParameter ) )
        goto MyHelp;

    // Lowercase the |szParameter| to enable case-insensitive sub-commands.
    for (new i = 0; i < strlen(szParameter); i++)
        szParameter[i] = tolower(szParameter[i]);

    // First check whether any /my command has been registered by individual features, as this takes
    // precedence over anything defined in the massive if/else list that follows. Syntax for any
    // methods listening to this switch is: onPlayerFooCommand(playerId, subjectId, params[]).
    new result = Annotation::ExpandSwitch<PlayerCommand>(szParameter, playerid, playerid, params);
    if (result != -1) // it can still either be 0 or 1, but something handled it.
        return result;

    if(!strcmp(szParameter, "skin", true, 4))
    {
        if (!CanPlayerTeleport(playerid)) {
            SendClientMessage(playerid, Color::Red, "* You cannot use this command at the moment because you have recently been in a fight.");
            return 1;
        }

        if(GetPlayerSpecialAction(playerid) != SPECIAL_ACTION_NONE || IsPlayerInAnyVehicle(playerid))
        {
            ShowBoxForPlayer(playerid, "To prevent abuse, you should exit your vehicle and stand still to use this command.");
            return 1;
        }

        param_shift(tmp);

        if(!strlen(tmp)) {
            goto charHelp;
        }

        if(!strcmp(tmp, "save", true, 4)) {
            SpawnManager(playerid)->setSkinId(GetPlayerSkin(playerid), true /* forceUpdate */);
            ShowBoxForPlayer(playerid, "Skin saved! Use /my skin remove to undo this action.");
            return 1;
        }

        if(!strcmp(tmp, "load", true, 4)) {
            new skinId = SpawnManager(playerid)->skinId();
            if (skinId != SpawnManager::InvalidSkinId) {
                SetPlayerSkinEx(playerid, skinId);
                ShowBoxForPlayer(playerid, "Skin loaded.");
            } else {
                SendClientMessage(playerid, Color::Error, "You currently don't have a valid skin loaded in your profile.");
            }
            return 1;
        }

        if(!strcmp(tmp, "remove", true, 6)) {
            SpawnManager(playerid)->setSkinId(SpawnManager::InvalidSkinId);
            ShowBoxForPlayer(playerid, "Skin removed.");
            return 1;
        }

        if (IsNumeric(tmp) && !ClassManager->isSkinAvailableForClassSelection(strval(tmp))) {
            SendClientMessage(playerid, Color::Error, "Error: This skin is not eligible for usage.");
            return 1;
        }

        if (IsNumeric(tmp) && ClassManager->isSkinAvailableForClassSelection(strval(tmp))) {
            SetPlayerSkinEx(playerid, strval(tmp));
            SendClientMessage(playerid, Color::Information, "Skin has been set. Use /my skin save to permanently save.");
            return 1;
        }

charHelp:
        SendClientMessage(playerid, Color::White, "Usage: /my skin [Id] [load/remove/save]");
        return 1;

    }

    if(!strcmp(szParameter, "ramp", true, 4))
    {
        if(ramping[playerid] == 0)
        {
            ShowBoxForPlayer(playerid, "You must enable /ramping first.");
            return 1;
        }

        if(!params[0])
        {
            new szMessage[128];
            format (szMessage, sizeof(szMessage), "Your current ramp is %d.", playerramptypes[playerid]);
            SendClientMessage (playerid, Color::White, szMessage);
            SendClientMessage( playerid, Color::White, "Usage: /my ramp [rampId]");
            return 1;
        }

        param_shift_int(iRampID);

        if(iRampID < 0 || iRampID >= sizeof(ramptypes))
        {
            ShowBoxForPlayer(playerid, "Invalid ramp Id!");
            return 1;
        }

        if(iRampID == 12 && Player(playerid)->isAdministrator() == false)
        {
            ShowBoxForPlayer(playerid, "Admins only for this ramp.");
            return 1;
        }

        playerramptypes[playerid] = iRampID;

        new szMessage[128];
        format(szMessage, sizeof(szMessage), "The ramptype has been changed to %d", iRampID);
        ShowBoxForPlayer(playerid, szMessage);

        return 1;
    }

    if (!strcmp(szParameter, "spawnmoney", true, 10)) {
        SendClientMessage(playerid, Color::Error, "Sorry, this command is currently disabled.");
        return 1;
    }

    if(!strcmp(szParameter, "saveloc", true, 7) && Player(playerid)->isAdministrator() == true)
    {
        GetPlayerPos( playerid, SavedPos2[ playerid ][ 0 ], SavedPos2[ playerid ][ 1 ], SavedPos2[ playerid ][ 2 ] );
        SavedPos2[ playerid ][ 3 ] = GetPlayerInterior( playerid );

        if (IsPlayerInAnyVehicle(playerid))
            GetVehicleZAngle ( GetPlayerVehicleID ( playerid ), SavedPos2[ playerid ][ 4 ] );
        else
            GetPlayerFacingAngle ( playerid, SavedPos2[ playerid ][ 4 ] );

        SendClientMessage( playerid, Color::Green, "This position has been saved successfully." );
        return 1;
    }

    if(!strcmp(szParameter, "gotoloc", true, 7) && Player(playerid)->isAdministrator() == true)
    {

        if( SavedPos2[playerid][0] == 0.0 )
        {
            SendClientMessage(playerid, Color::Red, "You haven't saved a position yet.");
            return 1;
        }

        PlayerInfo[playerid][playerInCheckpoint] = 0;

        if( !IsPlayerInAnyVehicle( playerid ) )
        {
            SetPlayerInterior( playerid, 0 );
            SetPlayerPos( playerid, SavedPos2[ playerid ][ 0 ], SavedPos2[ playerid ][ 1 ], SavedPos2[ playerid ][ 2 ] );
            SetPlayerInterior( playerid, floatround( SavedPos2[ playerid ][ 3 ], floatround_floor) );
            SetPlayerFacingAngle( playerid, SavedPos2[ playerid ][ 4 ] );

        }
        else
        {
            new iVehicleID = GetPlayerVehicleID( playerid );
            new iTrailerID, iHasTrailer;

            if(IsTrailerAttachedToVehicle( iVehicleID ) ){
                iTrailerID = GetVehicleTrailer( iVehicleID );
                iHasTrailer = 1;
            }

            SetVehiclePos( iVehicleID, SavedPos2[ playerid ][ 0 ], SavedPos2[ playerid ][ 1 ], SavedPos2[ playerid ][ 2 ]);
            SetVehicleZAngle( iVehicleID, SavedPos2[ playerid ][ 4 ] );

            if( iHasTrailer == 1 )
            {
                AttachTrailerToVehicle(iTrailerID, iVehicleID);
            }


        }

        SendClientMessage( playerid, Color::Green, "You have been successfully teleported.");
        return 1;
    }

    new gzcm_name [24];
    GetPlayerName (playerid, gzcm_name, 24);

    if(!strcmp(szParameter, "weapon", true, 6) && Player(playerid)->isAdministrator() == true)
    {
        new iLen = strlen(params);
        param_shift_int(iPlayerWeaponID);

        if(iLen == 0)
        {
            SendClientMessage( playerid, Color::White, "Usage: /my weapon [weaponId] [ammo]");
            return 1;
        }

        switch(iPlayerWeaponID)
        {
            case 19, 20, 21, 40, 44, 45:
            {
                SendClientMessage(playerid, Color::Red, "* This weapon is locked.");
                return 1;
            }
        }

        if(iPlayerWeaponID < 1 || iPlayerWeaponID > 46)
        {
            SendClientMessage(playerid, Color::Red, "* This weapon doesn't exist!");
            return 1;
        }

        if(bPlayerWeaponStored[playerid])
        {
            SendClientMessage(playerid,Color::Red,"You cannot give yourself a weapon whilst your other weapons are saved.");
            return 1;
        }

        new iWeaponName[24], szMessage[128];
        GetWeaponName(iPlayerWeaponID, iWeaponName, 24);

        param_shift_int(iAmmo);
        if ( iAmmo == 0 ) {
            iAmmo = 3000;
        }

        GiveWeapon(playerid, iPlayerWeaponID, iAmmo);
        format(szMessage, sizeof( szMessage ), "* You have given yourself a %s", iWeaponName);
        SendClientMessage(playerid, Color::Green, szMessage);

        return 1;
    }

    if(!strcmp(szParameter, "health", true, 6) && Player(playerid)->isAdministrator() == true)
    {
        new iLen = strlen(params);
        param_shift_int(iHealth);

        if(iLen == 0) {
            SendClientMessage( playerid, Color::White, "Usage: /my health [0-100]");
            return 1;
        }

        if(iHealth > 100) {
            iHealth = 100;
        }

        SetPlayerHealth(playerid, iHealth);


        new szMessage[128];

        format(szMessage, sizeof( szMessage ), "Your health has been set to %d!", iHealth);
        SendClientMessage(playerid, Color::Green, szMessage);

        return 1;
    }

    if(!strcmp(szParameter, "armour", true, 5) && Player(playerid)->isAdministrator() == true)
    {
        new iLen = strlen( params );
        param_shift_int( iArmour );

        if( iLen == 0 )
        {
            SendClientMessage( playerid, Color::White, "Usage: /my armour [0-100]");
            return 1;
        }

        if( iArmour > 100)
        {
            iArmour = 100;
        }

        SetPlayerArmour( playerid, iArmour );


        new szMessage[ 128 ];

        format( szMessage, sizeof( szMessage ), "Your armour has been set to %d!", iArmour );
        SendClientMessage(playerid, Color::Green, szMessage);

        return 1;
    }

MyHelp:
    SendClientMessage(playerid, Color::White, "Usage: /my [deathmessage/playerinfo/properties/ramp/skin/spawnweapons/spawnmoney/stats]");

    if (Player(playerid)->isAdministrator() || UndercoverAdministrator(playerid)->isUndercoverAdministrator()) {
        SendClientMessage(playerid, Color::White, "Usage: /my {DDDDDD}[allchat/armour/color/health/hide/(goto/save)loc/maptp]");
        SendClientMessage(playerid, Color::White, "Usage: /my {DDDDDD}[messagelevel/resetspawnweapons/weapon/weather/teleport/time]");
    } else if (Player(playerid)->isAdministrator())
        SendClientMessage(playerid, Color::White, "Usage: /my {DDDDDD}[color/resetspawnweapons/teleport/weather/time]");
    else if (Player(playerid)->isVip())
        SendClientMessage(playerid, Color::White, "Usage: /my {DDDDDD}[color/look/teleport/weather/time]");

    return 1;
}

// Command: /robbery
// Parameters: None
// Author: tomozj the wise
lvp_Robbery(playerid, params[])
{
    // Forwards to the handler..
    CRobbery__OnCommand(playerid);
    return 1;
    #pragma unused params
}

#if Feature::DisableFights == 0

// Command: /wtww
// Parameters: None
// Author: Matthias
lvp_Wwtw(playerid, params[])
{
    // The handler does the dirty work for us
    CWWTW__OnCommand(playerid);
    return 1;
    #pragma unused params
}

// Command: /rwtw
// Parameters: rounds
// Author: Jay
lvp_Rwtw(playerid, params[])
{
    return rwOnCommand(playerid, params);
}

// This command was created by Martijnc a while back in the old
// command syntax. It has been cleaned up here, and is in testing. This
// will only be used in future versions, and will not be included in LVP 2.90.
lvp_Fight(playerid, params[]) {
    CFightClub__OnCommand (playerid, params);
    return 1;
}
#endif
