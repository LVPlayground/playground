// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The spawn weapon manager handles a special kind of weapon, single session weapons (commonly
 * referred to as spawn weapons), of every player connected to Las Venturas Playground.
 *
 * These weapons, unlike regular ones, are given back to the player upon spawn, for the whole
 * lenght of his session.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class SpawnWeaponManager <playerId (MAX_PLAYERS)> {
    // To store the spawn weapon information of each player throughout the whole session, we store
    // the Id of 13 weapons (the maximum number of weapons a player can carry at a time).
    new m_spawnWeaponId[WeaponSlots];

    // To store the spawn weapon information of each player throughout the whole session, we store
    // the ammunition multiplier of 13 weapons.
    new m_spawnWeaponAmmo[WeaponSlots];

    // Does the player have spawn armour too?
    new bool: m_spawnArmour;

    /**
     * Upon spawn, give each player his set of spawn weapons/armour. Also give default spawn
     * weapons to anyone, for free.
     */
    @list(OnPlayerSpawn)
    public onPlayerSpawn() {
        GiveWeapon(playerId, 24, 150); // Desert Eagle
        GiveWeapon(playerId, 26, 200); // Sawnoff Shotgun
        GiveWeapon(playerId, 28, 600); // Micro Uzi
        GiveWeapon(playerId, 41, 2000); // Spraycan

        new weaponId;
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            weaponId = m_spawnWeaponId[weaponSlot];
            GiveWeapon(playerId, weaponId, AmmunationWeapon(weaponId)->ammunition()
                * m_spawnWeaponAmmo[weaponSlot]);
        }

        if (m_spawnArmour)
            SetPlayerArmour(playerId, 100);
    }

    /**
     * Reset all the values related to spawn weapons to their default value. This will be called 
     * when a player joins the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect() {
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            m_spawnWeaponId[weaponSlot] = 0;
            m_spawnWeaponAmmo[weaponSlot] = 0;
        }

        m_spawnArmour = false;
    }

    /**
     * Retrieve the spawn weapon Id of a certain weapon in a desired slot.
     *
     * @param playerId Id of the player we are getting the m_spawnWeaponId for.
     * @param weaponSlot Number of the weapon slot we are retrieving the weapon Id from.
     * @return Integer 0 or the weapon Id specified for the spawn weapon in the requested slot.
     */
    public inline spawnWeaponId(weaponSlot) {
        return (m_spawnWeaponId[weaponSlot]);
    }

    /**
     * Retrieve the spawn weapon ammunition amount of a certain weapon in a desired slot.
     *
     * @param playerId Id of the player we are getting the m_spawnWeaponAmmo for.
     * @param weaponSlot Number of the weapon slot we are retrieving the ammunition amount from.
     * @return Integer 0 or the ammunition specified for the spawn weapon in the requested slot.
     */
    public inline spawnWeaponAmmo(weaponSlot) {
        return (m_spawnWeaponAmmo[weaponSlot]);
    }

    /**
     * Retrieve the player's current spawn armour setting.
     *
     * @param playerId Id of the player we are getting the m_spawnArmour for.
     * @return Boolean Does the player have spawn armour set?
     */
    public inline bool: spawnArmour() {
        return (m_spawnArmour);
    }

    /**
     * Give the player the specified spawn weapon. If he's already got a spawn weapon
     * in the same slot, add the ammunition and update the weapon Id in case it is
     * different.
     * 
     * @param weaponId Id of the weapon we give to the player.
     * @param ammunitionMultiplier How many rounds should be given along with the weapon?
     */
    public giveSpawnWeapon(weaponId, ammunitionMultiplier) {
        new weaponSlot = WeaponUtilities->getWeaponSlot(weaponId);
        m_spawnWeaponId[weaponSlot] = weaponId;
        m_spawnWeaponAmmo[weaponSlot] += ammunitionMultiplier;

        GiveWeapon(playerId, weaponId, AmmunationWeapon(weaponId)->ammunition() * ammunitionMultiplier);
    }

    /**
     * Check if the player has a certain spawn weapon, and if so, remove it from his set.
     * 
     * @param weaponId GTA Id of the weapon to reset.
     * @return boolean Has the spawn weapon been successfully removed?
     */
    public bool: removeSpawnWeapon(weaponId) {
        new weaponSlot = WeaponUtilities->getWeaponSlot(weaponId);
        if (m_spawnWeaponId[weaponSlot] != weaponId)
            return false;

        RemovePlayerWeapon(playerId, weaponId);
        m_spawnWeaponId[weaponSlot] = 0;
        m_spawnWeaponAmmo[weaponSlot] = 0;
        return true;
    }

    /**
     * Check if the player already has spawn armour, and if not, give him.
     *
     * @return boolean Has the spawn armour been successfully set?
     */
    public giveSpawnArmour() {
        if (m_spawnArmour)
            return false;

        m_spawnArmour = true;
        SetPlayerArmour(playerId, 100.0);
        return true;
    }

    /**
     * Check if the player has spawn armour, and if so, remove it.
     *
     * @return boolean Has the spawn armour been successfully removed?
     */
    public removeSpawnArmour() {
        if (!m_spawnArmour)
            return false;

        m_spawnArmour = false;
        return true;
    }

    /**
     * Serializes the player's current weapon inventory to the data set.
     *
     * @param playerId Id of the player whose data is being serialized.
     * @param serializationId Id of the serialization slot to which we'll be writing data.
     * @param level Level of serialization being applied to this player.
     */
    @list(OnSerializePlayer)
    public onSerializePlayer(serializationId, SerializationLevel: level) {
        if (!(level & WeaponSerialization))
            return; // we handle weapon data for the serialization.

        new weaponId, weaponIdField[16], ammunition, ammunitionField[16];
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            GetPlayerWeaponData(playerId, weaponSlot, weaponId, ammunition);

            format(weaponIdField, sizeof(weaponIdField), "weapon_%d_id", weaponSlot);
            format(ammunitionField, sizeof(ammunitionField), "weapon_%d_ammo", weaponSlot);

            SerializationData(serializationId)->writeInteger(weaponIdField, weaponId);
            SerializationData(serializationId)->writeInteger(ammunitionField, ammunition);
        }

        SerializationData(serializationId)->writeInteger("weapon_armed", GetPlayerWeapon(playerId));
    }

    /**
     * Restores the weapon inventory which was serialized in the data set for this player.
     *
     * @param playerId Id of the player whose data is being restored.
     * @param serializationId Id of the serialization slot which contains their data.
     * @param level Level of serialization which has been applied.
     */
    @list(OnRestorePlayer)
    public onRestorePlayer(serializationId, SerializationLevel: level) {
        if (!(level & WeaponSerialization))
            return; // we handle weapon data for the serialization.

        ResetPlayerWeapons(playerId);

        new weaponIdField[16], ammunitionField[16];
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            format(weaponIdField, sizeof(weaponIdField), "weapon_%d_id", weaponSlot);
            format(ammunitionField, sizeof(ammunitionField), "weapon_%d_ammo", weaponSlot);

            GiveWeapon(playerId,
                SerializationData(serializationId)->readInteger(weaponIdField),
                SerializationData(serializationId)->readInteger(ammunitionField));
        }

        SetPlayerArmedWeapon(playerId, SerializationData(serializationId)->readInteger("weapon_armed"));
    }
};
