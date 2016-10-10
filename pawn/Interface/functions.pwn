// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// -------------------------------------------------------------------------------------------------

// https://github.com/LVPlayground/playground/blob/master/VIRTUAL_WORLDS.md
bool: IsPlayerInMainWorld(playerId) {
    new const virtualWorld = GetPlayerVirtualWorld(playerId);

    return (virtualWorld == 0) || /* main world */
           (virtualWorld == 101) || /* Caligula's Palace Casino world */
           (virtualWorld >= 1201 && virtualWorld <= 2000) || /* interior worlds */
           (virtualWorld >= 2001 && virtualWorld <= 7000) || /* house worlds */
           (virtualWorld >= 7001 && virtualWorld <= 8000);   /* player isolated worlds */
}

GetIsolatedWorldForPlayer(playerId) {
    return 7001 + playerId;
}

// -------------------------------------------------------------------------------------------------

bool: LegacyIsPlayerInVipRoom(playerId) {
    return !!iPlayerInVipRoom[playerId];
}

bool: LegacyPlayerHasGodMode(playerId) {
    return !!g_bPlayerGodmode[playerId];
}

LegacySetValidKillerVariables(forPlayerId, killerId, reasonId) {
    validKillerId[forPlayerId] = killerId;
    validReasonId[forPlayerId] = reasonId;
}

bool: LegacyIsPlayerIgnored(playerId, subjectId) {
    if (g_Ignore[playerId][subjectId])
        return true;
    else
        return false;
}

RemovePlayerFromAnyGame(playerId) {
    if (Player(playerId)->isConnected() == false)
        return 0;

    // The player might be engaged in a JavaScript activity.
    if (PlayerActivity(playerId)->isJavaScriptActivity()) {
        CallLocalFunction("OnPlayerLeaveActivity", "d", playerId);
        return 1;
    }

    if (CLyse__GetPlayerState(playerId) >= LYSE_STATE_SIGNUP) {
        CLyse__SignPlayerOut(playerId);
        return 1;
    }

    if (rwIsPlayerSignedUp(playerId)) {
        rwRemovePlayerFromMinigame(playerId);
        return 1;
    }

#if Feature::DisableHay == 0
    if (hayHasPlayerSignedUp(playerId)) {
        hayRemovePlayer(playerId);
        return 1;
    }
#endif

    if (waterFightIsPlayerSignedUp(playerId)) {
        waterFightRemovePlayer(playerId);
        return 1;
    }

    if (IsPlayerStatusMinigame(playerId)) {
        MinigameLeave(playerId);
        return 1;
    }

    if (CDerby__GetPlayerState(playerId) == DERBY_STATE_SIGNUP) {
        CDerby__PlayerExit(playerId, SIGNOUT);
        return 1;
    }

    if (CDerby__GetPlayerState(playerId) >= DERBY_STATE_COUNTDOWN) {
        CDerby__PlayerExit(playerId, LEFT);
        return 1;
    }

    if (IsPlayerInMapZone(playerId)) {
        SetPlayerMapZone(playerId, -1);
        return 1;
    }

    if (g_RivershellPlayer[playerId]) {
        CShell__SignPlayerOut(playerId);
        return 1;
    }

    if (isPlayerBrief[playerId]) {
        CBrief__SignPlayerOut(playerId);
        return 1;
    }

    if (CRobbery__GetPlayerStatus(playerId) >= ROBSTATUS_SIGNUP) {
        CRobbery__PlayerExit(playerId);
        return 1;
    }

    if (CHideGame__GetPlayerState(playerId) > HS_STATE_NONE) {
        CHideGame__onLeaveCommand(playerId);
        return 1;
    }

    if (WWTW_PlayerData[playerId][iStatus] != WWTW_STATE_NONE) {
        if (WWTW_PlayerData[playerId][iStatus] == WWTW_STATE_SIGNUP)
            CWWTW__PlayerLeft(playerId);
        else
            CWWTW__OnExit(playerId, 0);

        return 1;
    }

    if (CRobbery__GetPlayerStatus(playerId) == ROBSTATUS_SIGNUP) {
        CRobbery__PlayerExit(playerId);
        return 1;
    }

    return 0;
}

