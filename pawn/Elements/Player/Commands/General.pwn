// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Command: /help
// Params: [1-7]
// Desc: Displays a dialog which shows some information about our server and rules.
// Author: Unknown. Tweaked by Kase
lvp_Help(playerid, params[])
{
    new arg = Command->integerParameter(params, 0), string[100];

    if (Command->parameterCount(params) < 1)
    {
        format( string, sizeof( string ), "Las Venturas Playground %d.%d", Version::Major, Version::Minor );
        SendClientMessage( playerid, COLOR_RED, string );
        SendClientMessage( playerid, COLOR_WHITE, "Please select the topic you want to view:" );
        SendClientMessage( playerid, COLOR_WHITE, "- /help 1 - An Introduction of Las Venturas Playground" );
        SendClientMessage( playerid, COLOR_WHITE, "- /help 2 - How to earn money" );
        SendClientMessage( playerid, COLOR_WHITE, "- /help 3 - How to contact LVP and the Staff of LVP" );
        SendClientMessage( playerid, COLOR_WHITE, "- /help 4 - Information about cruises" );
        SendClientMessage( playerid, COLOR_WHITE, "- /help 5 - Information about communication" );
        SendClientMessage( playerid, COLOR_WHITE, "- /help 6 - Information about vehicles" );
        SendClientMessage( playerid, COLOR_WHITE, "- /help 7 - Learn about upgrading your bank account" );
        SendClientMessage( playerid, COLOR_YELLOW, "Don't forget to check out /credits /rules and /commands!");
        return 1;
    }

    switch(arg)
    {
        case 1:
        {
            ShowPlayerDialog(playerid, DIALOG_HELP_MAIN, DIALOG_STYLE_MSGBOX, "Las Venturas Playground", "LVP is a freeroam server, there are lots of cool features!\nCheck out:\n- /race\n- /jump\n- /properties\n- /teles\n- /derby\n- /minigames\nIf you need help, see /help and /commands.\nIf you need an admin to help you, send them a message by typing in the chat: \n@message", "Alright!", "");
            return 1;
        }

        case 2:
        {
            new Money[350];

            strcat(Money, "Export vehicles - see /export\nInvest in properties. Check out the green house icons around LV (/properties)\nCrush vehicles for a scrap value. - Check out the scrap yard north of the stadium\n", sizeof(Money));
            strcat(Money, "Win minigames - see /minigames\nTake out a loan - check out /borrow\nComplete the delivery mission - see /deliver", sizeof(Money));

            ShowPlayerDialog(playerid, DIALOG_HELP_MONEY, DIALOG_STYLE_MSGBOX, "Las Venturas Playground - Money earning tips", Money, "Alright!", "");
            return 1;
        }

        case 3:
        {
            ShowPlayerDialog(playerid, DIALOG_HELP_CONTACT, DIALOG_STYLE_MSGBOX, "Las Venturas Playground - Contact", "If you got questions or comments, you can use\nthe following ways of contacting the LVP staff.\nIRC: irc.gtanet.com #lvp\nE-mail: info@sa-mp.nl\nWebsite: www.sa-mp.nl\nForum: forum.sa-mp.nl", "Alright!", "");
            return 1;
        }

        case 4:
        {
            ShowPlayerDialog(playerid, DIALOG_HELP_CRUISE, DIALOG_STYLE_MSGBOX, "Las Venturas Playground  - Cruises", "Cruises are recognizable by a lot of (tuned) vehicles,\nmostly starting at the airport, driving around through all cities.\nCruise members have a special status on this server:\nThey may not be shot! Don't ruin a cruise!", "Alright!", "");
            return 1;
        }

        case 5:
        {
            new communication[450];

            strcat(communication, "Apart from the main chat, there are three other ways to communicate with players: PM, phone call and gang chat.\nUsage: /pm [player] message.\n", sizeof(communication));
            strcat(communication, "Usage: /call [player]. The other person needs to type /answer.\nAfter that you can use the call function as normal chat. End the call with /hangup.\nGang chat usage: !text. All text starting with ! is only readable by your gang.", sizeof(communication));

            ShowPlayerDialog(playerid, DIALOG_HELP_LANGUAGES, DIALOG_STYLE_MSGBOX, "Las Venturas Playground - Information about communication", communication, "Alright!", "");
            return 1;
        }

        case 6:
        {
            ShowPlayerDialog(playerid, DIALOG_HELP_VEHICLES, DIALOG_STYLE_MSGBOX, "Las Venturas Playground - Information about vehicles", "Vehicles are marked on your radar with small grey squares.\nTo modify a vehicle drive to one of the garages or by using /tune.\nVehicles can be spawned at all times by Crew members, and VIP members only during the cruise (/cruisecar).\nRegular players are able to spawn an infernus (/inf) once they have sprayed 100 tags.", "Alright!", "");
            return 1;
        }

        case 7:
        {
            ShowPlayerDialog(playerid, DIALOG_HELP_BANK, DIALOG_STYLE_MSGBOX, "Las Venturas Playground - Upgrading your bank", "Go to the LVP Main bank (marked with a red dollar sign\non your radar) to upgrade your bank account.\nWalk into the red marker inside the building and type\n'/account' to get started.", "Alright!", "");
            return 1;
        }

        default:
        {
            format( string, sizeof( string ), "Las Venturas Playground %d.%d", Version::Major, Version::Minor );
            SendClientMessage( playerid, COLOR_RED, string );
            SendClientMessage( playerid, COLOR_WHITE, "Please select the topic you want to view:" );
            SendClientMessage( playerid, COLOR_WHITE, "- /help 1 - An Introduction of Las Venturas Playground" );
            SendClientMessage( playerid, COLOR_WHITE, "- /help 2 - How to earn money" );
            SendClientMessage( playerid, COLOR_WHITE, "- /help 3 - How to contact LVP and the Staff of LVP" );
            SendClientMessage( playerid, COLOR_WHITE, "- /help 4 - Information about cruises" );
            SendClientMessage( playerid, COLOR_WHITE, "- /help 5 - Information about communication" );
            SendClientMessage( playerid, COLOR_WHITE, "- /help 6 - Information about vehicles" );
            SendClientMessage( playerid, COLOR_WHITE, "- /help 7 - Learn about upgrading your bank account" );
            SendClientMessage( playerid, COLOR_YELLOW, "Don't forget to check out /credits /rules and /commands!");

            return 1;
        }
    }

    return 1;
}

