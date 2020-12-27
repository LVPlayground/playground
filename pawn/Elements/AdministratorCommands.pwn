// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new g_message[256];

forward OnPlayerLevelChange(playerid, newlevel, temporary);
public OnPlayerLevelChange(playerid, newlevel, temporary) {}

forward DoPlayerLevelChange(playerid, newlevel, temporary);
public DoPlayerLevelChange(playerid, newlevel, temporary) {
    CallLocalFunction("OnPlayerLevelChange", "iii", playerid, newlevel, temporary);
}

#if Feature::DisableFights == 0

lvp_resetfc(playerId, params[]) {
    CFightClub__TerminateAllMatches();

    format(g_message, sizeof(g_message), "%s (Id:%d) has reset all FightClub matches.",
        Player(playerId)->nicknameString(), playerId);
    Admin(playerId, g_message);

    return 1;
    #pragma unused params
}

lvp_resetmatch(playerId, params[]) {
    new matchId = Command->integerParameter(params, 0);
    if (Command->parameterCount(params) == 0 || matchId == -1) {
        SendClientMessage(playerId, Color::Information, "Usage: /resetmatch [matchId]");
        return 1;
    }

    CFightClub__TerminateMatch(matchId);

    format(g_message, sizeof(g_message), "%s (Id:%d) has reset FightClub match #%d.",
        Player(playerId)->nicknameString(), playerId, matchId);
    Admin(playerId, g_message);

    return 1;
}

lvp_fixminigames(playerId, params[]) {
    new bool: success = ResetMinigameStatus();
    if (!success) {
        SendClientMessage(playerId, Color::Error, "Unable to reset the minigame status: games are in progress.");
        return 1;
    }

    SendClientMessage(playerId, Color::Success, "The minigame status has been reset.");

    format(g_message, sizeof(g_message), "%s (Id:%d) has reset the minigame status.",
        Player(playerId)->nicknameString(), playerId);
    Admin(playerId, g_message);

    return 1;
    #pragma unused params
}

#endif

lvp_chase(playerId, params[]) {
    if (chaseData[0]) {
        SendClientMessage(playerId, Color::Error, "The chase minigame is already running!");
        return 1;
    }

    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Success, "This command starts the chase minigame.");
        SendClientMessage(playerId, Color::Information, "Usage: /chase [player]");
        return 1;
    }

    new subjectId = Command->playerParameter(params, 0, playerId);
    if (subjectId == Player::InvalidId)
        return 1;

    if (Player(subjectId)->isNonPlayerCharacter() == true) {
        SendClientMessage(playerId, Color::Error, "You can't chase NPCs.");
        return 1;
    }

    if (!IsPlayerMinigameFree(subjectId)) {
        SendClientMessage(playerId, Color::Error, "This player is signed up or playing a minigame.");
        return 1;
    }

    CChase__Start(subjectId);

    format(g_message, sizeof(g_message), "%s (Id:%d) has started the chase on %s (Id:%d).",
        Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
    Admin(playerId, g_message);

    return 1;
}

lvp_stopchase(playerId, params[]) {
    if (chaseData[0])
        CChase__Stop(2, playerId);
    else
        SendClientMessage(playerId, Color::Error, "There isn't a chase at the moment.");

    return 1;
    #pragma unused params
}

lvp_fetch(playerId, params[]) {
    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Information, "Usage: /fetch [player]");
        return 1;
    }

    new subjectId = Command->playerParameter(params, 0, playerId);
    if (subjectId == Player::InvalidId)
        return 1;

    if (Player(subjectId)->isNonPlayerCharacter() == true) {
        SendClientMessage(playerId, Color::Error, "You can't fetch NPCs.");
        return 1;
    }

    if (subjectId == playerId) {
        SendClientMessage(playerId, Color::Error, "You can't fetch yourself.");
        return 1;
    }

    if (IsPlayerInMinigame(subjectId)) {
        SendClientMessage(playerId, Color::Error, "This player is in a minigame.");
        return 1;
    }

    if (IsPlayerInMapZone(subjectId))
        OnPlayerLeaveMapZone(subjectId, -1);

    if (iPlayerInVipRoom[playerId])
        iPlayerInVipRoom[subjectId] = false;

    new Float: position[3];
    GetPlayerPos(playerId, position[0], position[1], position[2]);
    SetPlayerInterior(subjectId, GetPlayerInterior(playerId));
    SetPlayerVirtualWorld(subjectId, GetPlayerVirtualWorld(playerId));

    if (GetPlayerState(subjectId) == PLAYER_STATE_DRIVER) {
        SetVehiclePos(GetPlayerVehicleID(subjectId), position[0] + 3, position[1], position[2]);
        SetVehicleVirtualWorld(GetPlayerVehicleID(subjectId), GetPlayerVirtualWorld(playerId));
        LinkVehicleToInterior(GetPlayerVehicleID(subjectId), GetPlayerInterior(playerId));
    } else {
        SetPlayerPos(subjectId, position[0] + 3, position[1], position[2]);
    }

    format(g_message, sizeof(g_message), "%s (Id:%d) has fetched %s (Id:%d).",
        Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
    Admin(playerId, g_message);

    return 1;
}