SavePlayerGameState(playerId) {
    if (LegacyIsPlayerInBombShop(playerId))
        RemovePlayerFromBombShop(playerId);

    GetPlayerPos(playerId, g_aSavedPlayerPosition[playerId][fSavedPosX], g_aSavedPlayerPosition[playerId][fSavedPosY],
        g_aSavedPlayerPosition[playerId][fSavedPosZ]);

    GetPlayerFacingAngle(playerId, g_aSavedPlayerPosition[playerId][fSavedAngle]);
    GetPlayerHealth(playerId, g_aSavedPlayerPosition[playerId][fSavedHealth]);
    GetPlayerArmour(playerId, g_aSavedPlayerPosition[playerId][fSavedArmour]);

    g_aSavedPlayerPosition[playerId][iSavedInteriorID] = GetPlayerInterior(playerId);
    g_aSavedPlayerPosition[playerId][iSavedSkinID] = GetPlayerSkin(playerId);
    g_aSavedPlayerPosition[playerId][iSavedWorldID] = GetPlayerVirtualWorld(playerId);

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++)
        GetPlayerWeaponData(playerId, weaponSlot, g_aSavedPlayerPosition[playerId][aSavedWeapons][weaponSlot],
            g_aSavedPlayerPosition[playerId][aSavedAmmo][weaponSlot]);

    return 1;
}

LoadPlayerGameState(playerId) {
    ResetPlayerWeapons(playerId);

    SetPlayerPos(playerId, g_aSavedPlayerPosition[playerId][fSavedPosX], g_aSavedPlayerPosition[playerId][fSavedPosY],
        g_aSavedPlayerPosition[playerId][fSavedPosZ]);

    SetPlayerFacingAngle(playerId, g_aSavedPlayerPosition[playerId][fSavedAngle]);
    SetPlayerHealth(playerId, g_aSavedPlayerPosition[playerId][fSavedHealth]);
    SetPlayerArmour(playerId, g_aSavedPlayerPosition[playerId][fSavedArmour]);
    SetPlayerInterior(playerId, g_aSavedPlayerPosition[playerId][iSavedInteriorID]);
    SetPlayerSkinEx(playerId, g_aSavedPlayerPosition[playerId][iSavedSkinID]);
    SetPlayerVirtualWorld(playerId, g_aSavedPlayerPosition[playerId][iSavedWorldID]);

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++)
        GiveWeapon(playerId, g_aSavedPlayerPosition[playerId][aSavedWeapons][weaponSlot],
            g_aSavedPlayerPosition[playerId][aSavedAmmo][weaponSlot]);

    ResetPlayerGameStateVariables(playerId);

    return 1;
}

ResetPlayerGameStateVariables(playerId) {
    g_aSavedPlayerPosition[playerId][fSavedPosX] = 0.0;
    g_aSavedPlayerPosition[playerId][fSavedPosY] = 0.0;
    g_aSavedPlayerPosition[playerId][fSavedPosZ] = 0.0;
    g_aSavedPlayerPosition[playerId][fSavedAngle] = 0.0;
    g_aSavedPlayerPosition[playerId][iSavedInteriorID] = 0;
    g_aSavedPlayerPosition[playerId][iSavedSkinID] = 0;
    g_aSavedPlayerPosition[playerId][iSavedWorldID] = 0;

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        g_aSavedPlayerPosition[playerId][aSavedWeapons][weaponSlot] = 0;
        g_aSavedPlayerPosition[playerId][aSavedAmmo][weaponSlot] = 0;
    }

    return 1;
}

ResetPlayerStats(playerId) {
    for (new i = 0; i < MAX_PLAYERS; i++) g_Ignore[playerId][i] = false;
    for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
        if (!Player(subjectId)->isConnected() || g_Ignore[subjectId][playerId] == false)
            continue;

        g_Ignore[subjectId][playerId] = false;
    }
    g_VirtualWorld[playerId] = 0;
#if Feature::DisableFightClub == 0
    IsPlayerWatchingFC[playerId] = false;
#endif
    for (new i =0; i < MAX_INTERIORS; i++) g_AllowWeapons[i][playerId] = false;
    iPlayerRampTime[playerId] = 0;
    iPlayerSesDeaths[playerId] = 0;
    waterFightOnDisconnect(playerId);
    iPlayerSesKills[playerId] = 0;
#if Feature::DisableHay == 0
    hayResetPlayerData(playerId);
#endif
    rwRemovePlayerFromMinigame(playerId);
    DestroyPlayerBox(playerId);
    CTaxi_ResetMayTaxi(playerId);
    ResetTeleCheatData(playerId);
    sprayTagResetData(playerId);
    radioStreamResetData(playerId);
    playerLastQuitInterior[playerId] = 0;
    WantedLevel[playerId] = 0;
    preventKillLamers[ playerId ] = 0;
    n_PlayerInGym[playerId] = 0;
    g_bPlayerGodmode[playerId] = 0;
    MyDrivebys[playerId] = false;
    MyHeliKills[playerId] = false;
    MyCarBombs[playerId] = false;
    g_PlayerInBombShop[playerId][0] = false;
    g_PlayerInBombShop[playerId][1] = false;
    g_NoCaps[playerId] = false;
    tempLevel[playerId] = 0;
    CancelTaxi(playerId);
    g_TextShow[playerId] = 0;
    bombDetonation[playerId] = false;
    IsPlayerInBombShop[playerId] = false;
    DetonateVehicle[playerId] = -1;
    bombDetonation[playerId] = 10;
    #if Feature::DisableKilltime == 0
    KTKills[playerId] = false;
    #endif
    iLoan[playerId] = 0;
    iLoanPercent[playerId] = 0;
    PlayerInfo[playerId][playerTJailSes] = 0;
    iLoan[playerId] = 0;
    isCaged[playerId] = false;
    PlayerInfo[playerId][playerIsHidden] = false;
    ColorManager->setPlayerMarkerHidden(playerId, false);
