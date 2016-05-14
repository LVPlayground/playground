// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new g_message[256];

#if Feature::EnableFightClub == 0
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
#endif

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

lvp_crew(playerId, params[]) {
    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Success, "This command sends a message to #LVP.Crew.");
        SendClientMessage(playerId, Color::Information, "Usage: /crew [message]");
        return 1;
    }

    format(g_message, sizeof(g_message), "[crew] %s %s", Player(playerId)->nicknameString(), params);
    AddEcho(g_message);

    format(g_message, sizeof(g_message), "Message sent to #LVP.Crew: %s", params);
    SendClientMessage(playerId, Color::Success, g_message);

    return 1;
}

lvp_man(playerId, params[]) {
    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Success, "This command sends a message to #LVP.Management.");
        SendClientMessage(playerId, Color::Information, "Usage: /man [message]");
        return 1;
    }

    format(g_message, sizeof(g_message), "[man] %s %s", Player(playerId)->nicknameString(), params);
    AddEcho(g_message);

    format(g_message, sizeof(g_message), "Message sent to #LVP.Management: %s", params);
    SendClientMessage(playerId, Color::Success, g_message);

    return 1;
}

lvp_fakeact(playerId, params[]) {
    if (Command->parameterCount(params) < 2) {
        SendClientMessage(playerId, Color::Success, "This command makes a player do a fake /me message.");
        SendClientMessage(playerId, Color::Information, "Usage: /fakeact [player] [message]");
        return 1;
    }

    new subjectId = Command->playerParameter(params, 0, playerId);
    if (subjectId == Player::InvalidId)
        return 1;

    new subject[MAX_PLAYER_NAME+1], parameterOffset = 0;
    Command->stringParameter(params, 0, subject, sizeof(subject));
    parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(subject) + 1);

    format(g_message, sizeof(g_message), "* %s %s", Player(subjectId)->nicknameString(), params[parameterOffset]);
    SendClientMessageToAllEx(ColorManager->playerColor(subjectId), g_message);

    format(g_message, sizeof(g_message), "%s (Id:%d) has sent a fake /me message as %s (Id:%d): %s",
        Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId, params[parameterOffset]);
    Admin(playerId, g_message);

    return 1;
}

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

    if (ShipManager->isPlayerWalkingOnShip(subjectId)) {
        SendClientMessage(playerId, Color::Error, "This player is currently on the ship.");
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

    if (!iPlayerInVipRoom[playerId])
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
        if (ShipManager->isPlayerWalkingOnShip(playerId))
            DamageManager(subjectId)->setFighting(Time->currentTime() - 11);

        SetPlayerPos(subjectId, position[0] + 3, position[1], position[2]);
    }

    format(g_message, sizeof(g_message), "%s (Id:%d) has fetched %s (Id:%d).",
        Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
    Admin(playerId, g_message);

    return 1;
}

