// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// TODO: Move this somewhere more appropriate.

forward OnJavaScriptLoaded();
public OnJavaScriptLoaded() {
    g_javaScriptInitialized = true;
    Annotation::ExpandList<OnJavaScriptLoaded>();
}

// TODO(Russell): Remove this once there are users of the OnJavaScriptLoaded annotation.
class Foo {
    @list(OnJavaScriptLoaded)
    public onJavaScriptLoaded() {}
}

new Float: g_storedPlayerPositions[MAX_PLAYERS][4];
new g_storedPlayerInteriors[MAX_PLAYERS];
new g_storedPlayerVirtualWorlds[MAX_PLAYERS];

forward OnSerializePlayerState(playerid, serialize);
public OnSerializePlayerState(playerid, serialize) {
    if (serialize) {
        ClearPlayerMenus(playerid);

        TogglePlayerSpectating(playerid, 0);

        if (IsPlayerInAnyVehicle(playerid))
            RemovePlayerFromVehicle(playerid);

        GetPlayerFacingAngle(playerid, g_storedPlayerPositions[playerid][3]);
        GetPlayerPos(playerid, g_storedPlayerPositions[playerid][0],
                     g_storedPlayerPositions[playerid][1], g_storedPlayerPositions[playerid][2]);

        g_storedPlayerInteriors[playerid] = GetPlayerInterior(playerid);
        g_storedPlayerVirtualWorlds[playerid] = GetPlayerVirtualWorld(playerid);

        TimeController->setPlayerOverrideTime(playerid, 0, 0, false);

        DisablePlayerCheckpoint(playerid);
        DisablePlayerRaceCheckpoint(playerid);

        // TODO(Russell): This function may eventually be used for more than just races.
        PlayerState(playerid)->updateState(RacingPlayerState);
        SavePlayerGuns(playerid);

    } else {  // deserialize
        LoadPlayerGuns(playerid);
        if (PlayerState(playerid)->currentState() == RacingPlayerState)
            PlayerState(playerid)->releaseState();

        DisablePlayerCheckpoint(playerid);
        DisablePlayerRaceCheckpoint(playerid);

        TimeController->releasePlayerOverrideTime(playerid);

        SetPlayerVirtualWorld(playerid, g_storedPlayerVirtualWorlds[playerid]);
        SetPlayerInterior(playerid, g_storedPlayerInteriors[playerid]);

        SetPlayerPos(playerid, g_storedPlayerPositions[playerid][0],
                     g_storedPlayerPositions[playerid][1], g_storedPlayerPositions[playerid][2]);
        GetPlayerFacingAngle(playerid, g_storedPlayerPositions[playerid][3]);

        SetPlayerWeather(playerid, g_iSavedWeatherID);
    }
}

// Required by JavaScript, do not remove.
public OnPlayerClickPlayerTextDraw(playerid, PlayerText:playertextid) {}