#if Feature::DisableFightClub == 0
    CFightClub__SetKillCount(playerId, 0);
    CFightClub__SetDeathCount(playerId, 0);
#endif
    g_PlayerMenu[playerId] = 0;
    g_NoCaps[playerId] = false;
    bPlayerWeaponStored[playerId] = 0;
    showMessagesEnabled[playerId] = true;
    g_PlayerMenu[playerId] = 0;
    playerTaxi[playerId][0] = -1;
    playerTaxi[playerId][5] = false;
    playerTaxi[playerId][4] = 0;
    DetonateVehicle[playerId]= -1;
    p_Team[playerId]= -1;
    g_RivershellPlayer[playerId] = 0;
    preventKillLamers[playerId] = 0;
    Drivebyer[playerId] = -1;
    HeliKill[playerId] = 0;
    UserTemped[playerId] = "";
    PlayerHandOfGod[playerId] = 0;
    g_LastSlapTime[playerId] = 0;
    g_LastSlappedBy[playerId] = INVALID_PLAYER_ID;
    WantedLevel[playerId] = 0;
    ResetPlayerRampingData(playerId);
    PlayerInfo[playerId][reactionTestWins] = 0;
    PlayerInfo[playerId][playerInCheckpoint] = 0;
    PlayerInfo[playerId][PlayerStatus] = STATUS_NONE;
    iLoan[playerId] = 0;
    iLoanPercent[playerId] = 0;
    PlayerInfo[playerId][playerTJailSes] = 0;
    gameplayhours[playerId] = 0;
    gameplayminutes[playerId] = 0;
    gameplayseconds[playerId] = 0;
    SavedPos2[playerId][0] = 2016.5950;
    SavedPos2[playerId][1] = 1545.0306;
    SavedPos2[playerId][2] = 10.8308;
    SavedPos2[playerId][3] = 0;
    SavedPos2[playerId][4] = 0;
    p_Team[playerId] = -1;
    g_InExportVeh[playerId] = false;
    OnMapConnect(playerId);
    ResetPlayerWeapons(playerId);
    DamageManager(playerId)->setFighting(0);
    iBriefColor[playerId] = -1;
    iPlayerInVipRoom[playerId] = false;
    iTuneTime[playerId] = 0;
    iDiveTime[playerId] = false;
    iPlayerDied[playerId] = false;
    MyDeaths[playerId] = 0;
    MyKills[playerId] = 0;
    PlayerInfo[playerId][reactionTestWins] = 0;
    playerVehExp[playerId] = 0;
    WonMinigame[playerId] = 0;
    ClearPlayer(playerId);
    iPlayerAnimation[playerId] = 0;
    ResetWeaponCheatCount(playerId);
    playerArmour[playerId] = 0.0;
    iPlayerSawnoffWeapon[playerId] = 0;
    banWarning[playerId] = 0;
    tpWarning[playerId] = 0;
    DeliveryResetStuff(playerId);
    ResetPlayerGameStateVariables(playerId);
    g_iTimeInfCommandLastUsed[playerId] = 0;

    return 1;
}

ShootingPlaceUpdate() {
    new propertyId = PropertyManager->propertyForSpecialFeature(WeaponsAmmoFeature),
        ownerId = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    if (Player(ownerId)->isConnected() == false || IsPlayerInMinigame(ownerId))
        return 0;

    new weaponId, ammunition, currentWeaponId = GetPlayerWeapon(ownerId);
    for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
        GetPlayerWeaponData(ownerId, weaponSlot, weaponId, ammunition);
        if (ammunition != 0)
            GiveWeapon(ownerId, weaponId, (random(100) + 20));
    }

    SetPlayerArmedWeapon(ownerId, currentWeaponId);
    SendClientMessage(ownerId, Color::ConnectionMessage, "* You received some ammo because you own the {A9C4E4}Shooting Range{CCCCCC}.");

    return 1;
}