lvp_t(playerId, params[]) {
    new locationId = Command->integerParameter(params, 0);
    if (Command->parameterCount(params) == 0 || locationId < 0 || locationId > 16) {
        SendClientMessage(playerId, Color::Information, "Usage: /t [0-16]. See /locations.");
        return 1;
    }

    new Float: locations[17][3] = {
        {2016.5950,1545.0306,10.8308},
        {2284.6868,2453.1343,10.8203},
        {1648.0355,1607.7329,10.8203},
        {-2235.3938,-1742.0369,480.8698},
        {2536.0796,2085.4226,10.8203},
        {213.4851,1870.4987,17.6406},
        {421.0738,2530.8396,16.6170},
        {1570.8782,-1309.4750,17.1471},
        {-1219.5400,51.4527,14.1360},
        {1993.0626,-2362.4480,13.5469},
        {2419.7612,1124.1425,10.8203},
        {2851.3525,1290.5934,11.3906},
        {2105.8870,2190.4172,14.4965},
        {-2275.8701,2356.4390,4.4737},  
        {-1714.3550,1331.4526,6.6107},   
        {833.4330,-1785.5731,13.3151}, 
        {0.0,0.0,0.0}
    };

    if (locationId == 16) {
        new Float: balloonPosition[3];
        GetDynamicObjectPos(iHotAirBalloonObjectID, balloonPosition[0], balloonPosition[1], balloonPosition[2]);
        locations[locationId][0] = balloonPosition[0];
        locations[locationId][1] = balloonPosition[1];
        locations[locationId][2] = balloonPosition[2]+1.5;
    }

    new locationName[17][32] = {
        "The Ship",
        "Las Venturas Police Department",
        "Las Venturas Airport",
        "Mount Chilliad",
        "Ammu-Nation",
        "Area 69",
        "Airstrip",
        "Los Santos Basejumping",
        "San Fierro Airport",
        "Los Santos Airport",
        "LV Main bank",
        "LV Train Station",
        "LV FightClub",
        "Bayside Marina",
        "San Fierro Pier",
        "Los Santos Beach",
        "Balloon"
    };

    if (IsPlayerInAnyVehicle(playerId)) {
        new const vehicleId = GetPlayerVehicleID(playerId);

        SetVehiclePos(vehicleId, locations[locationId][0], locations[locationId][1], locations[locationId][2]);
        LinkVehicleToInterior(vehicleId, 0);
        SetVehicleVirtualWorld(playerId, 0);
    } else {
        SetPlayerPos(playerId, locations[locationId][0], locations[locationId][1], locations[locationId][2]);
        SetPlayerInterior(playerId, 0);
    }

    SetPlayerVirtualWorld(playerId, 0);

    format(g_message, sizeof(g_message), "%s (Id:%d) has quick taxied to %s (#%d).",
        Player(playerId)->nicknameString(), playerId, locationName[locationId], locationId);
    Admin(playerId, g_message);

    return 1;
}

