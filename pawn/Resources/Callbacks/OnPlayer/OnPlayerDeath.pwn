// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Define a threshold for the amount of deaths that we allow in 5 seconds, to avoid flooding.
#define DEATH_FLOOD_THRESHOLD 5

// Keep track of the amount of deaths for each player, which is being reset every 5 seconds.
new playerDeathsInTheLastFiveSeconds[MAX_PLAYERS];

/**
 * Every 5 seconds we'll reset the deaths tracked for each player.
 *
 * @param playerId Id of the player we're resetting this variable for.
 */
ResetDeathFloodCountForPlayer(playerId) {
    playerDeathsInTheLastFiveSeconds[playerId] = 0;
}

/**
 * This function is called whenever a player is lame killed. We will show the killed player a dialog
 * to punish their killer, and send out a message to all players telling them what just happend.
 *
 * @param playerId Id of the killed player.
 * @param killerId Id of the killer.
 */
OnPlayerLameKill(playerId, killerId) {
    // Handle the message and statistics for a drive-by/heli-kill separately.
    new message[256], modelId = GetVehicleModel(GetPlayerVehicleID(killerId));
    if (VehicleModel(modelId)->isHelicopter() == true) {
        MyHeliKills[killerId]++;
    } else {
        MyDrivebys[killerId]++;
    }

    Drivebyer[playerId] = killerId;

    // Inform the world about this wonderful event.
    new lameKills = MyDrivebys[killerId] + MyHeliKills[killerId];
    if (VehicleModel(modelId)->isHelicopter() == true)
        format(message, sizeof(message),
            "* %s has {A9C4E4}chopped the head off{CCCCCC} %s {A9C4E4}with a heli-blade{CCCCCC}! %s has {A9C4E4}%d lame kills{CCCCCC}.",
            Player(killerId)->nicknameString(), Player(playerId)->nicknameString(),
            Player(killerId)->nicknameString(), lameKills);
    else
        format(message, sizeof(message),
            "* %s has {A9C4E4}committed a driveby{CCCCCC} on %s! %s has {A9C4E4}%d lame kills{CCCCCC}.",
            Player(killerId)->nicknameString(), Player(playerId)->nicknameString(),
            Player(killerId)->nicknameString(), lameKills);

    SendClientMessageToAllEx(Color::ConnectionMessage, message);

    return 1;
}

/**
 * This callback is executed whenever a player dies. In that case we'll reset various variables,
 * do several checks, update statistics, handle minigames and send out killboard & IRC messages.
 *
 * General logic:
 *    - Reset global variables and do general checks.
 *    - Handles cases where we have ourselves a valid killer.
 *    - We're done setting our variables, meaning we can send out the killboard and IRC messages.
 *    - Finally, call minigame functions if needed, and handle lame killing.
 *
 * @param playerid Id of the killed player.
 * @param killerid Id of the killer, or INVALID_PLAYER_ID if none.
 * @param reason Id of the weapon/reason.
 */
