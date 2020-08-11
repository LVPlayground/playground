// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new lockedVehicleId[MAX_PLAYERS];

/**
 * Called when the player changes state.
 *
 * @param playerid Id of the player that changed state.
 * @param newstate The player's new state.
 * @param oldstate The player's old state.
 */
LegacyPlayerStateChange(playerid, newstate, oldstate) {
    if (Player(playerid)->isNonPlayerCharacter() == true)
        return 0;

    Annotation::ExpandList<OnPlayerStateChange>(playerid, newstate, oldstate);

    TeleportCheatAddException(playerid);
    ClearPlayerMenus(playerid);

    if (newstate == PLAYER_STATE_PASSENGER) {
        if (GetPlayerWeapon(playerid) == WEAPON_DEAGLE || GetPlayerWeapon(playerid) == WEAPON_SNIPER) {
            new weaponId, ammo;
            GetPlayerWeaponData(playerid, 4, weaponId, ammo);
            SetPlayerArmedWeapon(playerid, weaponId);
        }
    }

#if Feature::DisableFights == 0
    MinigameStateChange(playerid, newstate, oldstate);
    waterFightStateChange(playerid);
#endif

    CCrush__StateChange(playerid, newstate, oldstate);

    if (g_RivershellPlayer[playerid] && g_RivershellState == RIVERSHELL_STATE_RUNNING) {
        CShell__StateUpdate(playerid, newstate);
        return 1;
    }

    if (CLyse__GetPlayerState(playerid) == LYSE_STATE_RUNNING) {
        CLyse__StateUpdate(playerid, newstate);
        return 1;
    }

    if (briefStatus == BRIEF_STATE_RUNNING && isPlayerBrief[playerid]) {
        CBrief__StateChange(playerid, newstate);
        return 1;
    }

    if (PlayerInfo[playerid][PlayerStatus] == STATUS_DELIVERY) {
        DeliveryPlayerExitTruck(playerid);
        return 1;
    }

    if (newstate == PLAYER_STATE_DRIVER) {
        new const vehicleId = GetPlayerVehicleID(playerid);

        lockedVehicleId[playerid] = vehicleId;

        CTheft__EnterVehicle(playerid, vehicleId);
        CExport__EnterVehicle(playerid);

        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
            if (Player(subjectId)->isConnected() == false || Player(subjectId)->isNonPlayerCharacter() == true)
                continue;

            CBomb__EngineCheck(playerid, vehicleId, subjectId);
        }

        new modelId = GetVehicleModel(vehicleId);
        if ((modelId == 515 || modelId == 403 || modelId == 414) && vehicleId != GTA_Vehicle) {
            if (IsTrailerAttachedToVehicle(vehicleId))
                SendClientMessage(playerid, Color::Warning, "Type /deliver to start the delivery minigame.");
            else
                SendClientMessage(playerid, Color::Warning, "Find a trailer and type /deliver to start the delivery minigame.");
        }

        // Disable drive-by in the vortex.
        if (modelId == 539)
            SetPlayerArmedWeapon(playerid, 0 /* fists */);
    }

    if (oldstate == PLAYER_STATE_DRIVER) {
        if (lockedVehicleId[playerid] == GTA_Vehicle && !IsPlayerInMinigame(playerid))
            DisablePlayerCheckpoint(playerid);

        if (g_InExportVeh[playerid] && !IsPlayerInMinigame(playerid)) {
            g_PlayerCpVisible[playerid] = false;
            PlayerInfo[playerid][LastCheckType] = CP_TYPE_NONE;
            PlayerInfo[playerid][LastCheckID] = 0;
            g_InExportVeh[playerid] = false;
            DisablePlayerCheckpoint(playerid);
        }
    }

    return 1;
}