lvp_killtime(playerId, params[]) {
    if (!sKillTime) {
        if (Command->parameterCount(params) == 0) {
            SendClientMessage(playerId, Color::Success, "This command starts the KillTime minigame and goes on for the chosen time.");
            SendClientMessage(playerId, Color::Information, "Usage: /killtime [minutes] [weaponId]. If KillTime is already running, /killtime to end it.");
            SendClientMessage(playerId, Color::Information, "If no weaponId is given, no special weapon will be given out.");
            return 1;
        }

        param_shift_int(duration);
        if (duration < 2) {
            SendClientMessage(playerId, Color::Error, "KillTime can't be shorter than 2 minutes.");
            return 1;
        } else if (duration > 60) {
            SendClientMessage(playerId, Color::Error, "KillTime can't last longer than 60 minutes.");
            return 1;
        }

        param_shift_int(weaponId);
        if (weaponId != 0 && WeaponUtilities->isWeaponValid(weaponId) == true) {
            killTimeWeaponId = weaponId;

            for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
                if (Player(subjectId)->isConnected() == false || Player(subjectId)->isNonPlayerCharacter() == true)
                    continue;

                if (IsPlayerInMinigame(subjectId))
                    continue;

                GiveWeapon(subjectId, weaponId, 5000);
            }
        }

        if (KTTimer != -1)
            KillTimer(KTTimer);

        GameTextForAllEx("~r~It's KillTime!~n~~w~Go on a killing spree!" ,5000, 1, World::MainWorld);
        sKillTime = true;
        KillTimeStart(duration);

        ShipManager->enableShiprail(false);

        format(g_message, sizeof(g_message), "%s (Id:%d) has started a #%d minute KillTime in the mainworld (WorldId:%d).",
            Player(playerId)->nicknameString(), playerId, duration, World::MainWorld);
        Admin(playerId, g_message);
    } else if (sKillTime) {
        sKillTime = false;
        KillTimer(KTTimer);
        KTTimer = -1;

        GameTextForAllEx("~r~KillTime is over!", 5000, 1, World::MainWorld);

        ShipManager->enableShiprail();

        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == false)
                continue;

            new weaponId, ammo;
            GetPlayerWeaponData(player, 7, weaponId, ammo);

            if (weaponId == killTimeWeaponId)
                RemovePlayerWeapon(player, weaponId);
        }

        killTimeWeaponId = 0;

        format(g_message, sizeof(g_message), "%s (Id:%d) has stopped KillTime.", Player(playerId)->nicknameString(), playerId);
        Admin(playerId, g_message);
    }

    return 1;
}

lvp_up(playerId, params[]) {
    new distance = Command->integerParameter(params, 0);
    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Success, "This command moves you upwards by the chosen distance.");
        SendClientMessage(playerId, Color::Information, "Usage: /up [distance]");
        return 1;
    }

    new Float: position[3];
    GetPlayerPos(playerId, position[0], position[1], position[2]);

    if (position[2] > 60000) {
        SendClientMessage(playerId, Color::Error, "You're too high!");
        return 1;
    }

    if (IsPlayerInAnyVehicle(playerId))
        SetVehiclePos(GetPlayerVehicleID(playerId), position[0], position[1], position[2] + distance);
    else
        SetPlayerPos(playerId, position[0], position[1], position[2] + distance);

    SetCameraBehindPlayer(playerId);

    return 1;
}

lvp_forward(playerId, params[]) {
    new distance = Command->integerParameter(params, 0);
    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Success, "This commands moves you forward by the chosen distance.");
        SendClientMessage(playerId, Color::Information, "Usage: /forward [distance]");
        return 1;
    }

    new Float: position[3];
    GetPlayerPos(playerId, position[0], position[1], position[2]);
    GetXYInFrontOfPlayer(playerId, position[0], position[1], distance);

    if (IsPlayerInAnyVehicle(playerId))
        SetVehiclePos(GetPlayerVehicleID(playerId), position[0], position[1], position[2]);
    else
        SetPlayerPos(playerId, position[0], position[1], position[2]);

    SetCameraBehindPlayer(playerId);

    return 1;
}

lvp_t(playerId, params[]) {
    new locationId = Command->integerParameter(params, 0);
    if (Command->parameterCount(params) == 0 || locationId < 0 || locationId > 12) {
        SendClientMessage(playerId, Color::Information, "Usage: /t [0-12]. See /locations.");
        return 1;
    }

    new Float: locations[13][3] = {
        {2016.5950,1545.0306,10.8308},
        {2284.6868,2453.1343,10.8203},
        {1648.0355,1607.7329,10.8203},
        {-2233.3938,-1745.0369,480.8698},
        {2536.0796,2085.4226,10.8203},
        {213.4851,1870.4987,17.6406},
        {421.0738,2530.8396,16.6170},
        {1570.8782,-1309.4750,17.1471},
        {-1219.5400,51.4527,14.1360},
        {1993.0626,-2362.4480,13.5469},
        {2419.7612,1124.1425,10.8203},
        {2851.3525,1290.5934,11.3906},
        {2105.8870,2190.4172,14.4965}
    };

    new locationName[13][32] = {
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
        "LV FightClub"
    };

    if (IsPlayerInAnyVehicle(playerId)) {
        SetVehiclePos(GetPlayerVehicleID(playerId), locations[locationId][0], locations[locationId][1], locations[locationId][2]);
        LinkVehicleToInterior(GetPlayerVehicleID(playerId), 0);
    } else {
        SetPlayerPos(playerId, locations[locationId][0], locations[locationId][1], locations[locationId][2]);
        SetPlayerInterior(playerId, 0);
    }

    format(g_message, sizeof(g_message), "%s (Id:%d) has quick taxied to %s (#%d).",
        Player(playerId)->nicknameString(), playerId, locationName[locationId], locationId);
    Admin(playerId, g_message);

    return 1;
}

