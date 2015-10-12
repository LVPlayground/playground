// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define MAX_SAVE_SLOTS        200
#define MINUTES_TO_RECONNECT   10
#define INVALID_SAVE_INFO_SLOT -1

enum saveData {
    nameAdler,
    savedIpAddress[16],
    Float: positionX,
    Float: positionY,
    Float: positionZ,
    Float: angle,
    worldId,
    interiorId,
    Float: savedHealth,
    Float: savedArmour,
    savedWantedLevel,
    savedWeaponId[WeaponSlots],
    savedAmmo[WeaponSlots],
    bool: spawnWeapon[WeaponSlots],
    bool: spawnArmour,
    rampingEnabled,
    rampId,
    bool: respawn,
    disconnectionTime
};

new m_playerSaveInfo[MAX_SAVE_SLOTS][saveData];
new bool: m_loadPlayerData[MAX_PLAYERS];
new m_loadBeginTime[MAX_PLAYERS];

CSave__FindSlot(playerId = Player::InvalidId) {
    // Find an empty slot.
    if (playerId == Player::InvalidId) {
        for (new slotId = 0; slotId < MAX_SAVE_SLOTS; slotId++) {
            new savedTime = CSave__GetSavedTime(slotId);
            if (Time->currentTime() - savedTime > MINUTES_TO_RECONNECT * 60 || savedTime == 0)
               return slotId;
        }
        return INVALID_SAVE_INFO_SLOT;
    }

    if (Player(playerId)->isConnected() == false)
        return INVALID_SAVE_INFO_SLOT;

    // Search for the player's corresponding slot if they had any.
    new slotIdFound = -1, slotCount = 0;
    for (new slotId = 0; slotId < MAX_SAVE_SLOTS; slotId++) {
        new savedTime = CSave__GetSavedTime(slotId);
        if (Time->currentTime() - savedTime > MINUTES_TO_RECONNECT * 60 || savedTime == 0)
            continue;

        if (adler32(PlayerName(playerId)) != CSave__GetAdler32(slotId))
            continue;

        slotCount++;

        // Multiple slots detected for a player?
        if (slotCount > 1) {
            CSave__ClearSlot(slotId);
            continue;
        }

        // If the IPs match, save the slotId.
        if (strcmp(m_playerSaveInfo[slotId][savedIpAddress], Player(playerId)->ipAddressString()) != 0) {
            CSave__ClearSlot(slotId);
            continue;
        } else {
            slotIdFound = slotId;
            continue;
        }
    }

    // SlotId found? Return it.
    if (slotIdFound != -1) {
        m_loadPlayerData[playerId] = true;
        return slotIdFound;
    }

    return INVALID_SAVE_INFO_SLOT;
}

CSave__ClearSlot(slotId) {
    m_playerSaveInfo[slotId][nameAdler] = 0;
    format(m_playerSaveInfo[slotId][savedIpAddress], 16, "");
    m_playerSaveInfo[slotId][positionX] = 0.0;
    m_playerSaveInfo[slotId][positionY] = 0.0;
    m_playerSaveInfo[slotId][positionZ] = 0.0;
    m_playerSaveInfo[slotId][angle] = 0.0;
    m_playerSaveInfo[slotId][worldId] = 0;
    m_playerSaveInfo[slotId][interiorId] = 0;
    m_playerSaveInfo[slotId][savedHealth] = 0.0;
    m_playerSaveInfo[slotId][savedArmour] = 0.0;
    m_playerSaveInfo[slotId][savedWantedLevel] = 0;

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        m_playerSaveInfo[slotId][savedWeaponId][weaponSlot] = 0;
        m_playerSaveInfo[slotId][savedAmmo][weaponSlot] = 0;
        m_playerSaveInfo[slotId][spawnWeapon][weaponSlot] = false;
    }

    m_playerSaveInfo[slotId][spawnArmour] = false;
    m_playerSaveInfo[slotId][rampingEnabled] = 0;
    m_playerSaveInfo[slotId][rampId] = 0;
    m_playerSaveInfo[slotId][respawn] = false;
    m_playerSaveInfo[slotId][disconnectionTime] = 0;
}

