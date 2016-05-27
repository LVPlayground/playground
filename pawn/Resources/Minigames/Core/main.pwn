// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new DeathmatchTimer;

#include Resources/Minigames/Core/MinigamesHandler.pwn
#include Resources/Minigames/Core/DeathmatchHandler.pwn
#include Resources/Minigames/Deliver/Deliver.pwn

#include Resources/Minigames/Core/Brief.pwn
#include Resources/Minigames/Core/Derby.pwn
#include Resources/Minigames/Core/Robbery.pwn
#include Resources/Minigames/Core/WWTW.pwn
#include Resources/Minigames/Core/RWTW.pwn
#include Resources/Minigames/Core/Rivershell.pwn
#include Resources/Minigames/Core/Lyse.pwn
#include Resources/Minigames/Core/HideGame.pwn
#include Resources/Minigames/Core/WaterFight.pwn

#if Feature::DisableHay == 0
#include Resources/Minigames/Core/HayStack/Core.pwn
#endif

// Converts the type of minigame a player is playing to a MinigameType enumeration value.
MinigameType: GetPlayerMinigameType(playerId) {
    if (IsPlayerInMapZone(playerId))
        return JumpMinigame;

    if (IsPlayerStatusMinigame(playerId))
        return DeathmatchMinigame;

    if (waterFightIsPlayerPlaying(playerId) || waterFightIsPlayerSignedUp(playerId))
        return WaterFightMinigame;

#if Feature::DisableHay == 0
    if (hayHasPlayerSignedUp(playerId))
        return HayStackMinigame;
#endif

    if (isPlayerBrief[playerId])
        return CaptureBriefcaseMinigame;

    if (CRobbery__GetPlayerStatus(playerId) >= ROBSTATUS_SIGNUP)
        return CasinoRobberyMinigame;

    if (g_RivershellPlayer[playerId])
        return RivershellMinigame;

    if (rwIsPlayerSignedUp(playerId))
        return RunWeaponsTeamWarMinigame;

    if (WWTW_PlayerData[playerId][iStatus] >= WWTW_STATE_SIGNUP)
        return WalkiesWeaponsTeamWarMinigame;

    if (CLyse__GetPlayerState(playerId) >= LYSE_STATE_SIGNUP)
        return LocalYocalSportsEditionMinigame;

    if (CDerby__GetPlayerState(playerId) >= DERBY_STATE_SIGNUP)
        return DerbyMinigame;

    if (CHideGame__GetPlayerState(playerId) >= HS_STATE_SIGNING_UP)
        return HideAndSeekMinigame;

    return UnknownMinigame;
}

// Return the name of the minigame.
GetPlayerMinigameName(playerId) {
    new notice[128];

    if (Player(playerId)->isConnected() == false) {
        format(notice, sizeof(notice), "Unknown");
        return notice;
    }

    if (PlayerActivity(playerId)->isJavaScriptActivity()) {
        switch (PlayerActivity(playerId)->get()) {
            case PlayerActivityJsRace:
                format(notice, sizeof(notice), "Racing");
            default:
                format(notice, sizeof(notice), "Unknown");
        }

        return notice;
    }

    if (IsPlayerStatusMinigame(playerId)) {
        format(notice, sizeof(notice), "%s", ReturnMinigameName(PlayerInfo[playerId][PlayerStatus]));
        goto l_Success;
    }

    if (g_RivershellPlayer[playerId]) {
        notice = "Rivershell";
        goto l_Success;
    }

    if (isPlayerBrief[playerId]) {
        notice = "Capture the Briefcase";
        goto l_Success;
    }

    if (CRobbery__GetPlayerStatus(playerId) >= ROBSTATUS_SIGNUP) {
        notice = "Casino Robbery";
        goto l_Success;
    }

    if (WWTW_PlayerData[playerId][iStatus] >= WWTW_STATE_SIGNUP) {
        notice = "Walkies Weapons Team War";
        goto l_Success;
    }

    if (CDerby__GetPlayerState(playerId) >= DERBY_STATE_SIGNUP) {
        format(notice, sizeof(notice), "%s", CDerby__GetName(CDerby__GetPlayerDerby(playerId)));
        goto l_Success;
    }

    if (CLyse__GetPlayerState(playerId) >= LYSE_STATE_SIGNUP) {
        notice = "Local Yocal Sports Edition";
        goto l_Success;
    }

    if (rwIsPlayerSignedUp(playerId)) {
        notice = "Run Weapons Team War";
        goto l_Success;
    }

#if Feature::DisableHay == 0
    if (hayHasPlayerSignedUp(playerId)) {
        notice = "HayStack";
        goto l_Success;
    }
#endif

    if (IsPlayerInMapZone(playerId)) {
        format(notice, sizeof(notice), "%s", Map_Zone[GetPlayerMapZone(playerId)][Map_Name]);
        goto l_Success;
    }

    if (waterFightIsPlayerSignedUp(playerId)) {
        notice = "WaterFight";
        goto l_Success;
    }

    if (CHideGame__GetPlayerState(playerId) >= HS_STATE_SIGNING_UP) {
        notice = "Hide and Seek";
        goto l_Success;
    }

    if (!strlen(notice))
        notice = "Unknown";

    l_Success:
    return notice;
}