FortCarsonUpdate() {
    // Fort Carson.
    new propertyId = PropertyManager->propertyForSpecialFeature(HealthFeature),
        ownerId = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    if (ownerId != Player::InvalidId && (Player(ownerId)->isConnected() == false || IsPlayerInMinigame(ownerId)))
        return 0;

    new Float: health;
    GetPlayerHealth(ownerId, health);

    if (health < 100)
        SetPlayerHealth(ownerId, health + 2);

    // LVP HQ.
    propertyId = PropertyManager->propertyForSpecialFeature(HealthProtectionFeature);
    ownerId = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    if (ownerId != Player::InvalidId && (Player(ownerId)->isConnected() == false || IsPlayerInMinigame(ownerId)))
        return 0;

    GetPlayerHealth(ownerId, health);
    if (health < 100)
        SetPlayerHealth(ownerId, health + 2);

    // Ammunation.
    propertyId = PropertyManager->propertyForSpecialFeature(ArmourFeature);
    ownerId = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    if (ownerId != Player::InvalidId && (Player(ownerId)->isConnected() == false || IsPlayerInMinigame(ownerId)))
        return 0;

    new Float: armour;
    GetPlayerArmour(ownerId, armour);

    if (armour < 100)
        SetPlayerArmour(ownerId, armour + 2);

    return 1;
}

ShowServerMessage() {
    new serverMessageCommands[8][12] = {"beg", "donate", "report", "rules", "forum", "reg", "swear", "weaps"};
    lvp_show(GetPlayerId("Gunther"), serverMessageCommands[random(8)]);
}

UpdatePlayerIngameTime(playerId) {
    if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
        return 0;

    gameplayseconds[playerId]++;
    if (gameplayseconds[playerId] >= 60) {
        gameplayseconds[playerId] = 0;
        gameplayminutes[playerId]++;

        if (gameplayminutes[playerId] >= 60) {
            gameplayminutes[playerId] = 0;
            gameplayhours[playerId]++;

            if (gameplayhours[playerId] == 50) {
                new notice[128];
                format(notice, sizeof(notice), "*** %s (Id:%d) has been promoted to LVP Regular!!",
                    Player(playerId)->nicknameString(), playerId);
                SendClientMessageToAllEx(COLOR_PINK, notice);

                SendClientMessage(playerId, COLOR_PINK,
                    "Congratulations! Now that you've reached 50 hours of in-game time, you're officially a LVP Regular!");
            }
        }
    }

    return 1;
}

Admin(senderId, text[]) {
    new notice[256];
    format(notice, sizeof(notice), "* Admin notice: {FFFFFF}%s", text);

    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
        if (Player(playerId)->isAdministrator() == true && playerId != senderId)
            SendClientMessage(playerId, Color::AdministratorColor, notice);
    }

    format(notice, sizeof(notice), "[admin] %s", text);
    AddEcho(notice);

    return 1;
}

ResetWorldBounds(playerId) {
    SetPlayerWorldBounds(playerId, 20000.0, -20000.0, 20000.0, -20000.0);
    return 1;
}

TaxUpdate() {
    new notice[128], totalInterest, interest;

    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (Player(playerId)->isConnected() == false || IsPlayerInMinigame(playerId))
            continue;

        if (iLoan[playerId] != 0) {
            interest = (iLoan[playerId] / 100 ) * iLoanPercent[playerId];
            GivePlayerMoney(playerId, -interest);
            totalInterest += interest;

            format(notice, sizeof(notice), "You've paid $%d interest! Use /payoff to pay off your loan.", interest);
            SendClientMessage(playerId, Color::Information, notice);
        }
    }

    if (totalInterest > 0) {
        new propertyId = PropertyManager->propertyForSpecialFeature(LoansFeature),
            ownerId = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

        if (ownerId != Player::InvalidId) {
            format(notice, sizeof(notice), "You've earned $%d from people's interests!", totalInterest);
            SendClientMessage(ownerId, Color::Success, notice);
            GivePlayerMoney(ownerId, totalInterest);
        }
    }

    return 1;
}

AddEcho(message[]) {
    if (strlen(message) > 480)
        return 0;

    SetEchoDestination(Configuration::EchoHostname, Configuration::EchoPort);
    EchoMessage(message);
    return 1;
}

strtok(const string[], &index) {
    new length = strlen(string);
    while ((index < length) && (string[index] <= ' '))
        index++;

    new offset = index, result[20];
    while ((index < length) && (string[index] > ' ') && ((index - offset) < (sizeof(result) - 1))) {
        result[index - offset] = string[index];
        index++;
    }
    result[index - offset] = EOS;

    return result;
}

