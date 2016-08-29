// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Called when the player enters a checkpoint set for the player.
 *
 * @param playerid Id of the player who entered the checkpoint.
 */
public OnPlayerEnterCheckpoint(playerid) {
    if (Player(playerid)->isConnected() == false || Player(playerid)->isNonPlayerCharacter() == true)
        return 0;

    if (CRobbery__OnCPEnter(playerid))
        return 1;

    if (CLyse__GetPlayerState(playerid) == LYSE_STATE_RUNNING) {
        CLyse__Checkpoint(playerid);
        return 1;
    }

    CTheft__EnterCheckpoint(playerid);

    if (g_RivershellPlayer[playerid] && g_RivershellState == RIVERSHELL_STATE_RUNNING) {
        CShell__Checkpoint(playerid);
        return 1;
    }

    if (PlayerInfo[playerid][playerInCheckpoint] == 1)
        return 1;

    if (isPlayerBrief[playerid] && briefStatus == BRIEF_STATE_RUNNING) {
        CBrief__Checkpoint(playerid);
        return 1;
    }

    if (PlayerInfo[playerid][PlayerStatus] == STATUS_DELIVERY) {
        DeliveryComplete(playerid);
        return 1;
    }

    if (n_PlayerInGym[playerid])
        OnPlayerEnterGymCheckpoint(playerid);

    PlayerInfo[playerid][playerInCheckpoint] = 1;

    if (PlayerInfo[playerid][LastCheckType] == CP_TYPE_NORMAL && PlayerInfo[playerid][LastCheckID] == CP_INKOOP)
        CExport__OnEnterCheckpoint(playerid);

    return 1;
}