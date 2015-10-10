// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * To catch aimbot users, we provide a simple key combination which will trigger a sync function.
 * During a fight where the admin has it's thoughts about the other player's aim, he/she can simply
 * use the key combination to sync theirself. This will result in the aimbot user to turn 90 degrees,
 * because of the aimbot sync getting overrun.
 *
 * The function is based on the respawn element of the syncing player, which throws the user's aimbot
 * off guard. Because we're respawning our player, we save and reset some variables.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class PlayerSyncHandler {
    // Save the player's cash.
    new m_playerCash[MAX_PLAYERS];

    // Save the player's health.
    new Float: m_playerHealth[MAX_PLAYERS];

    // Save the player's armour.
    new Float: m_playerArmour[MAX_PLAYERS];

    // Save the player's position and facing angle.
    new Float: m_playerPosition[MAX_PLAYERS][4];

    // Save the player's interior.
    new m_playerInterior[MAX_PLAYERS];

    // Save the player's world.
    new m_playerWorld[MAX_PLAYERS];

    // We store the weapon Id of each weapon.
    new m_playerWeaponId[WeaponSlots][MAX_PLAYERS];

    // We store the ammo amount of each weapon.
    new m_playerWeaponAmmo[WeaponSlots][MAX_PLAYERS];

    // Track if the player's variables needs to be set on spawn.
    new bool: m_resetPlayerVariables[MAX_PLAYERS];

    /**
     * The key combination has been triggered, time to sync our player. What we do is basically saving
     * all the player's variables corresponding money, location and holding weapons, and force him
     * to respawn.
     *
     * To trigger this function, a key combo of RMB + LSHIFT needs to be done.
     *
     * @param playerId Id of the syncing player.
     */
    public syncPlayer(playerId) {
        ClearAnimations(playerId);

        // By setting this to true, we can override the default spawn functions.
        m_resetPlayerVariables[playerId] = true;

        // Save the player's cash.
        m_playerCash[playerId] = GetPlayerMoney(playerId);

        // Save the player's location.
        GetPlayerPos(playerId, m_playerPosition[playerId][0], m_playerPosition[playerId][1],
            m_playerPosition[playerId][2]);
        GetPlayerFacingAngle(playerId, m_playerPosition[playerId][3]);
        m_playerInterior[playerId] = GetPlayerInterior(playerId);
        m_playerWorld[playerId] = GetPlayerVirtualWorld(playerId);

        // Save the player's health and armour.
        GetPlayerHealth(playerId, m_playerHealth[playerId]);
        GetPlayerArmour(playerId, m_playerArmour[playerId]);

        // Save the player's holding weapons.
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot)
            GetPlayerWeaponData(playerId, weaponSlot, m_playerWeaponId[weaponSlot][playerId],
                m_playerWeaponAmmo[weaponSlot][playerId]);

        // Set the player's spawninfo and respawn him. We use SetSpawnInfo here because if we wouldn't,
        // the player would first get teleported to a random spawn location before he is transported
        // back to the current one.
        SetSpawnInfo(playerId, 0, GetPlayerSkin(playerId), m_playerPosition[playerId][0], m_playerPosition[playerId][1],
            m_playerPosition[playerId][2] - 0.5, m_playerPosition[playerId][3], 0, 0, 0, 0, 0, 0);

        SpawnPlayer(playerId);

        return 1;
    }

    /**
     * Upon spawning, we reset all the saved variables if needed.
     *
     * @param playerId Id of the spawning player.
     */
    @list(OnPlayerSpawn)
    public onPlayerSpawn(playerId) {
        if (m_resetPlayerVariables[playerId] == false)
            return 0;

        // Reset the player's money, since this is lost on respawn.
        ResetPlayerMoney(playerId);
        GivePlayerMoney(playerId, m_playerCash[playerId]);

        // Reset the player's health and armour.
        SetPlayerHealth(playerId, m_playerHealth[playerId]);
        SetPlayerArmour(playerId, m_playerArmour[playerId]);

        // Set the correct position and interior on respawn.
        SetPlayerVirtualWorld(playerId, m_playerWorld[playerId]);
        SetPlayerInterior(playerId, m_playerInterior[playerId]);

        // Finally, reset the player's carrying weapons.
        ResetPlayerWeapons(playerId);
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            if (m_playerWeaponId[weaponSlot][playerId] == 0 || m_playerWeaponAmmo[weaponSlot][playerId] == 0)
                continue;

            GiveWeapon(playerId, m_playerWeaponId[weaponSlot][playerId], m_playerWeaponAmmo[weaponSlot][playerId]);
        }

        SetPlayerArmedWeapon(playerId, 0);

        return 1;
    }

    /**
     * Be sure to empty the variable used to reset settings when a new player connect.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_resetPlayerVariables[playerId] = false;

        return 1;
    }

    /**
     * Use this check in the default spawning functions to override those if needed.
     *
     * @param playerId Id of the player to check the syncing situation for.
     * @return boolean Is the player currently syncing?
     */
    public inline bool: isSyncing(playerId) {
        return (m_resetPlayerVariables[playerId]);
    }

    /**
     * We allow the reset variables boolean to be set remotely in the default spawning functions.
     *
     * @param playerId Id of the player to set the syncing mode for.
     * @param enabled Boolean to check if the player is syncing or not.
     * @return boolean Whether the player is currently sync-spawning or not.
     */
    public setIsSyncing(playerId, bool: enabled) {
        m_resetPlayerVariables[playerId] = enabled;
    }
};