Float:GetDistanceBetweenPlayers(p1, p2) {
    new Float: x1,Float: y1,Float: z1,Float: x2,Float: y2,Float: z2;
    if (Player(p1)->isConnected() == false || Player(p2)->isConnected() == false) {
        return -1.00;
    }

    GetPlayerPos(p1, x1, y1, z1);
    GetPlayerPos(p2, x2, y2, z2);
    return floatsqroot(floatpower(floatabs(floatsub(x2, x1)), 2) + floatpower(floatabs(floatsub(y2, y1)), 2) + floatpower(floatabs(floatsub(z2, z1)), 2));
}

Float:GetDistance(playerId, Float: x, Float: y, Float: z) {
    new Float: x1, Float: y1, Float: z1, Float: x2, Float: y2, Float: z2;
    GetPlayerPos(playerId, x1, y1, z1);
    x2 = x;
    y2 = y;
    z2 = z;

    return floatsqroot(floatpower(floatsqroot(floatpower(floatsub(x2, x1), 2) + floatpower(floatsub(y2, y1), 2)), 2) + floatpower(floatsub(z2, z1), 2));
}

right(source[], len) {
    new retval[255], srclen;
    srclen = strlen(source);
    strmid(retval, source, srclen - len, srclen, sizeof(retval));

    return retval;
}

formatPrice(price) {
    new string[256], formatted[256];

    format(string, sizeof(string), "%d", price);
    formatted = addCommas(string);

    return formatted;
}

addCommas(string[256]) {
    new len = strlen(string);

    if (len <= 3)
        return string;

    new offset = len;
    new returnstr[256], tempstr[256], dots;

    while (offset >= 3) {
        offset = offset - 3;
        strmid(tempstr, string, offset, (offset + 3));

        if (dots == 0)
            returnstr = tempstr;
        else
            format(returnstr, sizeof(returnstr), "%s,%s", tempstr, returnstr);
        dots++;
    }

    if (offset > 0) {
        strmid(tempstr, string, 0, offset);
        format(returnstr, sizeof(returnstr), "%s,%s", tempstr, returnstr);
    }

    return returnstr;
}

adler32(buf[]) {
    new length = strlen(buf), s1 = 1, s2 = 0, n;
    for (n = 0; n < length; n++) {
        s1 = (s1 + buf[n]) % 65521;
        s2 = (s2 + s1) % 65521;
    }

    return ((s2 << 16) + s1);
}

GetPlayerId(name[]) {
    new length = strlen(name);
    if (length < 3)
        return Player::InvalidId;

    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (Player(playerId)->isConnected() == true && (strcmp(name, Player(playerId)->nicknameString(), true, length) == 0))
            return playerId;
    }

    return Player::InvalidId;
}

IsNumeric(const string[]) {
    for (new i = 0, j = strlen(string); i < j; i++)
        if (string[i] > '9' || string[i] < '0')
            return 0;

    return 1;
}

Float: GetXYInFrontOfPlayer(playerId, &Float: x, &Float: y, Float: distance) {
    new Float: a;
    GetPlayerPos(playerId, x, y, a);

    if (IsPlayerInAnyVehicle(playerId))
        GetVehicleZAngle(GetPlayerVehicleID(playerId), a);
    else
        GetPlayerFacingAngle(playerId, a);

    x += (distance * floatsin(-a, degrees));
    y += (distance * floatcos(-a, degrees));

    return a;
}

SelectPlayer(tmp[]) {
    new pid;
    if (IsNumeric(tmp)) {
        pid = strval(tmp);
        if (Player(pid)->isConnected() == false)
            pid = Player::InvalidId;
    } else {
        new szName[24], count, id;
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        if (GetPlayerName(i, szName, sizeof(szName)))
        if (strfind(szName, tmp, true) != -1) {
            id = i;
            count++;
        }
        if (count == 1) pid = id;
        else pid = Player::InvalidId;
    }

    return pid;
}

