// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new g_PlayerWeapon[MAX_PLAYERS][50];
new iWeaponCheatCount[MAX_PLAYERS];

WeaponCheat(i) {
    if (Player(i)->isConnected() == false || Player(i)->isNonPlayerCharacter() == true)
        return 0;

    if (Player(i)->isAdministrator() == true)
        return 0;

    if (IsPlayerInMinigame(i))
        return 0;

    if (iPlayerDied[i])
        return 0;

    if (GetPlayerState(i) != PLAYER_STATE_ONFOOT)
        return 0;

    new notice[128], weaponId, ammo;
    GetPlayerWeaponData(i, 7, weaponId, ammo);

    #if Feature::DisableKilltime == 0
    if (weaponId == killTimeWeaponId && sKillTime)
        return 0;
    #endif

    // RPG
    if (weaponId == 35 && !g_PlayerWeapon[i][weaponId])
        iWeaponCheatCount[i]++;

    // Heat Seeker
    if (weaponId == 36 && !g_PlayerWeapon[i][weaponId])
        iWeaponCheatCount[i]++;

    // Flamethrower
    if (weaponId == 37 && !g_PlayerWeapon[i][weaponId])
        iWeaponCheatCount[i]++;

    // Minigun
    if (weaponId == 38 && !g_PlayerWeapon[i][weaponId])
        iWeaponCheatCount[i]++;

    if (iWeaponCheatCount[i] == 5) {
        format(notice, sizeof(notice), "Banning %s (Id:%d) for multiple weapon cheat detections.",
            Player(i)->nicknameString(), i);
        Admin(i, notice);

        Player(i)->ban("Multiple weapon cheat detections.");
    }

    return 1;
}

ResetWeaponCheatCount(playerId) {
    iWeaponCheatCount[playerId] = 0;
}

GiveWeapon(playerId, weaponId, ammo) {
    if (weaponId == 0)
        return 0;

    if (Player(playerId)->isConnected() == false)
        return 0;

    if (JailController->isPlayerJailed(playerId))
        return 0;

    if (WeaponUtilities->isWeaponValid(weaponId) == false)
        return 0;

    g_PlayerWeapon[playerId][weaponId] = 1;

    new absAmmo = ammo < 0 ? -ammo : ammo;
    if (absAmmo > 32767)
        absAmmo = 32767;

    GivePlayerWeapon(playerId, weaponId, absAmmo);

    return 1;
}

ClearSafeWeapons(playerId) {
    for (new weaponId; weaponId <= WeaponUtilities::HighestWeaponId; weaponId++)
        g_PlayerWeapon[playerId][weaponId] = 0;
}