CSave__SaveInfo(playerId) {
    if (Player(playerId)->isNonPlayerCharacter() == true)
        return 0;

    new slotId = CSave__FindSlot(Player::InvalidId);
    if (slotId == INVALID_SAVE_INFO_SLOT)
        return 0;

    format(m_playerSaveInfo[slotId][savedIpAddress], 16, "%s", Player(playerId)->ipAddressString());
    m_playerSaveInfo[slotId][nameAdler] = adler32(PlayerName(playerId));
    m_playerSaveInfo[slotId][disconnectionTime] = Time->currentTime();

    new Float: x, Float: y, Float: z, Float: playerAngle, Float: pHealth, Float: pArmour;
    GetPlayerPos(playerId, x, y, z);
    GetPlayerFacingAngle(playerId, playerAngle);
    GetPlayerHealth(playerId, pHealth);
    GetPlayerArmour(playerId, pArmour);

    if (SpawnWeaponManager(playerId)->spawnArmour() == true)
        m_playerSaveInfo[slotId][spawnArmour] = true;

    // Our priorities: save spawnweapons and spawnarmour, or anything else being holded by the player
    // at the moment of disconnecting.
    new weaponId, ammo;
    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        if (weaponSlot == 7)
            continue;

        if (SpawnWeaponManager(playerId)->spawnWeaponId(weaponSlot) != 0) {
            m_playerSaveInfo[slotId][spawnWeapon][weaponSlot] = true;
            m_playerSaveInfo[slotId][savedWeaponId][weaponSlot] = SpawnWeaponManager(playerId)->spawnWeaponId(weaponSlot);
            m_playerSaveInfo[slotId][savedAmmo][weaponSlot] = SpawnWeaponManager(playerId)->spawnWeaponAmmo(weaponSlot);
            continue;
        }

        GetPlayerWeaponData(playerId, weaponSlot, weaponId, ammo);
        if (weaponId == 0 || ammo == 0)
            continue;

        m_playerSaveInfo[slotId][spawnWeapon][weaponSlot] = false;
        m_playerSaveInfo[slotId][savedWeaponId][weaponSlot] = weaponId;
        m_playerSaveInfo[slotId][savedAmmo][weaponSlot] = ammo;
    }

    if (CRace__IsRacing(playerId)) {
        m_playerSaveInfo[slotId][positionX] = g_RacePlayerPos[playerId][0];
        m_playerSaveInfo[slotId][positionY] = g_RacePlayerPos[playerId][1];
        m_playerSaveInfo[slotId][positionZ] = g_RacePlayerPos[playerId][2];
        m_playerSaveInfo[slotId][angle] = playerAngle;
    } else if (IsPlayerInMapZone(playerId)) {
        m_playerSaveInfo[slotId][positionX] = g_PlayerPos[playerId][0];
        m_playerSaveInfo[slotId][positionY] = g_PlayerPos[playerId][1];
        m_playerSaveInfo[slotId][positionZ] = g_PlayerPos[playerId][2];
        m_playerSaveInfo[slotId][angle] = playerAngle;
    } else if(IsPlayerStatusMinigame(playerId)) {
        if (WWTW_PlayerData[playerId][iStatus] == WWTW_STATE_PLAYING || CRobbery__GetPlayerStatus(playerId) > ROBSTATUS_NONE) {
            m_playerSaveInfo[slotId][positionX] = g_aSavedPlayerPosition[playerId][fSavedPosX];
            m_playerSaveInfo[slotId][positionY] = g_aSavedPlayerPosition[playerId][fSavedPosY];
            m_playerSaveInfo[slotId][positionZ] = g_aSavedPlayerPosition[playerId][fSavedPosZ];
            m_playerSaveInfo[slotId][angle] = g_aSavedPlayerPosition[playerId][fSavedAngle];
        } else {
            m_playerSaveInfo[slotId][positionX] = PlayerInfo[playerId][BackPos][0];
            m_playerSaveInfo[slotId][positionX] = PlayerInfo[playerId][BackPos][1];
            m_playerSaveInfo[slotId][positionZ] = PlayerInfo[playerId][BackPos][2];
            m_playerSaveInfo[slotId][angle] = playerAngle;
        }
    } else if (IsPlayerInMinigame(playerId) && !IsPlayerStatusMinigame(playerId))
        m_playerSaveInfo[slotId][respawn] = true;
    else {
        m_playerSaveInfo[slotId][positionX] = x;
        m_playerSaveInfo[slotId][positionY] = y;
        m_playerSaveInfo[slotId][positionZ] = z;
        m_playerSaveInfo[slotId][angle] = playerAngle;
    }

    m_playerSaveInfo[slotId][interiorId] = GetPlayerInterior(playerId);
    m_playerSaveInfo[slotId][worldId] = g_VirtualWorld[playerId];
    m_playerSaveInfo[slotId][rampingEnabled] = ramping[playerId];
    m_playerSaveInfo[slotId][savedWantedLevel] = WantedLevel[playerId];
    m_playerSaveInfo[slotId][savedHealth] = pHealth;
    m_playerSaveInfo[slotId][savedArmour] = pArmour;

    if (ramping[playerId])
        m_playerSaveInfo[slotId][rampId] = playerramptypes[playerId];

    return 1;
}

// Retrieve time of slot creation.
CSave__GetSavedTime(slotId) {
    return m_playerSaveInfo[slotId][disconnectionTime];
}

// Retrieve adler32 of player name corresponding to a certain slot.
CSave__GetAdler32(slotId) {
    return m_playerSaveInfo[slotId][nameAdler];
}