lvp_set(playerId, params[]) {
    if (Command->parameterCount(params) == 0)
        goto SetHelp;

    new setParameter[12], parameterOffset = 0;
    Command->stringParameter(params, 0, setParameter, sizeof(setParameter));
    parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(setParameter) + 1);

    if (Annotation::ExpandSwitch<SetCommand>(setParameter, playerId, params[parameterOffset]) == 1)
        return 1;

    if (!strcmp(setParameter, "weather", true, 7)) {
        new weatherId = Command->integerParameter(params, 1);
        if (weatherId < 0 || (weatherId > 19 && weatherId != 150 && weatherId != 206)) {
            SendClientMessage(playerId, Color::Information, "Usage: /set weather [0-19/150/206]");
            return 1;
        }

        SetMainWorldWeatherId(weatherId);
        SetWeather(weatherId);

        if (weatherId == 206)
            TimeController->setTime(12);

        format(g_message, sizeof(g_message), "Weather Id changed to #%d.", weatherId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has changed the weather Id to #%d.",
            Player(playerId)->nicknameString(), playerId, weatherId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(setParameter, "time", true, 4)) {
        if (Command->parameterCount(params) < 2)
            goto TimeHelp;

        new timeHour = Command->integerParameter(params, 1);
        if (timeHour >= 0 && timeHour < 24) {
            TimeController->setTime(timeHour);
            SendClientMessage(playerId, Color::Success, "Done!");

            format(g_message , sizeof(g_message), "%s (Id:%d) has changed the time to #%d o'clock.",
                Player(playerId)->nicknameString(), playerId, timeHour);
            Admin(playerId, g_message);

            return 1;
        }

TimeHelp:
        SendClientMessage(playerId, Color::Information, "Usage: /set time [0-23]");
        return 1;
    }

    if (!Player(playerId)->isManagement())
        goto SetHelp;

    if (!strcmp(setParameter, "gravity", true, 7)) {
        new Float: gravity = Command->floatParameter(params, 1);
        if (gravity < -0.15 || gravity > 0.15) {
            SendClientMessage(playerId, Color::Information, "Usage: /set gravity [-0.15/0.15]");
            return 1;
        }

        SetGravity(gravity);

        format(g_message, sizeof(g_message), "Changed gravity to #%f, default setting is #0.008.", gravity);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has set the gravity to #%f.", Player(playerId)->nicknameString(),
            playerId, gravity);
        Admin(playerId, g_message);

        return 1;
    }

SetHelp:
   if (Player(playerId)->isManagement())
    SendClientMessage(playerId, Color::Information, "Usage: /set [gravity/shiprail/time/weather]");
   else if (Player(playerId)->isAdministrator())
    SendClientMessage(playerId, Color::Information, "Usage: /set [shiprail/time/weather]");
    return 1;
}

