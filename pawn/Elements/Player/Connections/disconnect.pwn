// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

OnPlayerLVPDisconnect(playerId, reason) {
    if (reason != 2)
        CSave__OnPlayerDisconnect(playerId, reason);

    CHideGame__onPlayerDisconnect(playerId);    // Hide & Seek
    CDrink__Disconnect(playerId);               // Drinking handler
    CRobbery__Disconnect(playerId);             // Robbery minigame
    CShell__SignPlayerOut(playerId);            // Rivershell minigame
    CBrief__SignPlayerOut(playerId);            // Capture the briefcase
    CRace__EndForPlayer(playerId, DISCONNECT);  // Racing handler
    CChase__Disconnect(playerId);               // Chase handler
    CDerby__Disconnect(playerId);               // Derby handler.
    CWWTW__OnDisconnect(playerId);              // Walkies Weapons Team War minigame
    CLyse__SignPlayerOut(playerId);             // Local Yocal sports edition
    BagCash__Disconnect(playerId);

    if (IsPlayerInAnyVehicle(playerId) && GetPlayerState(playerId) == PLAYER_STATE_DRIVER) {
        if (IsVehicleLocked(GetPlayerVehicleID(playerId)))
            SetVehicleLocked(GetPlayerVehicleID(playerId), false);
    }

    if (BanManager->wasAutomaticallyBanned(playerId) == false && Player(playerId)->isNonPlayerCharacter() == false)
        Announcements->announcePlayerDisconnected(playerId, reason);

    if (playerId == iServerChampion)
        iServerChampion = Player::InvalidId;

#if Feature::EnableFightClub == 0
    CFightClub__OnDisconnect(playerId);
#endif

    MinigameLeave(playerId, true);
    ResetPlayerStats(playerId);

    return 1;
}