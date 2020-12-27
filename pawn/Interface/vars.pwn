// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 *
 * DO NOT ADD NEW VARIABLES TO THIS FILE. VARIABLES SHOULD BE DECLARED IN THE FILE THAT ACTUALLY
 * USES THEM. FEATURES SHOULD BE ISOLATED TO THEIR OWN FILE.
 *
 */

new iServerChampion = Player::InvalidId;
new iRecordName[MAX_PLAYER_NAME+1] = "LVP";
new playerLastQuitInterior[MAX_PLAYERS];
new iRconLoginAttempts[MAX_PLAYERS];
new iPlayerSesDeaths[MAX_PLAYERS];
new iPlayerSesKills[MAX_PLAYERS];
new iPlayerDied[MAX_PLAYERS];
new g_CrushIcon;
new iDiveTime[MAX_PLAYERS];
new g_iShipIcon = 0; 
new iTuneTime[MAX_PLAYERS];
new n_PlayerInGym[MAX_PLAYERS];
new g_InExportVeh[MAX_PLAYERS];
new g_PlayerCpVisible[MAX_PLAYERS];
new Vip;
new VipExit;
new iPlayerInVipRoom[MAX_PLAYERS];
new sPlayerWeapons[MAX_PLAYERS][14][2];
new g_TrainPickup_0;
new g_TrainPickup_1;
new g_TrainPickup_2;
new g_TrainPickup_3;
new g_TrainPickup_4;
new bool: showMessagesEnabled[MAX_PLAYERS];
new playerTaxi[MAX_PLAYERS][6];
new bool: g_isAiming[MAX_PLAYERS];
new isGateOpen;
new g_AllowWeapons[MAX_INTERIORS][MAX_PLAYERS];
new g_FlagTime[MAX_PLAYERS];
new Drivebyer[MAX_PLAYERS];
new preventKillLamers[MAX_PLAYERS];
new playerVehExp[MAX_PLAYERS];
new g_PlayerMenu[ MAX_PLAYERS ];
new isInSF[MAX_PLAYERS];
new g_bPlayerGodmode[ MAX_PLAYERS ];
new g_LastSlapTime[MAX_PLAYERS];
new g_LastSlappedBy[MAX_PLAYERS];
new bankRente = 4;
new Float: SavedPos2[MAX_PLAYERS][5];
new isCaged[MAX_PLAYERS];
new UserTemped[MAX_PLAYERS][MAX_PLAYER_NAME+1];
new g_AirportPickup[4];
new Menu:AirportMenu[4];
new AirTime[MAX_PLAYERS];
new firstJoin[MAX_PLAYERS];
#if Feature::DisableFights == 0
new FCPickup;
new FCDPickup;
#endif
new PlayerHandOfGod[MAX_PLAYERS];
new WonMinigame[MAX_PLAYERS];
new MyDrivebys[MAX_PLAYERS];
new MyHeliKills[MAX_PLAYERS];
new MyCarBombs[MAX_PLAYERS];
new WantedLevel[MAX_PLAYERS];
new gameplayseconds[MAX_PLAYERS];
new gameplayminutes[MAX_PLAYERS];
new gameplayhours[MAX_PLAYERS];
new DynamicObject: AirportGate;
new iLoan[MAX_PLAYERS];
new iLoanPercent[MAX_PLAYERS];
new hiddenKill[MAX_PLAYERS];
new tempLevel[MAX_PLAYERS];
new Float: playerArmour[MAX_PLAYERS];
new g_RivershellState; 
new g_RivershellPlayer[MAX_PLAYERS];
new isPlayerBrief[MAX_PLAYERS];
new briefStatus;
new bool: g_isDisconnecting[MAX_PLAYERS] = { false, ... };

enum ePlayerPosition {
    Float:fSavedPosX,
    Float:fSavedPosY,
    Float:fSavedPosZ,
    Float:fSavedAngle,
    Float:fSavedHealth,
    Float:fSavedArmour,
    iSavedInteriorID,
    iSavedSkinID,
    iSavedWorldID,
    aSavedWeapons[13],
    aSavedAmmo[13]
}
new g_aSavedPlayerPosition[MAX_PLAYERS][ePlayerPosition];

new Float: TuningGarages[5][3] = {
    {2645.6147, -2029.1504, 13.1199},
    {1041.2538, -1036.7649, 31.3224},
    {2387.5684, 1035.6943, 10.4054},
    {-1935.7634, 228.7896, 33.7235},
    {-2707.4700, 218.6432, 3.7641}
};

new Float: airports[4][3] = {
    {1691.0018, 1451.0864, 10.7659}, // LV
    {-1406.2073, -305.1451, 14.1484}, // SF
    {1685.1251, -2326.5479, 13.5469}, // LS
    {-792.5224, 496.9419, 1376.1875} // LC
};

enum PickupSpawnInfo {
    Float: PickupX,
    Float: PickupY,
    Float: PickupZ
};

new Float: gHealthPickups[2][PickupSpawnInfo] = {
    {2023.1903, 1304.9056, 10.8203},
    {2169.0876, 2116.3635, 10.8203}
};
new Float: gArmorPickups[3][PickupSpawnInfo] = {
    {2016.0073, 1104.0162, 10.8203},
    {1491.0803, 2773.4373, 15.9706},
    {2088.6541, 1450.2456, 10.8203}
};

enum ePlayerInfo {
    iPlayerTeam,
    iStatus
}

#if Feature::DisableFights == 0
new WWTW_PlayerData[MAX_PLAYERS][ePlayerInfo];
#endif

// -------------------------------------------------------------------------------------------------
// Temporary variable holding the killerId of a death in case we set the player's health to 0.
new validKillerId[MAX_PLAYERS];

// Temporary variable holding the reasonId of a death in case we set the player's health to 0.
new validReasonId[MAX_PLAYERS];
// -------------------------------------------------------------------------------------------------

new bPlayerWeaponStored[MAX_PLAYERS];
