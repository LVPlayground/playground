// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define FINISH     0
#define ONFOOT     1
#define KILLED     2
#define TOOSLOW    3
#define DISCONNECT 4
#define LONELY     5
#define LEFT       6
#define SIGNOUT    7

#if Feature::DisableFights == 0
#include Resources/Minigames/Core/MinigamesHandler.pwn
#include Resources/Minigames/Core/DeathmatchHandler.pwn
#endif

#include Resources/Minigames/Deliver/Deliver.pwn

#include Resources/Minigames/Core/Brief.pwn
#include Resources/Minigames/Core/Derby.pwn
#include Resources/Minigames/Core/Robbery.pwn

#if Feature::DisableFights == 0
#include Resources/Minigames/Core/WWTW.pwn
#include Resources/Minigames/Core/RWTW.pwn
#endif

#include Resources/Minigames/Core/Rivershell.pwn
#include Resources/Minigames/Core/Lyse.pwn
#include Resources/Minigames/Core/HideGame.pwn

#if Feature::DisableFights == 0
#include Resources/Minigames/Core/WaterFight.pwn
#endif

#if Feature::DisableHay == 0
#include Resources/Minigames/Core/HayStack/Core.pwn
#endif

// Converts the type of minigame a player is playing to a MinigameType enumeration value.
MinigameType: GetPlayerMinigameType(playerId) {
    if (IsPlayerInMapZone(playerId))
        return JumpMinigame;

#if Feature::DisableFights == 0
    if (IsPlayerStatusMinigame(playerId))
        return DeathmatchMinigame;

    if (waterFightIsPlayerPlaying(playerId) || waterFightIsPlayerSignedUp(playerId))
        return WaterFightMinigame;
#endif

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

#if Feature::DisableFights == 0
    if (rwIsPlayerSignedUp(playerId))
        return RunWeaponsTeamWarMinigame;

    if (WWTW_PlayerData[playerId][iStatus] >= WWTW_STATE_SIGNUP)
        return WalkiesWeaponsTeamWarMinigame;
#endif

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

#if Feature::DisableFights == 0
    if (IsPlayerStatusMinigame(playerId)) {
        format(notice, sizeof(notice), "%s", ReturnMinigameName(PlayerInfo[playerId][PlayerStatus]));
        goto l_Success;
    }
#endif

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

#if Feature::DisableFights == 0
    if (WWTW_PlayerData[playerId][iStatus] >= WWTW_STATE_SIGNUP) {
        notice = "Walkies Weapons Team War";
        goto l_Success;
    }
#endif

    if (CDerby__GetPlayerState(playerId) >= DERBY_STATE_SIGNUP) {
        format(notice, sizeof(notice), "%s", CDerby__GetName(CDerby__GetPlayerDerby(playerId)));
        goto l_Success;
    }

    if (CLyse__GetPlayerState(playerId) >= LYSE_STATE_SIGNUP) {
        notice = "Local Yocal Sports Edition";
        goto l_Success;
    }

#if Feature::DisableFights == 0
    if (rwIsPlayerSignedUp(playerId)) {
        notice = "Run Weapons Team War";
        goto l_Success;
    }
#endif

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

#if Feature::DisableFights == 0
    if (waterFightIsPlayerSignedUp(playerId)) {
        notice = "WaterFight";
        goto l_Success;
    }
#endif

    if (CHideGame__GetPlayerState(playerId) >= HS_STATE_SIGNING_UP) {
        notice = "Hide and Seek";
        goto l_Success;
    }

#if Feature::DisableFights == 0
    if (CFightClub__IsPlayerFighting(playerId)) {
        notice = "FightClub";
        goto l_Success;
    }
#endif

    if (!strlen(notice))
        notice = "Unknown";

    l_Success:
    return notice;
}

#if Feature::DisableFights == 1

new g_FightClubStats[MAX_PLAYERS][2];

CFightClub__GetKillCount(playerId) { return g_FightClubStats[playerId][0]; }
CFightClub__SetKillCount(playerId, count) { g_FightClubStats[playerId][0] = count; }

CFightClub__GetDeathCount(playerId) { return g_FightClubStats[playerId][1]; }
CFightClub__SetDeathCount(playerId, count) { g_FightClubStats[playerId][1] = count; }

IsPlayerInMinigame(playerId) {
    if (PlayerActivity(playerId)->isJavaScriptActivity())
        return 1;

    if (IsPlayerInMapZone(playerId))
        return 1;

#if Feature::DisableHay == 0
    if (hayHasPlayerSignedUp(playerId) && hayGetState() > 1)
        return 1;
#endif

    if (CLyse__GetPlayerState(playerId) > 1)
        return 1;

    if (CHideGame__GetPlayerState(playerId) == 2)
        return 1;

    if (CDerby__GetPlayerState(playerId) > 2)
        return 1;

    if (isPlayerBrief[playerId] && briefStatus == 2)
        return 1;

    if (g_RivershellPlayer[playerId] && g_RivershellState == 2)
        return 1;

    if (CRobbery__GetPlayerStatus(playerId) > 1)
        return 1;

    return 0 ;
}


IsPlayerMinigameFree(playerId) {
    if (!Player(playerId)->isConnected())
        return 0;

    if (g_RivershellPlayer[playerId])
        return 0;

    if (CRobbery__GetPlayerStatus(playerId) > 0)
        return 0;

    if (isPlayerBrief[playerId])
        return 0;

    if (CDerby__GetPlayerState(playerId) >= 2)
        return 0;

    if (CLyse__GetPlayerState(playerId) >= 1)
        return 0;

    if (CHideGame__GetPlayerState(playerId) > 0)
        return 0;

#if Feature::DisableHay == 0
    if (hayHasPlayerSignedUp(playerId))
        return 0;
#endif

    return 1;
}

#endif