// Show the 'loading data' textdraw and freeze the player.
CSave__BeginLoad(playerId) {
    if (Player(playerId)->isNonPlayerCharacter() == true)
        return 0;

    if (CSave__FindSlot(playerId) == INVALID_SAVE_INFO_SLOT)
        return 0;

    if (m_loadPlayerData[playerId] == false)
        return 0;

    m_loadBeginTime[playerId] = Time->currentTime();
    GameTextForPlayer(playerId, "~r~Please wait...~n~~n~~n~~w~Loading Data :)", 4000, 3);

    return 1;
}

// Timer check to see if the player's data should be loaded yet.
CSave__Process(playerId) {
    if (m_loadBeginTime[playerId] == 0)
        return 0;

    if (Time->currentTime() - m_loadBeginTime[playerId] > 3) {
        PlayerState(playerId)->updateState(SaveLoadingPlayerState);
        CSave__LoadInfo(playerId);
        m_loadBeginTime[playerId] = 0;
    }

    return 1;
}

// Load the player's data.
CSave__LoadInfo(playerId) {
    ResetPlayerWeapons(playerId);
    SetCameraBehindPlayer(playerId);
    g_PlayerMenu[playerId] = 0;

    // Find the slot and restore the player's data.
    new slotId = CSave__FindSlot(playerId);
    if (m_playerSaveInfo[slotId][respawn] == false) {
        SetPlayerPos(playerId, m_playerSaveInfo[slotId][positionX], m_playerSaveInfo[slotId][positionY],
            m_playerSaveInfo[slotId][positionZ]);
        SetPlayerFacingAngle(playerId, m_playerSaveInfo[slotId][angle]);
    }

    SetPlayerInterior(playerId, m_playerSaveInfo[slotId][interiorId]);
    g_VirtualWorld[playerId] = m_playerSaveInfo[slotId][worldId];
    SetPlayerVirtualWorld(playerId, g_VirtualWorld[playerId]);

    ramping[playerId] = m_playerSaveInfo[slotId][rampingEnabled];
    playerramptypes[playerId] = m_playerSaveInfo[slotId][rampId];
    WantedLevel[playerId] = m_playerSaveInfo[slotId][savedWantedLevel];
    SetPlayerWantedLevel(playerId, GetWantedLevel(playerId, WantedLevel[playerId]));

    SetPlayerHealth(playerId, m_playerSaveInfo[slotId][savedHealth]);
    SetPlayerArmour(playerId, m_playerSaveInfo[slotId][savedArmour]);

    if (m_playerSaveInfo[slotId][spawnArmour] == true)
        SpawnWeaponManager(playerId)->giveSpawnArmour();

    // Give out the standard weapons to make sure a player doesn't join the game unarmed. If any
    // (spawn)weapon was set, the weapon will be overridden.
    GiveWeapon(playerId, 24, 150);
    GiveWeapon(playerId, 26, 200);
    GiveWeapon(playerId, 28, 600);
    GiveWeapon(playerId, 41, 2000);

    for (new weaponSlot = 0; weaponSlot < WeaponSlots; weaponSlot++) {
        if (m_playerSaveInfo[slotId][savedWeaponId][weaponSlot] == 0)
            continue;

        if (m_playerSaveInfo[slotId][spawnWeapon][weaponSlot] == true)
            SpawnWeaponManager(playerId)->giveSpawnWeapon(
                m_playerSaveInfo[slotId][savedWeaponId][weaponSlot],
                m_playerSaveInfo[slotId][savedAmmo][weaponSlot]);
        else
            GiveWeapon(playerId, m_playerSaveInfo[slotId][savedWeaponId][weaponSlot],
                m_playerSaveInfo[slotId][savedAmmo][weaponSlot]);
    }

    m_playerSaveInfo[slotId][nameAdler] = 0;
    format(m_playerSaveInfo[slotId][savedIpAddress], 16, "");
    m_playerSaveInfo[slotId][disconnectionTime] = 0;

    m_loadPlayerData[playerId] = false;
    TogglePlayerControllable(playerId, true);

    SendClientMessage(playerId, Color::HighlightBlue, "Welcome back! You reconnected within 10 minutes meaning your player data has been restored!");
    PlayerState(playerId)->releaseState();
    CSave__ClearSlot(slotId); 

    return 1;
}

// On player disconnection we save their data.
CSave__OnPlayerDisconnect(playerId, reason) {
    if (Player(playerId)->isLoggedIn() == true && Player(playerId)->isRegistered() == true)
        CSave__SaveInfo(playerId);

    return 1;
    #pragma unused reason
}

// Check if we need to load the player's data on spawn.
CSave__OnPlayerSpawn(playerId) {
    if (m_loadPlayerData[playerId] == false)
        return 0;

    TogglePlayerControllable(playerId, false);

    return 1;
}