// Command: /minigames
// Desc: Displays the minigame menu
// Author: Kase
lvp_Minigames(playerid, params[])
{
    if(IsPlayerFighting(playerid))
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

// Command: /rules
// Desc: Displays rules
// Author: Kase
lvp_Rules(playerid, params[])
{
    ShowPlayerDialog(playerid, DIALOG_RULES, DIALOG_STYLE_MSGBOX, "Las Venturas Playground - Rules",
        "{2566BA}- {A9C4E4}Do not cheat.\n\r" ...
        "{2566BA}- {A9C4E4}No swearing, flaming or racism.\n\r" ...
        "{2566BA}- {A9C4E4}Avoid CAPS; use your common sense.\n\r" ...
        "{2566BA}- {A9C4E4}The Ship is a peace zone; don't harm players on it and don't run to it if you're fighting!\n\r" ...
        "{2566BA}- {A9C4E4}Do not abuse bugs or commands.\n\r" ...
        "{2566BA}- {A9C4E4}Do not harm a cruise in any way!.\n\r" ...
        "If you have questions, use {D67513}@<message> {A9C4E4}to contact the Las Venturas Playground staff. Have fun!", "Alright!", "");

    #pragma unused params
    return 1;
}

// Command: /irc
// Params: -
// Desc: Gives player informations about IRC
// Author: Kase
lvp_irc(playerid, params[])
{
    SendClientMessage(playerid, COLOR_YELLOW, "* Informations about IRC");
    SendClientMessage(playerid, COLOR_WHITE, "Did you know that Las Venturas Playground had an IRC channel?");
    SendClientMessage(playerid, COLOR_WHITE, "You can join the general channel and the server echo channel directly from our website,");
    SendClientMessage(playerid, COLOR_WHITE, "at http://www.sa-mp.nl/irc.html");
    SendClientMessage(playerid, COLOR_WHITE, "And if you're using another IRC client, here are the informations you'll need:");
    SendClientMessage(playerid, COLOR_WHITE, "#LVP - General chat channel | #LVP.echo - Server echo channel (@ irc.gtanet.com)");
    SendClientMessage(playerid, COLOR_WHITE, "Happy chatting!");

    #pragma unused params
    return 1;
}

// Command: minigaming
// Desc: Shows the players that are currently in a minigame
lvp_minigaming(playerid, params[]) {
    new minigaming[1800];

    for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
        if (Player(subjectId)->isConnected() == false || Player(subjectId)->isNonPlayerCharacter() == true)
            continue;

        if (!IsPlayerInMinigame(subjectId))
            continue;

        if (CRace__IsRacing(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - race", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (CDerby__GetPlayerState(subjectId) >= DERBY_STATE_COUNTDOWN) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - derby", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (PlayerInfo[subjectId][PlayerStatus] >= STATUS_BATFIGHT && PlayerInfo[subjectId][PlayerStatus] <= STATUS_ISLANDDM) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - deathmatch", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (CHideGame__GetPlayerState(subjectId) == HS_STATE_PLAYING) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - has", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (CRobbery__GetPlayerStatus(subjectId) == ROBSTATUS_PLAYING) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - robbery", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

#if Feature::EnableFightClub == 0
        if (CFightClub__IsPlayerFighting(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - fightclub", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }
#endif

        if (waterFightIsPlayerPlaying(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - waterfight", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (rwIsPlayerSignedUp(subjectId) && rwGetState() == 3) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - rwtw", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (hayHasPlayerSignedUp(subjectId)) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - haystack", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (CLyse__GetPlayerState(subjectId) != LYSE_STATE_NONE) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - lyse", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (isPlayerBrief[subjectId] && briefStatus == BRIEF_STATE_RUNNING) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - brief", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (g_RivershellPlayer[subjectId] && g_RivershellState == RIVERSHELL_STATE_RUNNING) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - rivershell", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }

        if (WWTW_PlayerData[subjectId][iStatus] == 2) {
            format(minigaming, sizeof(minigaming), "%s\r\n%s (Id:%d) - wwtw", minigaming,
                Player(subjectId)->nicknameString(), subjectId);
            continue;
        }
    }

    if (!strlen(minigaming))
        SendClientMessage(playerid, Color::Error, "No player is currently in a minigame!");
    else {
        strdel(minigaming, 0, 2); /* strip the first \r\n */
        ShowPlayerDialog(playerid, 30000, DIALOG_STYLE_MSGBOX, "Players minigaming", minigaming, "Okay", "");
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

// Spawn an infernus. Only if players have sprayed all 100 tags.
// This is handled in Elements/Player/SprayTags.pwn
lvp_Inf(playerid, params[])
{
    return sprayTagOnVehicleCommand(playerid, params);
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
    iModsOnline,
    iNPCSOnline;

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

        if(Player(i)->isModerator() == true && Player(i)->isAdministrator() == false)
        {
            iModsOnline++;
            continue;
        }
        if(Player(i)->isAdministrator() == true && UndercoverAdministrator(i)->isUndercoverAdministrator() == false)
        {
            iAdminsOnline++;
            continue;
        }
    }

    format(szStatMsg, 128, "Las Venturas Playground v%d.%d build %d.", Version::Major, Version::Minor, __BUILD__);
    SendClientMessage(playerid, COLOR_YELLOW, szStatMsg);

    format(szStatMsg, 128, "Players Online: %d  Admins Online: %d   Mods Online: %d", iPlayersOnline, iAdminsOnline, iModsOnline);
    SendClientMessage(playerid, COLOR_GREEN, szStatMsg);

    format(szStatMsg, 128, "Races: %d Achievements: %d NPCs: %d", g_RacesLoaded, TotalAchievements, iNPCSOnline);
    SendClientMessage(playerid, COLOR_GREEN, szStatMsg);

    return 1;
}

// Command: /slap
// Level: Player
// Params: playerid/name
// Desc: Slap a player
// Author: Jay
lvp_slap(playerid, params[])
{
    if(Time->currentTime() - canSlap[playerid] < 10 && Player(playerid)->isModerator() == false)
    {
        SendClientMessage(playerid, COLOR_RED, "* You can only slap every 10 seconds.");
        return 1;
    }

    if(!params[0])
    {
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /slap [player]");
        return 1;
    }

    param_shift(szParameter);

    new iPlayerID = SelectPlayer(szParameter);

    if(!Player(iPlayerID)->isConnected() || iPlayerID == playerid || IsPlayerNPC(iPlayerID))
    {
        SendClientMessage(playerid, COLOR_RED, "* Invalid player.");
        return 1;
    }


    if(GetPlayerMoney(playerid) < 5)
    {
        SendClientMessage(playerid, COLOR_RED, "* It costs $5 to slap a player!");
        return 1;
    }

    GivePlayerMoney(playerid, -5);

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    PlayerPlaySound(i, 1190 ,0, 0, 0);

    new szSlapMsg[256];

    new rand = random(28);

    switch(rand)
    {
    case 0: szSlapMsg = "cock";
    case 1: szSlapMsg = "sheep";
    case 2: szSlapMsg = "trout";
    case 3: szSlapMsg = "dildo";
    case 4: szSlapMsg = "probe";
    case 5: szSlapMsg = "rocket launcher";
    case 6: szSlapMsg = "hand";
    case 7: szSlapMsg = "network technician";
    case 8: szSlapMsg = "boob";
    case 9: szSlapMsg = "poop";
    case 10: szSlapMsg = "FiXeR";
    case 11: szSlapMsg = "baseball bat";
    case 12: szSlapMsg = "computer";
    case 13: szSlapMsg = "fucker";
    case 14: szSlapMsg = "fist";
    case 15: szSlapMsg = "tree";
    case 16: szSlapMsg = "stick";
    case 17: szSlapMsg = "spike";
    case 18: szSlapMsg = "broken bottle";
    case 19: szSlapMsg = "claw";
    case 20: szSlapMsg = "asswipe";
    case 21: szSlapMsg = "used dildo";
    case 22: szSlapMsg = "used condom";
    case 23: szSlapMsg = "broken laptop";
    case 24: szSlapMsg = "dog";
    case 25: szSlapMsg = "motherfucking twat";
    case 26: szSlapMsg = "penis";
    case 27: szSlapMsg = "woman";
    default: szSlapMsg = "trout";

    }

    format(szSlapMsg, sizeof(szSlapMsg), "* %s {A9C4E4}slaps{CCCCCC} %s around a bit with a large {A9C4E4}%s{CCCCCC}.",
        PlayerName(playerid), PlayerName(iPlayerID), szSlapMsg);
    SendClientMessageToAllEx(Color::ConnectionMessage, szSlapMsg);

    canSlap[playerid] = Time->currentTime();

    GameTextForPlayer(iPlayerID, "~y~slapped", 5000, 5);
    return 1;
}

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

#if Feature::EnableFightClub == 0
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
        if (Player(playerid)->isModerator())
        {
            format(szMessage, 128, "%sThis player is in world %d.", szMessage, g_VirtualWorld[iPlayerID]);
        }else {
            format(szMessage, 128, "%sThis player is in a virtual world.", szMessage);
        }
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
    if(IsPlayerFighting(playerid))
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

    if(Time->currentTime() - iTuneTime[playerid] < 3*60 && Player(playerid)->isModerator() == false)
    {
        ShowBoxForPlayer(playerid, "You can only teleport to a tune shop every 3 minutes.");
        return 1;
    }

    if(!params[0]) goto l_Tune;

    if(Player(playerid)->isModerator() == false)
    {
        if(GetPlayerMoney(playerid) < 10000)
        {
            ShowBoxForPlayer(playerid, "You need $10,000 to teleport to a tune shop.");
            return 1;
        }
    }

    if(!IsNumeric(params)) goto l_Tune;

    new iTune = strval(params);
    new szMessage[128], szName[18];
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
        format(szMessage, sizeof(szMessage), "%s (Id:%d) went to TuneShop %s (Id:%d).", szName, playerid, tuneLocation[iTune - 1], iTune);
        Admin(playerid, szMessage);
        SendClientMessage(playerid,COLOR_GREEN,"You have been teleported to the tune shop. Use /back to go back to L.V.");

        if (Player(playerid)->isModerator() == false)
            GivePlayerMoney(playerid, -10000);

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
            if (Player(playerid)->isAdministrator() == true && targetPlayer != playerid)
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

    // Has the player got enough money?
    if(GetPlayerMoney(playerid) < 2000000 && Player(playerid)->isModerator() == false)
    {
        ShowBoxForPlayer(playerid, "Showmessages cost $2,000,000.");
        return 1;
    }
    // has a showmessage been done recently?
    if(Time->currentTime() - lastShowmsg < 4)
    {
        SendClientMessage(playerid,COLOR_RED,"* A showmessage is currently active.");
        return 1;
    }

    // Get the params...
    param_shift(tmp);

    // Are they correct?
    if(!strlen(tmp))
    {
        SendClientMessage(playerid,COLOR_WHITE,"Correct Usage: /showmessage [colour] [message] (Colours: red/yellow/green/blue/white/purple)");
        return 1;
    }
    if(!params[0])
    {
        SendClientMessage(playerid,COLOR_WHITE,"Correct Usage: /showmessage [colour] [message] (Colours: red/yellow/green/blue/white/purple)");
        return 1;
    }

    // Now, we find out what colour they used
    new
    str[256],
    string[256];

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
    format(string,256,"%s%s",str,iTmp);

    // and finally show it, however, we only show it for people who are in
    // the same World, and are not in a minigame.
    new G_VWorld = GetPlayerVirtualWorld(playerid);

    for (new j = 0; j <= PlayerManager->highestPlayerId(); j++)
    {
        if(!Player(j)->isConnected())
        {
            continue;
        }
        if(IsPlayerInMinigame(j))
        {
            continue;
        }
        if(GetPlayerVirtualWorld(j) != G_VWorld)
        {
            continue;
        }

        if(!g_ShowMessages[ j ][ 2 ])
        {
            continue;
        }

        if (Player(j)->isRegular()) {
            if (random(4) == 0) {
                SendClientMessage(j, COLOR_WHITE, "Hint: Disable these showmessages with /settings showmsg off.");
            }
        }

        GameTextForPlayer(j,string,4000,5);
    }
    // and finally, we send an admin message and inform the player it was successfull, oh, and take their cash.
    format(str,256,"%s (Id:%d) has shown: %s (%s) to world: %d.",PlayerName(playerid),playerid,iTmp,tmp,G_VWorld);
    Admin(playerid, str);

    ShowBoxForPlayer(playerid, "Message shown to all players in this world.");

    lastShowmsg = Time->currentTime();

    if (Player(playerid)->isModerator() == false)
        GivePlayerMoney(playerid, -2000000);

    return 1;
}

lvp_pos(playerid, params[])
{
    new szMsg[128];
    new Float:fPosX, Float:fPosY, Float:fPosZ;
    GetPlayerPos (playerid, fPosX, fPosY, fPosZ);
    format (szMsg, sizeof (szMsg), "Your position: %f %f %f", fPosX, fPosY, fPosZ);
    {
        SendClientMessage(playerid, COLOR_WHITE, szMsg);
        return 1;
    }
    #pragma unused params
}

// Command: /interest
// Level: Player
// Parameters: amount
// Author: Jay
// Notes: A command for the owner of the frisia, it sets the interest rate.
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
        ShowBoxForPlayer(playerid, "No. Just fuck off.");
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
        if(IsPlayerFighting(playerid))
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
            SpawnManager(playerid)->setSkinId(GetPlayerSkin(playerid));
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

charHelp:
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my skin [load/remove/save]");
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

    if(!strcmp(szParameter, "spawnmoney", true, 10))
    {
        if (!strlen (params))
        {
            new szMessage [128];
            format (szMessage, sizeof (szMessage), "Your spawnmoney is currently set to $%s.", formatPrice (g_iSpawnMoney [playerid]));
            SendClientMessage (playerid, COLOR_GREEN, szMessage);
            SendClientMessage (playerid, COLOR_GREEN, "Use /my spawnmoney [amount] to change this.");
            return 1;
        }

        param_shift_int (iMoney);

        if (iMoney < StartGeld || iMoney > 10000000)
        {
            ShowBoxForPlayer(playerid, "The amount must be between $250 and $10,000,000");
            return 1;
        }

        g_iSpawnMoney [playerid] = iMoney;

        new szMessage [256];
        new szName [24];

        GetPlayerName (playerid, szName, sizeof (szName));

        format (szMessage, sizeof (szMessage), "%s (Id:%d) has set their spawnmoney to $%s.", szName, playerid, formatPrice (iMoney));
        Admin (playerid, szMessage);

        format (szMessage, sizeof (szMessage), "Your spawnmoney has been set to $%s.", formatPrice (iMoney));
        SendClientMessage(playerid, COLOR_GREEN, szMessage);
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

    if(!strcmp(szParameter, "cash",true,4) && Player(playerid)->isAdministrator() == true) {
        if(!params[0]) {
            new szMessage[128];
            format(szMessage,sizeof(szMessage),"You currently have $%s.",formatPrice(GetPlayerMoney(playerid)));
            SendClientMessage(playerid,COLOR_WHITE,szMessage);
            SendClientMessage(playerid,COLOR_WHITE,"Usage: /my cash [amount]");
            return 1;
        }

        param_shift_int(iAmount);
        if(iAmount > 5000000)
        {
            SendClientMessage(playerid,COLOR_RED,"You cannot give yourself more than $5,000,000. This is to prevent abuse. Sorry :)");
            return 1;
        }

        if(GetPlayerMoney(playerid) > 10000000)
        {
            SendClientMessage(playerid, COLOR_RED, "* To prevent abuse you cannot give yourself anymore money.");
            return 1;
        }

        GivePlayerMoney(playerid, iAmount);
        SendClientMessage(playerid,COLOR_GREEN, "* Done!");
        return 1;
    }

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

            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if( IsPlayerConnected( i ) )
                {
                    ShowPlayerNameTagForPlayer( i, playerid, 0 );
                }
            }

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

            for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
            {
                if( IsPlayerConnected( i ) ){
                    ShowPlayerNameTagForPlayer( i, playerid, 1 );
                }
            }

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
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[allchat/armor/bank/cash/color/health/hide/(goto/save)loc/look/maptp]");
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[messagelevel/resetspawnweapons/spawnweapons/weapon/weather]");
    } else if (Player(playerid)->isModerator())
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[color/look/resetspawnweapons/teleport/weather]");
    else if (Player(playerid)->isVip())
        SendClientMessage(playerid, COLOR_WHITE, "Usage: /my {DDDDDD}[color/look/teleport/weather]");

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