// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

SetPlayerSpawnPos(playerId) {
    TeleportCheatAddException(playerId);

    if (CSave__OnPlayerSpawn(playerId))
        return 0;

    // Reset various variables.
    DamageManager(playerId)->setFighting(0);
    ClearPlayerMenus(playerId);
    ClearAnimations(playerId);
    PlayerHandOfGod[playerId] = false;
    ResetWorldBounds(playerId);
    TogglePlayerControllable(playerId, true);
    iPlayerDied[playerId] = false;
    PlayerPlaySound(playerId, 1077, -752.7885, 464.6060, 1369.0648);
    SetPlayerInterior(playerId, 0);
    SetCameraBehindPlayer(playerId);
    isInSF[playerId] = false;
    ResetPlayerWeapons(playerId);
    CDrink__Spawn(playerId);
    OnPlayerLeaveMapZone(playerId, g_MapZone[playerId]);
    g_bPlayerGodmode[playerId] = 0;

    if (IsPlayerInMinigame(playerId))
        return 0;

    if (!SpawnPlayerInHouse(playerId))
        SetPlayerRandomSpawnPos(playerId);

    return 1;
}

OriginalOnPlayerSpawn(playerId) {
    // Handle restoring of saveinfo data if needed.
    if (CSave__OnPlayerSpawn(playerId))
        return 0;

    // Handle minigame spawning.
    if (CHideGame__GetPlayerState(playerId) == HS_STATE_PLAYING) {
        CHideGame__onPlayerSpawn(playerId);
        return 1;
    }

    if (CRobbery__Spawn(playerId))
        return 1;

    if (CLyse__GetPlayerState(playerId) == LYSE_STATE_RUNNING) {
        CLyse__SpawnPlayer(playerId);
        return 1;
    }

#if Feature::DisableFights == 0
    if (rwIsPlayerSignedUp(playerId)) {
        rwSpawnPlayer(playerId);
        return 1;
    }
#endif

    if (CLyse__GetPlayerState(playerId) == LYSE_STATE_RUNNING) {
        CLyse__SpawnPlayer(playerId);
        return 1;
    }

    if (g_RivershellPlayer[playerId]) {
        CShell__Spawn(playerId);
        return 1;
    }

#if Feature::DisableFights == 0
    if (CFightClub__IsPlayerFighting(playerId)) {
        CFightClub__OnSpawn(playerId);
        return 1;
    }
#endif

    // Show player nametags to everyone if the player isn't hidden.
    if (PlayerInfo[playerId][playerIsHidden] == 0) {
        for (new forPlayerId = 0; forPlayerId <= PlayerManager->highestPlayerId(); ++forPlayerId) {
            if (Player(forPlayerId)->isConnected() == true)
                continue;

            ShowPlayerNameTagForPlayer(forPlayerId, playerId, 1);
        }

        SetPlayerVisibility(playerid, true);
    }

#if Feature::DisableFights == 0
    // Remove the player from a minigame. If the player isn't in any minigame, make sure the skin
    // and color are correct.
    if (IsPlayerStatusMinigame(playerId))
        PlayerLigtUitMiniGame(playerId, KILLED);
    else
        ReleasePlayerGameColor(playerId);
#endif

    // Set the player's world.
    SetPlayerVirtualWorld(playerId, g_VirtualWorld[playerId]);

    // Set the global time and weather for the spawning player.
    SetPlayerWeather(playerId, g_iSavedWeatherID);
    TimeController->releasePlayerOverrideTime(playerId);

    g_isAiming[playerId] = false;

#if Feature::DisableFights == 0
    // Don't give out spawnmoney when returning from watching(!) a FC-fight
    if (IsPlayerWatchingFC[playerId])
        return true;
#endif

    return 1;
}