// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

OnPlayerLVPDisconnect(playerId, reason) {
    new bool: wasVip = Player(playerId)->isLoggedIn() ? (AccountData(playerId)->isVip())
                                                      : false;
    if (!wasVip)
        PlayerSettings(playerId)->setTeleportationDisabled(false);

    if (reason != 2)
        CSave__OnPlayerDisconnect(playerId);

    SetInvolvedInJavaScriptGame(playerId, false);

    CHideGame__onPlayerDisconnect(playerId);    // Hide & Seek
    CDrink__Disconnect(playerId);               // Drinking handler
    CRobbery__Disconnect(playerId);             // Robbery minigame
    CShell__SignPlayerOut(playerId);            // Rivershell minigame
    CBrief__SignPlayerOut(playerId);            // Capture the briefcase

    CChase__Disconnect(playerId);               // Chase handler
#if Feature::DisableFights == 0
    CWWTW__OnDisconnect(playerId);              // Walkies Weapons Team War minigame
#endif
    CLyse__SignPlayerOut(playerId);             // Local Yocal sports edition
    BagCash__Disconnect(playerId);

    for (new i = 0; i < MAX_PLAYERS; ++i) {
        if (g_LastSlappedBy[i] == playerId)
            g_LastSlappedBy[i] = INVALID_PLAYER_ID;
    }  

    if (!Player(playerId)->isNonPlayerCharacter()) {
        Announcements->announcePlayerDisconnected(
            playerId, BanManager->wasUndercoverKicked(playerId) ? 1 /* left */
                                                                : reason);
    }

    if (playerId == iServerChampion)
        iServerChampion = Player::InvalidId;

#if Feature::DisableFights == 0
    CFightClub__OnDisconnect(playerId);

    MinigameLeave(playerId, true);
#endif

    ResetPlayerStats(playerId);

    return 1;
}