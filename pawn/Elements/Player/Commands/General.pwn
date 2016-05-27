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

    ShowPlayerDialog(playerid, DIALOG_MINIGAMES, DIALOG_STYLE_LIST, "Choose your minigame!", "Derby\nDeathmatch\nRace\nRobbery\nBriefcase\nRivershell\nLYSE\nWWTW\nRWTW\nHaystack\nWaterfight", "Play!", "Cancel");

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
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (IsPlayerInMapZone(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s jump\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (CDerby__GetPlayerState(subjectId) >= DERBY_STATE_COUNTDOWN) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s derby\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (PlayerInfo[subjectId][PlayerStatus] >= STATUS_BATFIGHT && PlayerInfo[subjectId][PlayerStatus] <= STATUS_ISLANDDM) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (CHideGame__GetPlayerState(subjectId) == HS_STATE_PLAYING) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::White, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t{%s}%s", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                CHideGame__SeekerId() == subjectId ? colorBuffer[0] : colorBuffer[1],
                CHideGame__SeekerId() == subjectId ? "Seeker" : "Hider");
            continue;
        }

        if (CRobbery__GetPlayerStatus(subjectId) == ROBSTATUS_PLAYING) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t{%s}%s", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                CRobbery__GetPlayerTeam(subjectId) == ROBBERY_TEAMATTACK ? colorBuffer[0] : colorBuffer[1],
                CRobbery__GetPlayerTeam(subjectId) == ROBBERY_TEAMATTACK ? "Attackers" : "Defenders");
            continue;
        }

#if Feature::DisableFightClub == 0
        if (CFightClub__IsPlayerFighting(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }
#endif

        if (waterFightIsPlayerPlaying(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (rwIsPlayerSignedUp(subjectId) && rwGetState() == 3) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t{%s}%s", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                rwGetPlayerTeam(subjectId) == RW_TEAM_RED ? colorBuffer[0] : colorBuffer[1],
                rwGetPlayerTeam(subjectId) == RW_TEAM_RED ? "Red Team" : "Blue Team");
            continue;
        }

#if Feature::DisableHay == 0
        if (hayHasPlayerSignedUp(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }
#endif

        if (CLyse__GetPlayerState(subjectId) != LYSE_STATE_NONE) {
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentGreen, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t{%s}%s", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                CLyse__GetPlayerTeam(subjectId) == TEAM_BLUE ? colorBuffer[0] : colorBuffer[1],
                CLyse__GetPlayerTeam(subjectId) == TEAM_BLUE ? "Blue Team" : "Green Team");
            continue;
        }

        if (isPlayerBrief[subjectId] && briefStatus == BRIEF_STATE_RUNNING) {
            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t-", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId));
            continue;
        }

        if (g_RivershellPlayer[subjectId] && g_RivershellState == RIVERSHELL_STATE_RUNNING) {
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentGreen, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t{%s}%s", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                p_Team[subjectId] == TEAM_BLUE ? colorBuffer[0] : colorBuffer[1],
                p_Team[subjectId] == TEAM_BLUE ? "Team Blue" : "Team Green");
            continue;
        }

        if (WWTW_PlayerData[subjectId][iStatus] == 2) {
            Color->toString(Color::MinigameTransparentRed, colorBuffer[0], sizeof(colorBuffer[]));
            Color->toString(Color::MinigameTransparentBlue, colorBuffer[1], sizeof(colorBuffer[]));

            format(minigaming, sizeof(minigaming), "%s\n{%06x}%s {FFFFFF}(Id: %d)\t%s\t{%s}%s", minigaming,
                ColorManager->playerColor(subjectId) >>> 8, Player(subjectId)->nicknameString(), subjectId,
                GetPlayerMinigameName(subjectId),
                WWTW_PlayerData[subjectId][iPlayerTeam] == WWTW_TEAMATTACK ? colorBuffer[0] : colorBuffer[1],
                WWTW_PlayerData[subjectId][iPlayerTeam] == WWTW_TEAMATTACK ? "Attackers" : "Defenders");
            continue;
        }
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
    ShowPlayerDialog(playerid, DIALOG_TELES_MAIN, DIALOG_STYLE_LIST, "LVP Teles", "Jumps\r\nTune shops\r\nTaxi Destinations\r\nRaces\r\nDerbies\r\nDM\r\nAll Mini-Games", "Select", "Close");

    #pragma unused params

    return 1;
}

