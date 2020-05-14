// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

SetPlayerPosHook(playerId, Float: x, Float: y, Float: z) {
    TeleportCheatAddException(playerId);
    return SetPlayerPos(playerId, Float: x, Float: y, Float: z);
}

#if Feature::EnableServerSideWeaponConfig
    #undef SetPlayerPos
#endif

#define SetPlayerPos SetPlayerPosHook

new g_iSavedWeatherID;
GetMainWorldWeatherId() {
    return g_iSavedWeatherID;
}

SetMainWorldWeatherId(id) {
    g_iSavedWeatherID = id;
}

strval2(const string[]) {
    if (strlen(string) >= 50)
        return cellmax;

    return strval(string);
}
#define strval(%1) strval2(%1)

ResetPlayerWeaponsHook(playerId) {
    ClearSafeWeapons(playerId);
    return ResetPlayerWeapons(playerId);
}
#define ResetPlayerWeapons ResetPlayerWeaponsHook

forward OnResetPlayerWeapons(playerId);
public OnResetPlayerWeapons(playerId) {
    return ResetPlayerWeapons(playerId);
}

str_shift(string[], start) {
    new i;
    for (i = 0; i < start; i++) {
        if (string[i] == '\0') {
            string[0] = '\0';
            return 0;
        }
    }

    for (i = start; string[i] != '\0'; i++)
        string[i-start] = string[i];

    string[i-start] = '\0';
    return 1;
}