lvp_p(playerId, params[]) {
    if (Command->parameterCount(params) < 2)
        goto PlayerHelp;

    new subjectId = Command->playerParameter(params, 0, playerId);
    if (subjectId == Player::InvalidId)
        return 1;

    if (Player(subjectId)->isNonPlayerCharacter() == true) {
        SendClientMessage(playerId, Color::Error, "This player is a NPC.");
        return 1;
    }

    new playerParameter[28], parameterOffset = 0;
    Command->stringParameter(params, 1, playerParameter, sizeof(playerParameter));
    parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 1) + strlen(playerParameter) + 1);

    // Lowercase the |playerParameter| to enable case-insensitive sub-commands.
    for (new i = 0; i < strlen(playerParameter); i++)
        playerParameter[i] = tolower(playerParameter[i]);

    // First check whether any /p command has been registered by individual features, as this takes
    // precedence over anything defined in the massive if/else list that follows. Syntax for any
    // methods listening to this switch is: onPlayerFooCommand(playerId, subjectId, params[]).
    new result = Annotation::ExpandSwitch<PlayerCommand>(playerParameter, playerId, subjectId, params[parameterOffset]);
    if (result == 1)
        return 1;

    if (!strcmp(playerParameter, "removeweapon", true, 12)) {
        new weaponId = Command->integerParameter(params, 2);
        if (Command->parameterCount(params) != 3 || WeaponUtilities->isWeaponValid(weaponId) == false) {
            SendClientMessage(playerId, Color::Information, "Usage: /p [player] removeweapon [weaponId]");
            return 1;
        }

        new weaponName[32];
        GetWeaponName(weaponId, weaponName, sizeof(weaponName));
        RemovePlayerWeapon(subjectId, weaponId);

        format(g_message, sizeof(g_message), "%s (Id:%d) has been removed as a weapon for this player.",
            weaponName, weaponId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has removed weapon %s (Id:%d) for %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, weaponName, weaponId,
            Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }


    if (!strcmp(playerParameter, "weaponinfo", true, 10)) {
        new dialogCaption[64], dialogMessage[1000], weaponCount;
        format(dialogCaption, sizeof(dialogCaption), "Weapons of %s (Id:%d)",
            Player(subjectId)->nicknameString(), subjectId);

        new weaponId, ammo, weaponName[32];
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
            GetPlayerWeaponData(subjectId, weaponSlot, weaponId, ammo);

            if (weaponId == 0 || ammo == 0)
                continue;

            GetWeaponName(weaponId, weaponName, sizeof(weaponName));
            format(dialogMessage, sizeof(dialogMessage), "%s{B4CCE8}%d x {FF8E02}%s (Id:%d)\r\n",
                dialogMessage, ammo, weaponName, weaponId);

            weaponCount++;
        }

        if (weaponCount == 0) {
            SendClientMessage(playerId, Color::Error, "No weapons to be listed.");
            return 1;
        }

        ShowPlayerDialog(playerId, 10000, DIALOG_STYLE_MSGBOX, dialogCaption, dialogMessage, "Okay", "");

        return 1;
    }

    if (!strcmp(playerParameter, "cage", true, 4) && Player(playerId)->isAdministrator() == true) {
        if (isCaged[subjectId] == 1) {
            SendClientMessage(playerId, Color::Error, "This player is already caged!");
            return 1;
        }

        new Float: position[3];
        GetPlayerPos(subjectId, position[0], position[1], position[2]);

        SetPlayerWorldBounds(subjectId, floatadd(position[0], 10.0), floatsub(position[0], 10.0),
            floatadd(position[1], 10.0), floatsub(position[1], 10.0));
        isCaged[subjectId] = 1;

        SendClientMessage(playerId, Color::Success, "Player caged.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has caged %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "uncage", true, 6) && Player(playerId)->isAdministrator() == true) {
        if (isCaged[subjectId] != 1) {
            SendClientMessage(playerId, Color::Error, "This player is not caged!");
            return 1;
        }

        ResetWorldBounds(subjectId);
        isCaged[subjectId] = 0;

        SendClientMessage(playerId, Color::Success, "Player uncaged.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has uncaged %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "burn", true, 4)) {
        if (IsPlayerInAnyVehicle(subjectId)) {
            SendClientMessage(playerId, Color::Error, "You can't burn a player who is inside a vehicle!");
            return 1;
        }

        if (GetDistance(subjectId, 2004.00, 1544.00, 14.00) < 38) {
            SendClientMessage(playerId, Color::Error, "This player is too close to the ship.");
            return 1;
        }

        new Float: position[3];
        GetPlayerPos(subjectId, position[0], position[1], position[2]);
        CreateExplosion(position[0], position[1] , position[2] + 3, 1, 10);

        SendClientMessage(playerId, Color::Success, "Player burned.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has burned %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "nuke", true, 4) && Player(playerId)->isAdministrator() == true) {
        if (GetDistance(subjectId, 2004.00, 1544.00, 14.00) < 38 && !Player(playerId)->isManagement()) {
            SendClientMessage(playerId, Color::Error, "This player is too close to the ship.");
            return 1;
        }

        new Float: position[3];
        GetPlayerPos(subjectId, position[0], position[1], position[2]);

        if (IsPlayerInAnyVehicle(subjectId))
            SetVehicleToRespawn(GetPlayerVehicleID(subjectId));
        else
            SetPlayerPos(subjectId, position[0], position[1], position[2]);

        for (new height = -1; height < 2; height++) {
            CreateExplosion(position[0]-4, position[1]-4, position[2]+(height*7), 0, 15.0);
            CreateExplosion(position[0]+4, position[1]+4, position[2]+(height*7), 0, 15.0);
            CreateExplosion(position[0]-4, position[1]+4, position[2]+(height*7), 0, 15.0);
            CreateExplosion(position[0]+4, position[1]-4, position[2]+(height*7), 0, 15.0);
        }

        SendClientMessage(playerId, Color::Success, "Player nuked.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has nuked %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "weapon", true, 6) && Player(playerId)->isAdministrator() == true) {
        new weaponId = Command->integerParameter(params, 2);
        if (WeaponUtilities->isWeaponValid(weaponId) == false) {
            SendClientMessage(playerId, Color::Information, "Usage: /p [player] weapon [weaponId] [ammo]");
            return 1;
        }

        new ammo = Command->integerParameter(params, 3) <= 0 ? 3000 : Command->integerParameter(params, 3),
            weaponName[32];
        GetWeaponName(weaponId, weaponName, sizeof(weaponName));

        GiveWeapon(subjectId, weaponId, ammo);

        format(g_message, sizeof(g_message), "%s (Id:%d) has been added as a weapon for this player.",
            weaponName, weaponId, weaponName, weaponId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has added weapon %s (Id:%d) for %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, weaponName, weaponId,
            Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "cash", true, 4) && Player(playerId)->isAdministrator() == true) {
        new moneyAmount = Command->integerParameter(params, 2);
        if (moneyAmount < 0 || moneyAmount > 999999999) {
            format(g_message, sizeof(g_message), "%s (Id:%d) is carrying $%s",
                Player(subjectId)->nicknameString(), subjectId, formatPrice(GetPlayerMoney(subjectId)));
            SendClientMessage(playerId, Color::Success, g_message);

            SendClientMessage(playerId, Color::Information, "Usage: /p [player] cash [amount] to set a new cash amount.");
            return 1;
        }

        ResetPlayerMoney(subjectId);
        GivePlayerMoney(subjectId, moneyAmount);  // /p [player] cash [amount]

        format(g_message, sizeof(g_message), "%s (Id:%d) is now carrying $%s.",
            Player(subjectId)->nicknameString(), subjectId, formatPrice(moneyAmount));
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has set a new cash amount for %s (Id:%d): $%s.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId,
            formatPrice(moneyAmount));
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "handofgod", true, 9)) {
        new Float: position[3];
        GetPlayerPos(subjectId, position[0], position[1], position[2]);

        SetPlayerInterior(subjectId, 0);
        ResetPlayerWeapons(subjectId);

        if (IsPlayerInAnyVehicle(subjectId))
            SetVehicleToRespawn(GetPlayerVehicleID(subjectId));

        SetPlayerPos(subjectId, position[0], position[1], position[2] + 40);

        if (!Player(subjectId)->isAdministrator())
            PlayerHandOfGod[subjectId] = true;

        SendClientMessage(playerId, Color::Success, "Player thrown in the air.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has thrown %s (Id:%d) in the air.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "resetweapons", true, 12)) {
        ResetPlayerWeapons(subjectId);

        SendClientMessage(playerId, Color::Success, "Weapons reset for this player.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has reset the weapons of %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "god", true, 3) && Player(playerId)->isAdministrator() == true) {
        if (Command->parameterCount(params) != 3)
            goto GodHelp;

        new godParameter[4];
        Command->stringParameter(params, 2, godParameter, sizeof(godParameter));

        if (!strcmp(godParameter, "on", true, 2)) {
            if (g_bPlayerGodmode[subjectId] == 1) {
                SendClientMessage(playerId, Color::Error, "This player already has god mode enabled.");
                return 1;
            }

            SetPlayerHealth(subjectId, 99999);
            g_bPlayerGodmode[subjectId] = 1;

            format(g_message, sizeof(g_message), "God mode enabled for %s (Id:%d).",
                Player(subjectId)->nicknameString(), subjectId);
            SendClientMessage(playerId, Color::Success, g_message);

            format(g_message, sizeof(g_message), "%s (Id:%d) has enabled god mode for %s (Id:%d).",
                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
            Admin(playerId, g_message);

            return 1;
        }

        if (!strcmp(godParameter, "off", true, 3)) {
            if (g_bPlayerGodmode[subjectId] == 0) {
                SendClientMessage(playerId, Color::Error, "This player already has god mode disabled.");
                return 1;
            }

            SetPlayerHealth(subjectId, 100);
            g_bPlayerGodmode[subjectId] = 0;

            format(g_message, sizeof(g_message), "God mode disabled for %s (Id:%d).",
                Player(subjectId)->nicknameString(), subjectId);
            SendClientMessage(playerId, Color::Success, g_message);

            format(g_message, sizeof(g_message), "%s (Id:%d) has disabled god mode for %s (Id:%d).",
                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
            Admin(playerId, g_message);

            return 1;
        }

GodHelp:
        format(g_message, sizeof(g_message), "%s (Id:%d) currently has god mode {FFFF00}%s{FFFFFF}.",
            Player(subjectId)->nicknameString(), subjectId, (g_bPlayerGodmode[subjectId] ? "enabled": "disabled"));

        SendClientMessage(playerId, Color::Information, g_message);
        SendClientMessage(playerId, Color::Information, "Usage: /p [player] god [on/off]");

        return 1;
    }

    if (!strcmp(playerParameter, "skin", true, 4)) {
        new skinId = Command->integerParameter(params, 2);
        if (skinId < 0 || ClassManager->isSkinAvailableForClassSelection(skinId) == false) {
            format(g_message, sizeof(g_message), "The skin Id of %s (Id:%d) is #%d.",
                Player(subjectId)->nicknameString(), subjectId, GetPlayerSkin(subjectId));
            SendClientMessage(playerId, Color::Success, g_message);

            SendClientMessage(playerId, Color::Information, "Usage: /p [player] skin [skinId] to change skin.");

            return 1;
        }

        SpawnManager(subjectId)->setSkinId(skinId, true /* forceUpdate */);

        SendClientMessage(playerId, Color::Success, "The skin has been set!");

        return 1;
    }

    if (!strcmp(playerParameter, "kill", true, 5) && Player(playerId)->isAdministrator() == true) {
        hiddenKill[subjectId] = 1;
        SetPlayerHealth(subjectId, 0);

        format(g_message, sizeof(g_message), "You've secretly killed %s (Id:%d).",
            Player(subjectId)->nicknameString(), subjectId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has secretly killed %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "giveadmin", true, 9) && Player(playerId)->isAdministrator() == true) {
        if (Player(subjectId)->isAdministrator() == true) {
            SendClientMessage(playerId, Color::Error, "The selected player is already admin.");
            return 1;
        }

        if (tempLevel[playerId] == 2) {
            SendClientMessage(playerId, Color::Error, "You can't temp-admin others as a temp-admin.");
            return 1;
        }

        Player(subjectId)->setIsVip(true);
        Player(subjectId)->setLevel(AdministratorLevel, /* isTemporary= */ true);

        tempLevel[subjectId] = 2;
        format(UserTemped[subjectId], sizeof(UserTemped[]), "%s", Player(playerId)->nicknameString());

        SendClientMessage(subjectId, Color::Success, "You have been granted temporary rights.");

        format(g_message, sizeof(g_message), "%s (Id:%d) is now temp. admin.",
            Player(subjectId)->nicknameString(), subjectId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has granted temporary admin rights to %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        EchoMessage("notice-crew", "z", g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "takeadmin", true, 9) && Player(playerId)->isAdministrator() == true) {
        if (Player(subjectId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "The selected player isn't an administrator.");
            return 1;
        }

        if (tempLevel[subjectId] != 2 && !Player(playerId)->isManagement()) {
            SendClientMessage(playerId, Color::Error, "You can't take rights from permanent administrators.");
            return 1;
        }

        if (tempLevel[playerId] == 2 && playerId != subjectId) {
            SendClientMessage(playerId, Color::Error, "You can't take someone else's admin rights as temp-admin.");
            return 1;
        }

        TakeTempAdministratorRightsFromPlayer(subjectId, true /** fromInGame **/);

        format(g_message, sizeof(g_message), "%s (Id:%d) is no admin anymore.",
            Player(subjectId)->nicknameString(), subjectId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has taken admin rights from %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        EchoMessage("notice-crew", "z", g_message);

        return 1;
    }

PlayerHelp:
    SendClientMessage(playerId, Color::Information, "Usage: /p [player] [command]:");

    if (Player(playerId)->isAdministrator() == true && tempLevel[subjectId] == 2) {
        SendClientMessage(playerId, Color::Information, " armor, burn, (un)cage, cash, (un)freeze, god,");
    } else {
        SendClientMessage(playerId, Color::Information, " armor, burn, (un)cage, cash, deathmessage, (un)freeze, (give/take)admin, god,");
    }

    if (Player(playerId)->isAdministrator() == true) {
        SendClientMessage(playerId, Color::Information, " handofgod, health, hide, kill, maptp, nuke, weapon, weaponinfo, properties,");
        SendClientMessage(playerId, Color::Information, " removeweapon, resetspawnweapons, resetweapons, skin, spawnweapons, teleport");
    }

    return 1;
}

lvp_hs(playerId, params[]) {
    if (PlayerSettings(playerId)->isPlayerHitSoundEnabled()) {
        SendClientMessage(playerId, Color::Success, "You have disabled your hit sound.");
        PlayerSettings(playerId)->setPlayerHitSoundEnabled(false);

    } else {
        SendClientMessage(playerId, Color::Success, "You have enabled your hit sound.");
        PlayerSettings(playerId)->setPlayerHitSoundEnabled(true);
    }

    return 1;
    #pragma unused params
}