// Spawn an Elegy. Only if players have sprayed all 100 tags.
// This is handled in Elements/Player/SprayTags.pwn
lvp_Ele(playerid, params[])
{
    return sprayTagOnVehicleCommand(playerid, params, SPRAY_TAG_ELEGY);
}

// Spawn an Infernus. Only if players have sprayed all 100 tags.
// This is handled in Elements/Player/SprayTags.pwn
lvp_Inf(playerid, params[])
{
    return sprayTagOnVehicleCommand(playerid, params, SPRAY_TAG_INFERNUS);
}

// Spawn an NRG. Only if players have sprayed all 100 tags.
// This is handled in Elements/Player/SprayTags.pwn
lvp_Nrg(playerid, params[])
{
    return sprayTagOnVehicleCommand(playerid, params, SPRAY_TAG_NRG);
}

// Spawn a Sultan. Only if players have sprayed all 100 tags.
// This is handled in Elements/Player/SprayTags.pwn
lvp_Sul(playerid, params[])
{
    return sprayTagOnVehicleCommand(playerid, params, SPRAY_TAG_SULTAN);
}

// Spawn a Turismo. Only if players have sprayed all 100 tags.
// This is handled in Elements/Player/SprayTags.pwn
lvp_Tur(playerid, params[])
{
    return sprayTagOnVehicleCommand(playerid, params, SPRAY_TAG_TURISMO);
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
        SendClientMessage(playerId, COLOR_RED, "The game is still in progress, you probably don't want to fix the minigame.");
        SendClientMessage(playerId, COLOR_RED, "Type /hasfix again if you are sure nobody is playing.");
        return 1;
    }

    CHideGame__ResetVariables();

    SendClientMessage(playerId, COLOR_YELLOW, "The Hide and Seek minigame has been reset.");
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
    SendClientMessage(playerid, COLOR_GREEN, szStatMsg);

    format(szStatMsg, 128, "Achievements: %d NPCs: %d", TotalAchievements-UnavailableTotalAchievements, iNPCSOnline);
    SendClientMessage(playerid, COLOR_GREEN, szStatMsg);

    format(szStatMsg, 128, "Vehicles: %d Properties: %d", VehicleManager->vehicleCount(), iProperties);
    SendClientMessage(playerid, COLOR_GREEN, szStatMsg);

    format(szStatMsg, 128, "ATMs: %d", CashPointController->count());
    SendClientMessage(playerid, COLOR_GREEN, szStatMsg);

    return 1;
}

// -------------------------------------------------------------------------------------------------

// Reasons one can be slapped with. Will be chosen by random.
new SLAP_REASONS[][] = {
    "cock", "sheep", "trout", "dildo", "probe", "rocket launcher", "hand", "network technician",
    "boob", "poop", "FiXeR", "baseball bat", "computer", "fucker", "fist", "tree", "stick", "spike",
    "broken bottle", "claw", "asswipe", "used dildo", "used condom", "broken laptop", "dog",
    "motherfucking snake", "Luce", "trout"
};

// Makes |playerId| slap the |targetPlayerId|. Their most recent slap time and the target's most
// recent slapped-by records will be updated.
ExecuteSlapCommand(playerId, targetPlayerId) {
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        PlayerPlaySound(i, 1190 ,0, 0, 0);

    new reason = random(sizeof(SLAP_REASONS));
    new message[128];

    format(message, sizeof(message), "* %s slaps %s around a bit with a large %s.",
        Player(playerId)->nicknameString(), Player(targetPlayerId)->nicknameString(), SLAP_REASONS[reason]);
    SendClientMessageToAllEx(Color::SlapAnnouncement, message);

    GameTextForPlayer(targetPlayerId, "~y~slapped", 5000, 5);

    g_LastSlapTime[playerId] = Time->currentTime();
    g_LastSlappedBy[targetPlayerId] = playerId;
}