LegacyPlayerDeath(playerid, killerid, reason) {
    Annotation::ExpandList<OnPlayerDeath>(playerid, killerid, reason);

    // ---- GENERAL CHECKS AND VARIABLES -----------------------------------------------------------

    if (playerid < 0 || playerid >= MAX_PLAYERS || Player(playerid)->isConnected() == false)
        return 0;

    if (Player(playerid)->isNonPlayerCharacter() == true || (killerid != Player::InvalidId && 
        Player(killerid)->isNonPlayerCharacter() == true))
        return 0;

    if (++playerDeathsInTheLastFiveSeconds[playerid] >= DEATH_FLOOD_THRESHOLD) {
        Player(playerid)->ban("Exceeded the death-flood threshold.");
        return 1;
    }

    // Reset various variables.
    iPlayerInVipRoom[playerid] = false;
    PlayerHandOfGod[playerid] = false;
    iPlayerDied[playerid] = false;
    CancelTaxi(playerid);
    playerTaxi[playerid][4] = 0;
    DamageManager(playerid)->setFighting(0);
    ClearPlayerMenus(playerid);
    iPlayerSesDeaths[playerid]++;

    // Disallow self-nading to suicide when the player has been hit in the last 15 seconds.
    if (killerid == Player::InvalidId && reason == WEAPON_NONE && (Time->currentTime() - DamageManager(playerid)->getLastHitTime()) < 15)
        LegacySetValidKillerVariables(playerid, DamageManager(playerid)->getLastHitId(), WEAPON_EXPLOSION);

    // Extract the died player from the map zone if he's in one.
    OnPlayerLeaveMapZone(playerid, g_MapZone[playerid]);

    // Sometimes a killerid might be incorrectly defined if a player's health is set to 0.
    if (validKillerId[playerid] != Player::InvalidId) {
        killerid = validKillerId[playerid];
        validKillerId[playerid] = Player::InvalidId;
    }

    // Sometimes a reason might be incorrectly defined if a player's health is set to 0.
    if (validReasonId[playerid] != WEAPON_NONE) {
        reason = validReasonId[playerid];
        validReasonId[playerid] = WEAPON_NONE;
    }

    // If the player is caged, reset the boundaries.
    if (isCaged[playerid]) {
        isCaged[playerid] = false;
        ResetWorldBounds(playerid);
    }

    // ---- VALID KILLER CASES ---------------------------------------------------------------------

    if (killerid != Player::InvalidId && Player(killerid)->isConnected() == true) {
        iPlayerSesKills[killerid]++;

        // Handle wanted levels.
        if (!IsPlayerInMinigame (killerid))
            WantedLevel__OnPlayerDeath (playerid, killerid);

        // Handle bonus time kills.
        BonusTime__CheckPlayer(killerid, 2);
    }

    // ---- KILLBOARD & IRC DEATH MESSAGE PROCESS --------------------------------------------------

    if (hiddenKill[playerid] && killerid == INVALID_PLAYER_ID)
        hiddenKill[playerid] = 0;
    else
        CallLocalFunction("OnPlayerResolvedDeath", "iii", playerid, killerid, reason);  // SendDeathMessage through JavaScript.

    // Send the death message right now, as JavaScript won't be able to do it anymore.
    if (g_isDisconnecting[playerid])
        SendDeathMessage(killerid, playerid, reason);

    new message[256];
    if (killerid == Player::InvalidId) {
        EchoMessage("death", "s", Player(playerid)->nicknameString());
    } else {
        new weaponName[64];
        GetWeaponName(reason, weaponName, sizeof(weaponName));

        if (strlen(weaponName) > 0) {
            format(message, sizeof(message), "%s %d %s %d %s", 
                Player(playerid)->nicknameString(), playerid,
                Player(killerid)->nicknameString(), killerid,
                weaponName);

            EchoMessage("kill", "sdsdz", message);
        } else {
            format(message, sizeof(message), "%s %d %s %d", 
                Player(playerid)->nicknameString(), playerid,
                Player(killerid)->nicknameString(), killerid);

            EchoMessage("kill-no-reason", "sdsd", message);
        }
    }

    // ---- MINIGAME & LAME-KILL CHECKS ------------------------------------------------------------

    // Brief
    if (briefStatus == BRIEF_STATE_RUNNING && isPlayerBrief[playerid]) {
        CBrief__Death(playerid, killerid);
        return 1;
    }

    // Hide 'n Seek
    if (CHideGame__GetPlayerState(playerid) == HS_STATE_PLAYING) {
        CHideGame__onPlayerDeath(playerid);
        return 1;
    }

    // Robbery
    if (CRobbery__GetPlayerStatus(playerid) == ROBSTATUS_PLAYING)
        return 1;

#if Feature::DisableFights == 0
    // WWTW
    if (WWTW_PlayerData[playerid][iStatus] == WWTW_STATE_PLAYING) {
        CWWTW__OnDeath(playerid);
        return 1;
    }

    // RWTW
    if (rwIsPlayerSignedUp(playerid)) {
        rwOnPlayerDeath(playerid, killerid);
        return 1;
    }

    // Fightclub
    if (CFightClub__IsPlayerFighting(playerid)) {
        CFightClub__OnDeath(playerid, killerid);
        return 1;
    }
#endif

    // Chase
    if (killerid != Player::InvalidId && Player(killerid)->isConnected() == true
        && chaseData[0] == 1 && playerid == chaseData[1]) {
        CChase__Stop(1, killerid);
        return 1;
    } else if ((killerid == Player::InvalidId || Player(killerid)->isConnected() == false)
        && chaseData[0] == 1 && playerid == chaseData[1]) {
        CChase__Stop(3, -1);
        return 1;
    }

    // Lame kill
    new const bool: isLameKill =
        killerid != Player::InvalidId &&
        IsPlayerInMainWorld(killerid) &&
        GetPlayerState(killerid) == PLAYER_STATE_DRIVER &&
        (
            reason == 28 /* UZI */ ||
            reason == 29 /* MP5 */ ||
            reason == 32 /* TEC-9 */ ||
            GetVehicleModel(GetPlayerVehicleID(killerid)) == 464 /* RC Baron */ ||
            VehicleModel(GetVehicleModel(GetPlayerVehicleID(killerid)))->isHelicopter()
        );

    if (isLameKill) {
        new Float:distanceBetweenPlayers = GetDistanceBetweenPlayers(playerid, killerid);
        if (PlayerInfo[killerid][PlayerStatus] != STATUS_CHASE && distanceBetweenPlayers < 100.0)
            return OnPlayerLameKill(playerid, killerid);
    }

    return 1;
}

forward OnPlayerResolvedDeath(playerid, killerid, reason);
public OnPlayerResolvedDeath(playerid, killerid, reason) {}