lvp_asay (playerId, params[]) {
    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Success, "This command will show a IRC-like !say message.");
        SendClientMessage(playerId, Color::Information, "Usage: /asay [message]");
        return 1;
    }

    new adminName[MAX_PLAYER_NAME+1];
    if (UndercoverAdministrator(playerId)->isUndercoverAdministrator() == true)
        UndercoverAdministrator(playerId)->getOriginalUsername(adminName, sizeof(adminName));
    else
        Player(playerId)->nickname(adminName, sizeof(adminName));

    format(g_message, sizeof(g_message), "* Admin (%s): %s", adminName, params);
    SendClientMessageToAllEx(0x2587CEAA, g_message);

    format(g_message, sizeof(g_message), "[say] %s %s", adminName, params);
    AddEcho(g_message);

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

    if (Player(playerId)->isAdministrator() == false)
        goto SetHelp;

    if (!strcmp(setParameter, "ramping", true, 10)) {
        if (Command->parameterCount(params) < 2)
            goto RampHelp;

        new rampingBoolean[4];
        Command->stringParameter(params, 1, rampingBoolean, sizeof(rampingBoolean));

        if (!strcmp(rampingBoolean, "on", true, 2)) {
            RampingEnabled = true;
            SendClientMessage(playerId, Color::Success, "The global ramping feature has been enabled.");

            format(g_message, sizeof(g_message), "%s (Id:%d) has enabled the global ramping feature.",
                Player(playerId)->nicknameString(), playerId);
            Admin(playerId, g_message);

            return 1;
        }

        if (!strcmp(rampingBoolean, "off", true, 3)) {
            RampingEnabled = false;
            SendClientMessage(playerId, Color::Success, "The global ramping feature has been disabled.");

            format(g_message, sizeof(g_message), "%s (Id:%d) has disabled the global ramping feature.",
                Player(playerId)->nicknameString(), playerId);
            Admin(playerId, g_message);

            return 1;
        }

        RampHelp:
        SendClientMessage(playerId, Color::Information, "Usage: /set ramping [on/off]");

        return 1;
    }

    if (Player(playerId)->isManagement() == false)
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
    if (Player(playerId)->isManagement() == true)
        SendClientMessage(playerId, Color::Information, "Usage: /set [gravity/ramping/shiprail/time/weather]");
    else if (Player(playerId)->isAdministrator() == true)
        SendClientMessage(playerId, Color::Information, "Usage: /set [ramping/shiprail/time/weather]");

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

    if (!strcmp(playerParameter, "freeze", true, 6)) {
        TogglePlayerControllable(subjectId, 0);

        SendClientMessage(playerId, Color::Success, "Player frozen.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has frozen %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "unfreeze", true, 8)) {
        TogglePlayerControllable(subjectId, 1);

        SendClientMessage(playerId, Color::Success, "Player unfrozen.");

        format(g_message, sizeof(g_message), "%s (Id:%d) has unfrozen %s (Id:%d).",
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
        GivePlayerMoney(subjectId, moneyAmount);  // Unregulated admin usage

        format(g_message, sizeof(g_message), "%s (Id:%d) is now carrying $%s.",
            Player(subjectId)->nicknameString(), subjectId, formatPrice(moneyAmount));
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has set a new cash amount for %s (Id:%d): $%s.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId,
            formatPrice(moneyAmount));
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "hide", true, 4) && Player(playerId)->isAdministrator() == true) {
        if (Command->parameterCount(params) != 3)
            goto HideHelp;

        new hideParameter[4];
        Command->stringParameter(params, 2, hideParameter, sizeof(hideParameter));

        if (!strcmp(hideParameter, "on", true, 2)) {
            if (PlayerInfo[subjectId][playerIsHidden] == 1) {
                SendClientMessage(playerId, Color::Error, "This player is already hidden.");
                return 1;
            }

            PlayerInfo[subjectId][playerIsHidden] = 1;
            ColorManager->setPlayerMarkerHidden(subjectId, true);

            SendClientMessage(playerId, Color::Success, "Player hidden.");

            format(g_message, sizeof(g_message), "%s (Id:%d) has hidden %s (Id:%d).",
                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
            Admin(playerId, g_message);

            return 1;
        }

        if (!strcmp(hideParameter, "off", true, 3)) {
            if (PlayerInfo[subjectId][playerIsHidden] == 0) {
                SendClientMessage(playerId, Color::Error, "This player is already visible.");
                return 1;
            }

            PlayerInfo[subjectId][playerIsHidden] = 0;
            ColorManager->setPlayerMarkerHidden(subjectId, false);

            SendClientMessage(playerId, Color::Success, "Player unhidden.");

            format(g_message, sizeof(g_message), "%s (Id:%d) has unhidden %s (Id:%d).",
                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
            Admin(playerId, g_message);

            return 1;
        }

        HideHelp:
        SendClientMessage(playerId, Color::Information, "Usage: /p [player] hide [on/off]");

        return 1;
    }

    if (!strcmp(playerParameter, "nocaps", true, 6)) {
        if (Command->parameterCount(params) != 3)
            goto CapsHelp;

        new capsParameter[4];
        Command->stringParameter(params, 2, capsParameter, sizeof(capsParameter));

        if (!strcmp(capsParameter, "on", true, 2)) {
            if (g_NoCaps[subjectId] == true) {
                SendClientMessage(playerId, Color::Error, "This player already has anti-caps filter enabled.");
                return 1;
            }

            g_NoCaps[subjectId] = true;

            format(g_message, sizeof(g_message), "Anti-caps filter enabled for %s (Id:%d).",
                Player(subjectId)->nicknameString(), subjectId);
            SendClientMessage(playerId, Color::Success, g_message);

            format(g_message, sizeof(g_message), "%s (Id:%d) has enabled the anti-caps filter for %s (Id:%d).",
                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
            Admin(playerId, g_message);

            return 1;
        }

        if (!strcmp(capsParameter, "off", true, 3)) {
            if (g_NoCaps[subjectId] == false) {
                SendClientMessage(playerId, Color::Error, "This player already has anti-caps filter disabled.");
                return 1;
            }

            g_NoCaps[subjectId] = false;

            format(g_message, sizeof(g_message), "Anti-caps filter disabled for %s (Id:%d).",
                Player(subjectId)->nicknameString(), subjectId);
            SendClientMessage(playerId, Color::Success, g_message);

            format(g_message, sizeof(g_message), "%s (Id:%d) has disabled the anti-caps filter for %s (Id:%d).",
                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
            Admin(playerId, g_message);

            return 1;
        }

        CapsHelp:
        SendClientMessage(playerId, Color::Information, "Usage: /p [player] nocaps [on/off]");

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

    if (!strcmp(playerParameter, "health", true, 6) && Player(playerId)->isAdministrator() == true) {
        new healthAmount = Command->integerParameter(params, 2), Float: health;
        GetPlayerHealth(subjectId, health);

        if (healthAmount < 0 || healthAmount > 100) {
            format(g_message, sizeof(g_message), "The health of %s (Id:%d) is %.1f",
                Player(subjectId)->nicknameString(), subjectId, health);
            SendClientMessage(playerId, Color::Success, g_message);

            SendClientMessage(playerId, Color::Information, "Usage: /p [player] health [amount] to set health.");

            return 1;
        }

        SetPlayerHealth(subjectId, healthAmount);

        format(g_message, sizeof(g_message), "The health of %s (Id:%d) is now %d.",
            Player(subjectId)->nicknameString(), subjectId, healthAmount);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has set the health for %s (Id:%d) to %d.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId,
            healthAmount);
        Admin(playerId, g_message);

        return 1;
    }

    if ((!strcmp(playerParameter, "armor", true, 6) || !strcmp(playerParameter, "armour", true, 7)) 
        && Player(playerId)->isAdministrator() == true) {
        new armourAmount = Command->integerParameter(params, 2), Float: armour;
        GetPlayerArmour(subjectId, armour);

        if (armourAmount < 0 || armourAmount > 100) {
            format(g_message, sizeof(g_message), "The armour of %s (Id:%d) is %.1f",
                Player(subjectId)->nicknameString(), subjectId, armour);
            SendClientMessage(playerId, Color::Success, g_message);

            SendClientMessage(playerId, Color::Information, "Usage: /p [player] armour [amount] to set armour.");

            return 1;
        }

        SetPlayerArmour(subjectId, armourAmount);

        format(g_message, sizeof(g_message), "The armour of %s (Id:%d) is now %d.",
            Player(subjectId)->nicknameString(), subjectId, armourAmount);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has set the armour for %s (Id:%d) to %d.",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId,
            armourAmount);
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
        Player(subjectId)->setLevel(AdministratorLevel);

        tempLevel[subjectId] = 2;
        format(UserTemped[subjectId], sizeof(UserTemped[]), "%s", Player(playerId)->nicknameString());

        ColorManager->storeExistingPlayerCustomColor(subjectId);
        ColorManager->setPlayerCustomColor(subjectId, Color::AdministratorColor);
        VehicleAccessManager->synchronizePlayerVehicleAccess(subjectId);

        SendClientMessage(subjectId, Color::Success, "An administrator has granted you admin rights!");

        format(g_message, sizeof(g_message), "%s (Id:%d) is now temp. admin.",
            Player(subjectId)->nicknameString(), subjectId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has granted temp. admin rights to %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    if (!strcmp(playerParameter, "takeadmin", true, 9) && Player(playerId)->isAdministrator() == true) {
        if (Player(subjectId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "The selected player isn't an administrator.");
            return 1;
        }

        if (tempLevel[playerId] == 2 && playerId != subjectId) {
            SendClientMessage(playerId, Color::Error, "You can't take someone else's admin rights as temp-admin.");
            return 1;
        }

        Player(subjectId)->setLevel(PlayerLevel);
        Player(subjectId)->setIsVip(false);
        UndercoverAdministrator(subjectId)->setIsUndercoverAdministrator(false);

        tempLevel[subjectId] = 0;
        UserTemped[subjectId] = "";

        ColorManager->restorePreviousPlayerCustomColor(subjectId);
        VehicleAccessManager->synchronizePlayerVehicleAccess(subjectId);

        format(g_message, sizeof(g_message), "%s (Id:%d) is no admin anymore.",
            Player(subjectId)->nicknameString(), subjectId);
        SendClientMessage(playerId, Color::Success, g_message);

        format(g_message, sizeof(g_message), "%s (Id:%d) has taken admin rights from %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, g_message);

        return 1;
    }

    PlayerHelp:
    SendClientMessage(playerId, Color::Information, "Usage: /p [player] [command]:");

    if (Player(playerId)->isAdministrator() == true) {
        SendClientMessage(playerId, Color::Information, " achievements, armor, bank, burn, (un)cage, cash, deathmessage, (give/take)admin, (un)freeze, god,");
        SendClientMessage(playerId, Color::Information, " handofgod, health, hide, kill, maptp, nocaps, nuke, weapon, weaponinfo, properties, removeweapon,");
        SendClientMessage(playerId, Color::Information, " resetspawnweapons, resetweapons, skin, spawnweapons, teleport, vallow");
    }

    return 1;
}

lvp_show(playerId, params[]) {
    if (Command->parameterCount(params) != 1)
        goto ShowHelp;

    new showParameter[8], bool: showInfo = false;
    Command->stringParameter(params, 0, showParameter, sizeof(showParameter));

    if (!strcmp(showParameter, "forum", true, 5)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "Be part of our community and stay updated with the latest news at forum.sa-mp.nl!");
    }

    if (!strcmp(showParameter, "swear", true, 5)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "No swearing, flaming or racism! Watch your language! Read /rules");
    }

    if (!strcmp(showParameter, "reg", true, 3)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "Save money and stats! Register your nickname at www.sa-mp.nl");
    }

    if (!strcmp(showParameter, "report", true, 6)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "Report cheaters using /report [suspected id/name] [cheat/reason]");
    }

    if (!strcmp(showParameter, "caps", true, 4)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "No CAPS please!");
    }

    if (!strcmp(showParameter, "beg", true, 3)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "Do not beg for money! Earn your own! Read /help");
    }

    if (!strcmp(showParameter, "rules", true, 5)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "New on LVP? Read the rules! /rules");
    }

    if (!strcmp(showParameter, "weaps", true, 5)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "Weapons can be bought at Ammu-Nation: /taxi 4");
    }

    if (!strcmp(showParameter, "donate", true, 6)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "VIP access is given with donations! donate.sa-mp.nl for more info!");
    }

    if (!strcmp(showParameter, "nick", true, 4)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "Need a nickchange? Join irc.gtanet.com and /msg Nuwani !changenick");
    }

    if (!strcmp(showParameter, "ts", true, 2)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "LVP has TeamSpeak! Join: ts.sa-mp.nl:9987");
    }

    if (!strcmp(showParameter, "spam", true, 4)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "Don't spam in the mainchat, people will see it after one time!");
    }

    if (!strcmp(showParameter, "ship", true, 4)) {
        showInfo = true;
        format(g_message, sizeof(g_message), "The pirate ship is a peace zone! Please don't hit, shoot or throw grenades on it!");
    }

    if (showInfo == true) {
        SendClientMessageToAllEx(Color::Red, "-------------------");
        SendClientMessageToAllEx(Color::Warning, g_message);
        SendClientMessageToAllEx(Color::Red, "-------------------");

        format(g_message, sizeof(g_message), "%s (Id:%d) has done /show %s.",
            Player(playerId)->nicknameString(), playerId, showParameter);
        Admin(playerId, g_message);

        return 1;
    }

ShowHelp:
    SendClientMessage(playerId, Color::Information, "Usage: /show [/beg/caps/donate/forum/nick/reg/report/rules/ship/spam/swear/ts/weaps]");

    return 1;
}

lvp_reactiontest(playerId, params[]) {
    CReaction__OnCommand(playerId);

    return 1;
    #pragma unused params
}

lvp_announce(playerId, params[]) {
    if (Command->parameterCount(params) == 0) {
        SendClientMessage(playerId, Color::Information, "Usage: /announce [message]");
        return 1;
    }

    SendClientMessageToAll(Color::Red, "-------------------");
    SendClientMessageToAll(Color::Warning, params);
    SendClientMessageToAll(Color::Red, "-------------------");

    format(g_message, sizeof(g_message), "Announce by %s (Id:%d): %s", Player(playerId)->nicknameString(), playerId, params);
    Admin(playerId, g_message);

    return 1;
}

lvp_clear(playerId, params[]) {
    for (new j = 1; j <= 120; j++)
        SendClientMessageToAll(0, "\n");

    format(g_message, sizeof(g_message), "%s (Id:%d) has cleared the chat.", Player(playerId)->nicknameString(), playerId);
    Admin(playerId, g_message);

    return 1;
    #pragma unused params
}