// Command: /slap [player]
// Author: Jay, Russell
lvp_slap(playerId, params[]) {
    if(!params[0]) {
        SendClientMessage(playerId, Color::Information, "Usage: /slap [player]");
        return 1;
    }

    param_shift(szParameter);

    new targetPlayerId = SelectPlayer(szParameter);
    if (!Player(targetPlayerId)->isConnected() || IsPlayerNPC(targetPlayerId)) {
        SendClientMessage(playerId, Color::Warning, "Error: That player is not connected to the server!");
        return 1;
    }

    if (targetPlayerId == playerId) {
        SendClientMessage(playerId, Color::Warning, "Error: You cannot slap yourself, silly!");
        return 1;
    }

    new timeSinceLastSlap = Time->currentTime() - g_LastSlapTime[playerId];
    if (timeSinceLastSlap < 10 /* seconds */ && Account(playerId)->userId() != 31797 /* Luce */) {
        SendClientMessage(playerId, Color::Warning, "Error: You can only slap once per 10 seconds.");
        return 1;
    }

    new const price = GetEconomyValue(SlapCommand);

    if (GetPlayerMoney(playerId) < price /* dollars */) {
        new message[128];
        format(message, sizeof(message), "Error: Slapping another player costs $%s.", formatPrice(price));
        SendClientMessage(playerId, Color::Warning, message);
        return 1;
    }

    TakeRegulatedMoney(playerId, SlapCommand);

    ExecuteSlapCommand(playerId, targetPlayerId);
    return 1;
}

// Command: /slapb, /slapback
// Author: Russell
lvp_slapb(playerId, params[]) {
    if (g_LastSlappedBy[playerId] == INVALID_PLAYER_ID) {
        SendClientMessage(playerId, Color::Warning, "Error: Sorry, I forgot who slapped you last!");
        return 1;
    }

    new timeSinceLastSlap = Time->currentTime() - g_LastSlapTime[playerId];
    if (timeSinceLastSlap < 10 /* seconds */) {
        SendClientMessage(playerId, Color::Warning, "Error: You can only slap once per 10 seconds.");
        return 1;
    }

    new const price = GetEconomyValue(SlapCommand);

    if (GetPlayerMoney(playerId) < price /* dollars */) {
        new message[128];
        format(message, sizeof(message), "Error: Slapping another player costs $%s.", formatPrice(price));
        SendClientMessage(playerId, Color::Warning, message);
        return 1;
    }

    TakeRegulatedMoney(playerId, SlapCommand);

    ExecuteSlapCommand(playerId, g_LastSlappedBy[playerId]);
    return 1;

    #pragma unused params
}

// Because our command aliasing system is so amazing.
lvp_slapback(playerId, params[]) { return lvp_slapb(playerId, params); }

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