SetMapIcons() {
    CreateDynamicMapIcon(2003.3196, 1544.8306, 13.5908, 9, 0xFFFFFFFF, 0); // Ship icon
    CreateDynamicMapIcon(2201.0830, 1990.6270, 16.7380, 52, 0xFFFFFFFF); // Dollar symbol at 24/7
    CreateDynamicMapIcon( 2246.5173, 2388.8694, 19.6592, 52, 0xFFFFFFFF); // Dollar symbol at 24/7
    CreateDynamicMapIcon(2386.7112, 1134.0580, 34.2529, 36, 0xFFFFFFFF, 0); // FRISIA
    CreateDynamicMapIcon(2287.89, 551.38, 10.88, 51, 0xFFFFFFFF, 0); // Export Vehicle Stuff
    CreateDynamicMapIcon(2441.2251, 2064.1978, 10.8203, 49, 0xFFFFFFFF, 0); // Bar icon near /taxi 4
    CreateDynamicMapIcon(airports[0][0], airports[0][1], airports[0][2], 5, 0);
    CreateDynamicMapIcon(airports[1][0], airports[1][1], airports[1][2], 5, 0);
    CreateDynamicMapIcon(airports[2][0], airports[2][1], airports[2][2], 5, 0);
    CreateDynamicMapIcon(2004.2256, 2296.8645, 10.5173, 48, 0); // l.v bombshop
    CreateDynamicMapIcon(1840.4243, -1856.5615, 13.3828, 48, 0); // l.s bomshop
    CreateDynamicMapIcon(2127.5334, 2360.0251, 10.8203, 25, 0); // VIP Room dice icon.
    CreateDynamicMapIcon(2193.6582, 1678.6570, 12.3672, 25, 0); // casinomap (caligulas)
    CreateDynamicMapIcon(2022.0692, 1008.5829, 10.8203, 25, 0); // casinomap (4 dragons)
    CreateDynamicMapIcon(2548.2905, 1969.5620, 10.8203, 52, 0); // bank icon (bigish bank close to ammunation)
    CreateDynamicMapIcon(1934.8868, 2307.5979,10.8203, 52 ,0); // bank icon (near bomb shop)
    CreateDynamicMapIcon(2089.8777, 2171.4780, 10.8203, 18, 0);
    CreateDynamicMapIcon(1963.0479, 2289.1885, 10.8203, 54, 0); // LV Gym near bombshop

    for (new i = 0; i < 5; i++)
        CreateDynamicMapIcon(TuningGarages[i][0], TuningGarages[i][1], TuningGarages[i][2], 27, 0);

    return 1;
}

ResetPlayerGunData(playerId) {
    bPlayerWeaponStored[playerId] = 0;

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        sPlayerWeapons[playerId][weaponSlot][0] = 0;
        sPlayerWeapons[playerId][weaponSlot][1] = 0;
    }

    return 1;
}

SavePlayerGuns(playerId) {
    if (bPlayerWeaponStored[playerId] != 0)
        return 0;

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        if (weaponSlot == 7 && Player(playerId)->isAdministrator() == false)
            continue;

        GetPlayerWeaponData(playerId, weaponSlot, sPlayerWeapons[playerId][weaponSlot][0],
            sPlayerWeapons[playerId][weaponSlot][1]);
    }
    bPlayerWeaponStored[playerId] = 1;
    GetPlayerArmour(playerId, playerArmour[playerId]);

    if (!IsPlayerInMapZone(playerId))
        ResetPlayerWeapons(playerId);

    return 1;
}

LoadPlayerGuns(playerId) {
    if (IsPlayerInMapZone(playerId))
        return 0;

    if (bPlayerWeaponStored[playerId] != 1 || PlayerInfo[playerId][PlayerStatus] != 0)
        return 0;

    bPlayerWeaponStored[playerId] = 0;

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        if (weaponSlot == 7 && Player(playerId)->isAdministrator() == false)
            continue;

        if (sPlayerWeapons[playerId][weaponSlot][0] != 0)
            GiveWeapon(playerId, sPlayerWeapons[playerId][weaponSlot][0], sPlayerWeapons[playerId][weaponSlot][1]);

        sPlayerWeapons[playerId][weaponSlot][0] = 0;
        sPlayerWeapons[playerId][weaponSlot][1] = 0;
    }
    SetPlayerArmour(playerId, playerArmour[playerId]);

    return 1;
}

RemovePlayerWeapon(playerId, weaponId) {
    if (WeaponUtilities->isWeaponValid(weaponId) == false)
        return 0;

    new weapon[WeaponSlots], ammo[WeaponSlots];
    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++)
        GetPlayerWeaponData(playerId, weaponSlot, weapon[weaponSlot], ammo[weaponSlot]);

    ResetPlayerWeapons(playerId);

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        if (weapon[weaponSlot] == weaponId || ammo[weaponSlot] == 0)
            continue;

        GiveWeapon(playerId, weapon[weaponSlot], ammo[weaponSlot]);
    }

    return 1;
}

PlayerName(playerId) {                          
    new name[MAX_PLAYER_NAME+1];
    GetPlayerName(playerId, name, sizeof(name));

    return name;
}

ConvertTime(time) {
    new m, s, string[256];
    if (time > 59) {
        m = floatround(time / 60);
        s = floatround(time - m * 60);
        if (s > 9)
            format(string, sizeof(string), "%d:%d", m, s);
        else
            format(string, sizeof(string), "%d:0%d", m, s);
    } else {
        s = floatround(time);
        if(s > 9)
            format(string, sizeof(string), "%d", s);
        else
            format(string, sizeof(string), "%d", s);
    }

    return string;
}

