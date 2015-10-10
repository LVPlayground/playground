// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when a player changes interior.
 *
 * @param playerid Id of the player who changed interior.
 * @param newinteriorid The interior the player is now in.
 * @param oldinteiorid The interior the player was in.
 */
public OnPlayerInteriorChange(playerid, newinteriorid, oldinteriorid) {
    Annotation::ExpandList<OnPlayerInteriorChange>(playerid, newinteriorid, oldinteriorid);

    TeleportCheatAddException(playerid);

    if (CRobbery__OnInteriorChange(playerid, newinteriorid))
        return 1;

    if (CHideGame__onInteriorChange(playerid, oldinteriorid))
        return 1;

    if (newinteriorid > 0 && newinteriorid < 4) { /* Tune Shops */
        for (new j = 0; j < sizeof(TuningGarages); j++) {
            if (IsPlayerInRangeOfPoint(playerid, 50.0, TuningGarages[j][0], TuningGarages[j][1], TuningGarages[j][2])
                && IsPlayerInAnyVehicle(playerid) && !IsPlayerInMinigame(playerid)) {
                PlayerState(playerid)->updateState(VehicleTuningPlayerState);
                break;
            }
        }
    }

    if (PlayerState(playerid)->currentState() != VehicleTuningPlayerState)
        ClearPlayerMenus(playerid);

    if ((newinteriorid == 1 || newinteriorid == 4 || newinteriorid == 6 || newinteriorid == 7) && !IsPlayerInAnyVehicle(playerid))
        SetTimerEx("ammunationTimer", 1000, 0, "i", playerid);

    if (newinteriorid > 0 && newinteriorid != 7 && !IsPlayerInMinigame(playerid)) {
        if (!g_AllowWeapons[newinteriorid][playerid])
            SetPlayerTeam(playerid, newinteriorid);
    }

    if (newinteriorid == 7)
        iTimeEnteredGym[playerid] = Time->currentTime();
    else {
        if (n_PlayerInGym[playerid]) {
            iTimeEnteredGym[playerid] = 0;
            n_PlayerInGym[playerid] = 0;
            DisablePlayerCheckpoint(playerid);
        }
    }

    if (newinteriorid == 0 && oldinteriorid != 0) {
        playerLastQuitInterior[playerid] = Time->currentTime();

        if (PlayerState(playerid)->currentState() == VehicleTuningPlayerState)
            PlayerState(playerid)->releaseState();
    }

    return 1;
}

forward ammunationTimer(playerId);
public ammunationTimer(playerId) {
    SetPlayerShopName(playerId, "");
    return 1;
}