// Command: /derby
// Level: Player
// Params: derbyid
// Desc: Using the derby handler, this signs a player up for a derby.
// Author: Jay
lvp_Derby(playerid,params[])
{
    return CDerby__OnCommand(playerid, params);
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
        SendClientMessage(playerid,COLOR_WHITE,"Use: /locate [player]");
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
        if(IsPlayerConnected(strval(params)))
        {
            iPlayerID = strval(params);
            goto l_Proceed;
        }else{
            SendClientMessage(playerid,COLOR_RED,"Invalid Player ID.");
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
        SendClientMessage( playerid, COLOR_GREEN, szMessage );
        return 1;
    }

    // Nobody has been found..
    if( iCount < 1 )
    {
        format( szMessage, sizeof( szMessage ), "* Player %s was not found.", params );
        SendClientMessage( playerid, COLOR_RED, szMessage );
        return 1;
    }

    l_Proceed:
    // Right, because we are still here, a player was successfully found, so we can proceed with the command.
    iInteriorID = GetPlayerInteriorNr(iPlayerID);

    // Right, if the player is in a minigame, we tell them the name of it.
    if(IsPlayerInMinigame(iPlayerID))
    format(szMessage,128,"%s is taking part in the %s minigame, somewhat near", PlayerName(iPlayerID), GetPlayerMinigameName(iPlayerID));

#if Feature::DisableFightClub == 0
    if(CFightClub__IsPlayerFighting(iPlayerID))
    {
        format(szMessage,128,"%s is currently fighting in the FightClub, use '/fight watch %d' to watch him!", PlayerName(iPlayerID), PlayerMatch[iPlayerID]);
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
    if(DamageManager(playerid)->isPlayerFighting() == true)
    {
        ShowBoxForPlayer(playerid, "You cannot use this command because you have recently been in a gun fight.");
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

        ClearPlayerMenus(playerid);
        PlayerInfo[playerid][playerInCheckpoint] = 0;
        format(message, sizeof(message), "%s (Id:%d) went to TuneShop %s (Id:%d).", szName, playerid, tuneLocation[iTune - 1], iTune);
        Admin(playerid, message);
        SendClientMessage(playerid,COLOR_GREEN,"You have been teleported to the tune shop. Use /back to go back to L.V.");

        if (Player(playerid)->isAdministrator() == false)
            TakeRegulatedMoney(playerid, TuneCommand);

        iTuneTime[playerid] = Time->currentTime();
        isInSF[playerid] = true;
        return 1;
    }

l_Tune:
    SendClientMessage(playerid,COLOR_WHITE,"Use: /tune [1/2] - Wheel Arch Angles / Loco Low Co.");
    return 1;
}

// Command: /leave
lvp_leave(playerid,params[]) {
    // Right. This command is unique. For players, it has to just simply leave
    // them from the minigame, but for admins, if an ID is specified, we have
    // to force the specified id to leave.
    new targetPlayer = playerid;

    // right, we make a default var assigned to the playerid, however, if
    // this command is used by an admin, and includes params, we assign
    // that var to the value of the params!
    if (strlen(params) > 0 && Player(playerid)->isAdministrator() == true)
        targetPlayer = SelectPlayer(params);

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

// Command: /showmessage
// Level: player
// Parameters: color/msg
// Author: Jay
// Notes: Improved & removed a SetTimer statement.
lvp_showmessage(playerid,params[])
{
    if(MuteManager->isMuted(playerid))
    {
        SendClientMessage(playerid,COLOR_RED,"You can't send a showmessage when you're muted!");
        return 1;
    }

    new const price = GetEconomyValue(ShowMessageCommand);
    new message[128];

    // Has the player got enough money?
    if(GetPlayerMoney(playerid) < price && Player(playerid)->isAdministrator() == false) {
        format(message, sizeof(message), "This command costs $%s to use.", formatPrice(price));
        ShowBoxForPlayer(playerid, message);
        return 1;
    }
    // has a showmessage been done recently?
    if(Time->currentTime() - lastShowmsg < 4) {
        SendClientMessage(playerid,COLOR_RED,"* A showmessage is currently active.");
        return 1;
    }

    // Get the params...
    param_shift(tmp);

    // Are they correct?
    if(!strlen(tmp)) {
        SendClientMessage(playerid,COLOR_WHITE,"Correct Usage: /showmessage [colour] [message] (Colours: red/yellow/green/blue/white/purple)");
        return 1;
    }
    if(!params[0]) {
        SendClientMessage(playerid,COLOR_WHITE,"Correct Usage: /showmessage [colour] [message] (Colours: red/yellow/green/blue/white/purple)");
        return 1;
    }

    // Now, we find out what colour they used
    new
    str[256];

    if(!strcmp(tmp,"red",true,3)) str = "~r~";
    else if(!strcmp(tmp,"yellow",true,6)) str = "~y~";
    else if(!strcmp(tmp,"green",true,5)) str = "~g~";
    else if(!strcmp(tmp,"blue",true,4)) str = "~b~";
    else if(!strcmp(tmp,"white",true,5)) str = "~w~";
    else if(!strcmp(tmp,"purple",true,6)) str = "~p~";
    else
    {
        SendClientMessage(playerid,COLOR_WHITE,"Invalid Colour! Available Colours: red / yellow / green / blue / white / purple");
        return 1;
    }

    new iTmp[256];
    format(iTmp,sizeof(iTmp),"%s",params);

    // Have they used a crash safe string?
    for (new j; j < strlen(iTmp); j++) {
        if (strcmp(iTmp[j],"~",true,1) == 0 || strcmp(iTmp[j],"\\",true,1) == 0) {
            SendClientMessage(playerid,COLOR_RED,"You cannot use this character in a showmessage.");
            return 1;
        }
    }

    // Format the string,
    format(message,256,"%s%s",str,iTmp);

    // and finally show it, however, we only show it for people who are in
    // the same World, and are not in a minigame.
    new G_VWorld = GetPlayerVirtualWorld(playerid);

    for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
    {
        if(!Player(j)->isConnected())
            continue;

        if(IsPlayerInMinigame(j))
            continue;

        if(GetPlayerVirtualWorld(j) != G_VWorld)
            continue;

        if(!showMessagesEnabled[j])
            continue;

        if (Player(j)->isRegular()) {
            if (random(4) == 0) {
                SendClientMessage(j, COLOR_WHITE, "Hint: Disable these showmessages with /settings showmsg off.");
            }
        }

        GameTextForPlayer(j,message,4000,5);
    }
    // and finally, we send an admin message and inform the player it was successfull, oh, and take their cash.
    format(message,sizeof(message),"%s (Id:%d) has shown: %s (%s) to world: %d.",PlayerName(playerid),playerid,iTmp,tmp,G_VWorld);
    Admin(playerid, message);

    ShowBoxForPlayer(playerid, "Message shown to all players in this world.");

    lastShowmsg = Time->currentTime();

    if (Player(playerid)->isAdministrator() == false)
        TakeRegulatedMoney(playerid, ShowMessageCommand);

    return 1;
}

// Command: /interest
// Level: Player
// Parameters: amount
// Author: Jay
// Notes: A command for the owner of the frisia, it sets the interest rate.
lvp_interest(playerid,params[])
{
    new iInterestTime[MAX_PLAYERS];

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
        SendClientMessage(playerid,COLOR_WHITE,"Usage: /interest [percent 1 - 7]");
        return 1;
    }
    // are the params numeric?
    if(!IsNumeric(params))
    {
        SendClientMessage(playerid,COLOR_WHITE,"Usage: /interest [percent 1 - 7]");
        return 1;
    }
    new iInterest = strval(params);
    // is the interest rate there trying to set valid?
    if(iInterest < 1 || iInterest > 7)
    {
        SendClientMessage(playerid,COLOR_WHITE,"Usage: /interest [percent 1 - 7]");
        return 1;
    }
    iInterestTime[playerid] = Time->currentTime();
    new str[256];
    format(str,256,"~r~~h~%s~w~ has changed the interest rate to ~y~%d~w~ percent (~p~/interest~w~)",
        Player(playerid)->nicknameString(),iInterest);
    NewsController->show(str);
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
        SendClientMessage(playerid,COLOR_WHITE,"Usage: /cd [seconds]");
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

    // First check whether any /my command has been registered by individual features, as this takes
    // precedence over anything defined in the massive if/else list that follows. Syntax for any
    // methods listening to this switch is: onPlayerFooCommand(playerId, subjectId, params[]).
    new result = Annotation::ExpandSwitch<PlayerCommand>(szParameter, playerid, playerid, params);
    if (result != -1) // it can still either be 0 or 1, but something handled it.
        return result;

    if(!strcmp(szParameter, "skin", true, 4))
    {
        if(DamageManager(playerid)->isPlayerFighting() == true)
        {
            SendClientMessage(playerid, COLOR_RED, "* You cannot use this command at the moment because you have recently been in a gun fight.");
            return 1;
        }

        if(GetPlayerSpecialAction(playerid) != SPECIAL_ACTION_NONE || IsPlayerInAnyVehicle(playerid))
        {
            ShowBoxForPlayer(playerid, "To prevent abuse, you should exit any vehicle and stand still to use this command.");
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
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my skin [Id] [load/remove/save]");
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
            SendClientMessage (playerid, COLOR_WHITE, szMessage);
            SendClientMessage( playerid, COLOR_WHITE, "Usage: /my ramp [rampId]");
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
        new message[256];

        if (!strlen(params)) {
            format(message, sizeof(message), "Your spawn money is currently set to $%s.",
                formatPrice(g_iSpawnMoney[playerid]));

            SendClientMessage(playerid, Color::Success, message);
            SendClientMessage(
                playerid, Color::Information, "Use /my spawnmoney [amount] to change this.");
            return 1;
        }

        new const MIN_START_MONEY = GetEconomyValue(SpawnMoney);
        new const MAX_START_MONEY = 10000000;

        param_shift_int(amount);
        if (amount < MIN_START_MONEY || amount > MAX_START_MONEY) {
            format(message, sizeof(message), "The amount must be between $%s and $%s.",
                formatPrice(MIN_START_MONEY), formatPrice(MAX_START_MONEY));

            SendClientMessage(playerid, Color::Error, message);
            return 1;
        }

        g_iSpawnMoney[playerid] = amount;

        new name[MAX_PLAYER_NAME + 1];
        GetPlayerName(playerid, name, sizeof(name));

        format(message, sizeof(message), "%s (Id:%d) has set their spawn money to $%s.",
            name, playerid, formatPrice(amount));
        Admin(playerid, message);

        format(message, sizeof(message), "Your spawn money has been set to $%s.",
            formatPrice(amount));
        SendClientMessage(playerid, Color::Success, message);
        return 1;
    }

    if(!strcmp(szParameter, "minigame", true, 8))
    {
        param_shift(tmp);

        if(!strlen(tmp)) {
            goto MinigameHelp;
        }

        if(!strcmp(tmp, "tec9", true, 4))
        {
            if(iPlayerSawnoffWeapon[playerid] == 1)
            {
                SendClientMessage(playerid, COLOR_RED, "You've already chosen the Tec9!");
                return 1;
            }

            iPlayerSawnoffWeapon [playerid] = 1;
            SendClientMessage(playerid, COLOR_GREEN, "You have chosen the Tec9 as spawn-weapon for the FightClub and the /sawnoff minigame.");
            return 1;
        }

        if(!strcmp(tmp, "uzi", true, 3))
        {
            if(iPlayerSawnoffWeapon[playerid] == 2)
            {
                SendClientMessage(playerid, COLOR_RED, "You've already chosen the Uzi!");
                return 1;
            }

            iPlayerSawnoffWeapon[playerid] = 2;
            SendClientMessage(playerid, COLOR_GREEN, "You have chosen the Uzi as spawn-weapon for the FightClub and the /sawnoff minigame.");
            return 1;
        }

MinigameHelp:
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my minigame [tec9/uzi]");
        SendClientMessage(playerid, COLOR_WHITE, "This is used to set your spawnweapon in the FightClub and the /sawnoff minigame.");
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

        SendClientMessage( playerid, COLOR_GREEN, "This position has been saved successfully." );
        return 1;
    }

    if(!strcmp(szParameter, "gotoloc", true, 7) && Player(playerid)->isAdministrator() == true)
    {

        if( SavedPos2[playerid][0] == 0.0 )
        {
            SendClientMessage(playerid, COLOR_RED, "You haven't saved a position yet.");
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

        SendClientMessage( playerid, COLOR_GREEN, "You have been successfully teleported.");
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
            SendClientMessage( playerid, COLOR_WHITE, "Usage: /my weapon [weaponId] [ammo]");
            return 1;
        }

        switch(iPlayerWeaponID)
        {
            case 19, 20, 21, 40, 44, 45:
            {
                SendClientMessage(playerid, COLOR_RED, "* This weapon is locked.");
                return 1;
            }
        }

        if(iPlayerWeaponID < 1 || iPlayerWeaponID > 46)
        {
            SendClientMessage(playerid, COLOR_RED, "* This weapon doesn't exist!");
        }

        if(bPlayerWeaponStored[playerid])
        {
            SendClientMessage(playerid,COLOR_RED,"You cannot give yourself a weapon whilst your other weapons are saved.");
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
        SendClientMessage(playerid, COLOR_GREEN, szMessage);

        return 1;
    }

    if(!strcmp(szParameter, "health", true, 6) && Player(playerid)->isAdministrator() == true)
    {
        new iLen = strlen(params);
        param_shift_int(iHealth);

        if(iLen == 0) {
            SendClientMessage( playerid, COLOR_WHITE, "Usage: /my health [0-100]");
            return 1;
        }

        if(iHealth > 100) {
            iHealth = 100;
        }

        SetPlayerHealth(playerid, iHealth);


        new szMessage[128];

        format(szMessage, sizeof( szMessage ), "Your health has been set to %d!", iHealth);
        SendClientMessage(playerid, COLOR_GREEN, szMessage);

        return 1;
    }

    if(!strcmp(szParameter, "armour", true, 5) && Player(playerid)->isAdministrator() == true)
    {
        new iLen = strlen( params );
        param_shift_int( iArmour );

        if( iLen == 0 )
        {
            SendClientMessage( playerid, COLOR_WHITE, "Usage: /my armour [0-100]");
            return 1;
        }

        if( iArmour > 100)
        {
            iArmour = 100;
        }

        SetPlayerArmour( playerid, iArmour );


        new szMessage[ 128 ];

        format( szMessage, sizeof( szMessage ), "Your armour has been set to %d!", iArmour );
        SendClientMessage(playerid, COLOR_GREEN, szMessage);

        return 1;
    }

    if(!strcmp(szParameter, "hide", true, 4 ) && Player(playerid)->isAdministrator() == true)
    {
        param_shift( szParams2 );

        if( !strlen( szParams2 ) )
            goto HideHelp;

        if( strcmp( szParams2, "on", true, 2 ) == 0 )
        {
            if( PlayerInfo[playerid][playerIsHidden] == 1) 
            {
                SendClientMessage(playerid, COLOR_RED, "* You are already hidden!");
                return 1;
            }

            PlayerInfo[playerid][playerIsHidden] = 1;
            ColorManager->setPlayerMarkerHidden(playerid, true);

            new nickname[32], notification[128];
            GetPlayerName(playerid, nickname, sizeof(nickname));

            format(notification, sizeof(notification), "%s (Id:%d) has made themself invisible.", nickname, playerid);
            Admin(playerid, notification);

            SendClientMessage(playerid, COLOR_YELLOW, "* You are now hidden!");
            return 1;
        }

        if( strcmp( szParams2, "off", true, 3 ) == 0 )
        {
            if( PlayerInfo[playerid][playerIsHidden] == 0) 
            {
                SendClientMessage(playerid, COLOR_RED, "* You are already visible!");
                return 1;
            }

            PlayerInfo[playerid][playerIsHidden] = 0;
            ColorManager->setPlayerMarkerHidden(playerid, false);

            new nickname[32], notification[128];
            GetPlayerName(playerid, nickname, sizeof(nickname));

            format(notification, sizeof(notification), "%s (Id:%d) has made themself visible.", nickname, playerid);
            Admin(playerid, notification);

            SendClientMessage(playerid, COLOR_YELLOW, "* You are now visible again!");
            return 1;
        }

HideHelp:
        SendClientMessage( playerid, COLOR_WHITE, "Usage: /my hide [on/off]");
        return 1;
    }

MyHelp:
    SendClientMessage(playerid, COLOR_WHITE, "Usage: /my [achievements/deathmessage/minigame/playerinfo/properties/ramp/skin/spawnmoney/stats]");

    if (Player(playerid)->isAdministrator() || UndercoverAdministrator(playerid)->isUndercoverAdministrator()) {
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[allchat/armour/bank/color/health/hide/(goto/save)loc/look/maptp]");
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[messagelevel/resetspawnweapons/spawnweapons/weapon/weather/time]");
    } else if (Player(playerid)->isAdministrator())
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[color/look/resetspawnweapons/teleport/weather/time]");
    else if (Player(playerid)->isVip())
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[color/look/teleport/weather/time]");

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