SendClientMessageToAllEx(color, message[]) {
    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (Player(playerId)->isConnected() == false || IsPlayerInMinigame(playerId))
            continue;

        SendClientMessage(playerId, color, message);
    }

    return 1;
}

GameTextForAllEx(const message[], time, style, playerWorldId = -1) {
    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (Player(playerId)->isConnected() == true && !IsPlayerInMinigame(playerId) && showMessagesEnabled[playerId]) {
            if (playerWorldId != -1) {
                if (playerWorldId == World::MainWorld) {
                    if (!IsPlayerInMainWorld(playerId))
                        continue;
                } else if (playerWorldId != GetPlayerVirtualWorld(playerId)) {
                    continue;
                }
            }

            GameTextForPlayer(playerId, message, time, style);
        }

        lastShowmsg = Time->currentTime();
    }
    return 1;
}

ClearPlayerMenus(playerId) {
    if (!Player(playerId)->isConnected())
        return 0;

    if (IsPlayerInBombShop[playerId])
        RemovePlayerFromBombShop(playerId);

    ShowPlayerDialog(playerId, -1, DIALOG_STYLE_MSGBOX, "Las Venturas Playground", "You shouldn't see this.", "Close", "");

    for (new i; i < MAX_MENUS; i++) {
        if (!IsValidMenu(Menu: i))
            continue;

        HideMenuForPlayer(Menu: i, playerId);
        g_PlayerMenu[playerId] = 0;
    }

    TogglePlayerControllable(playerId, true);

    return 1;
}

randomex(min, max) {
    return random(max - min) + min;
}

SetPlayerSkinEx(playerId, skinId) {
    if (Player(playerId)->isConnected() == false)
        return 0;

    ClearAnimations(playerId);
    SetPlayerSkin(playerId, skinId);
    ClearAnimations(playerId);

    return 1;
}

GetWantedLevel(playerId, kills) {
    if (Player(playerId)->isConnected() == false)
        return 0;

    new Float: wantedLevel = kills / 2,
        wanted = floatround(wantedLevel);

    if (wanted > 6)
        wanted = 6;

    if (wanted < 0)
        wanted = 0;

    return wanted;
}

SpawnNPCs(playerId) {
    new name[MAX_PLAYER_NAME];
    Player(playerId)->nickname(name, sizeof(name));

#if ReleaseSettings::CreateMerchant == 1
    CTheft__MaybeMerchantSpawn(playerId, name);
#endif

    return 1;
}

OnPlayerEnterGym(playerId) {
    SetPlayerCheckpoint(playerId, 774.9375, -62.2125, 1000.7184, 1.9);
    return 1;
}

OnPlayerEnterGymCheckpoint(playerId) {
    new listItems[] = "1\tBoxing\n2\tKungfu\n3\tDirty";
    ShowPlayerDialog(playerId, DIALOG_GYM_FIGHT, DIALOG_STYLE_LIST, "Training to Fight", listItems, "Select", "Cancel");

    return 1;
}

Float: DistanceCameraTargetToLocation(Float: CamX, Float: CamY, Float: CamZ, Float: ObjX, Float: ObjY, Float: ObjZ, Float: FrX, Float: FrY, Float: FrZ) {
    new Float: TGTDistance, Float: tmpX, Float: tmpY, Float: tmpZ;
    TGTDistance = floatsqroot((CamX - ObjX) * (CamX - ObjX) + (CamY - ObjY) * (CamY - ObjY) + (CamZ - ObjZ) * (CamZ - ObjZ));

    tmpX = FrX * TGTDistance + CamX;
    tmpY = FrY * TGTDistance + CamY;
    tmpZ = FrZ * TGTDistance + CamZ;

    return floatsqroot((tmpX - ObjX) * (tmpX - ObjX) + (tmpY - ObjY) * (tmpY - ObjY) + (tmpZ - ObjZ) * (tmpZ - ObjZ));
}

Float: GetPointAngleToPoint(Float: x2, Float: y2, Float: X, Float: Y) {
    new Float: DX, Float: DY, Float: fAng;

    DX = floatabs(floatsub(x2,X));
    DY = floatabs(floatsub(y2,Y));

    if (DY == 0.0 || DX == 0.0) {
        if (DY == 0 && DX > 0) fAng = 0.0;
        else if (DY == 0 && DX < 0) fAng = 180.0;
        else if  (DY > 0 && DX == 0) fAng = 90.0;
        else if(DY < 0 && DX == 0) fAng = 270.0;
        else if (DY == 0 && DX == 0) fAng = 0.0;
    } else {
        fAng = atan(DX/DY);

        if(X > x2 && Y <= y2) fAng += 90.0;
        else if(X <= x2 && Y < y2) fAng = floatsub(90.0, fAng);
        else if(X < x2 && Y >= y2) fAng -= 90.0;
        else if(X >= x2 && Y > y2) fAng = floatsub(270.0, fAng);
    }

    return floatadd(fAng, 90.0);
}

GetXYInFrontOfPoint(&Float: x, &Float: y, Float: fAng, Float: distance) {
    x += (distance * floatsin(-fAng, degrees));
    y += (distance * floatcos(-fAng, degrees));
}

IsPlayerAimingAt(playerId, Float:x, Float:y, Float:z, Float:radius) {
    new Float: camera_x, Float: camera_y, Float: camera_z, Float: vector_x, Float: vector_y,
        Float: vector_z, Float: vertical, Float: horizontal;

    GetPlayerCameraPos(playerId, camera_x, camera_y, camera_z);
    GetPlayerCameraFrontVector(playerId, vector_x, vector_y, vector_z);

    switch (GetPlayerWeapon(playerId)) {
        case 34, 35, 36: {
            if (DistanceCameraTargetToLocation(camera_x, camera_y, camera_z, x, y, z, vector_x, vector_y, vector_z) < radius)
                return true;
            return false;
        } case 30, 31: {
            vertical = 4.0;
            horizontal = -1.6;
        } case 33: {
            vertical = 2.7;
            horizontal = -1.0;
        } default: {
            vertical = 6.0;
            horizontal = -2.2;
        }
    }

    new Float: fAng = GetPointAngleToPoint(0, 0, floatsqroot(vector_x * vector_x + vector_y * vector_y), vector_z) - 270.0;
    new Float: resize_x, Float: resize_y, Float: resize_z = floatsin(fAng+vertical, degrees);
    GetXYInFrontOfPoint(resize_x, resize_y, GetPointAngleToPoint(0, 0, vector_x, vector_y) + horizontal, floatcos(fAng + vertical, degrees));

    if (DistanceCameraTargetToLocation(camera_x, camera_y, camera_z, x, y, z, resize_x, resize_y, resize_z) < radius)
        return true;

    return false;
}

PlaySoundForPlayersInRange(soundId, Float: range, Float: x, Float: y, Float: z) {
    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
            continue;

        if (!IsPlayerInRangeOfPoint(playerId, range, x, y, z))
            continue;

        PlayerPlaySound(playerId, soundId, x, y, z);
    }

    return 1;
}

CheckPlayerClubAudioStream(playerId) {
    if (GetPlayerInterior(playerId) == 17 && IsPlayerInRangeOfPoint(playerId, 70.0, 489.5824, -14.7563, 1000.6797)) {
        if (!GetPVarInt(playerId, "alhambra")) {
            SetPVarInt(playerId, "alhambra", 1);
            PlayAudioStreamForPlayer(playerId, "http://yp.shoutcast.com/sbin/tunein-station.pls?id=140547",
                480.9575, -3.5402, 1002.0781, 40.0, true);
        }
    } else {
        if (GetPVarInt(playerId, "alhambra")) {
            DeletePVar(playerId, "alhambra");
            StopAudioStreamForPlayer(playerId);
        }
    }

    return 1;
}

LegacyFixPlayer(playerId) {
    WantedLevel[playerId] = 0;
    g_VirtualWorld[playerId] = 0;
    PlayerHandOfGod[playerId] = 0;
    isCaged[playerId] = 0;
    PlayerInfo[playerId][playerIsHidden] = 0;

#if Feature::DisableFightClub == 0
    if (PlayerMatch[playerId] != -1)
        CFightClub__TerminateMatch(PlayerMatch[playerId]);
#endif

    return 1;
}

// ordinal
// Utility function to ordinalize a number; i.e. 1st, 2nd, 3rd, etc.
ordinal( str[], iLen, iNumber )
{
    new szSuffix[3];
    if ((iNumber % 100) / 10 == 1)
    {
        szSuffix = "th";
    }
    else
    {
        new iMod = iNumber % 10;
        switch (iMod)
        {
            case 1:     szSuffix = "st";
            case 2:     szSuffix = "nd";
            case 3:     szSuffix = "rd";
            default:    szSuffix = "th";
        }
    }

    format( str, iLen, "%d%s", iNumber, szSuffix );
    return 1;
}

GetPlayerIngameHours(playerId) {
    return gameplayhours[playerId];
}

GetPlayerIngameTime(playerId) {
    if (playerId < 0 || playerId >= MAX_PLAYERS)
        return 0;

    return 3600 * gameplayhours[playerId] + 60 * gameplayminutes[playerId] + gameplayseconds[playerId];
}

forward OnPlayerLeaveActivity(playerid);
public OnPlayerLeaveActivity(playerid) {}
