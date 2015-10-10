// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The AmmunationWeapon class keeps track of each gun available in the Ammunation shops.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
class AmmunationWeapon <weaponId (AmmunationManager::MaximumWeapons)> {
    // How is this weapon called?
    new m_weaponName[20];

    // How many ammunitions does this weapon have?
    new m_ammunition;

    // Is this weapon available as a spawn-weapon to players?
    new bool: m_isAvailableAsSpawnWeapon;

    // Is this a melee weapon?
    new bool: m_isMeleeWeapon;

    // What's the weapon's base price?
    new m_basePrice;

    /**
     * Assign weapon name, Id, ammunition and base price to this class instance.
     *
     * @param weaponNode JSON node to the Ammunation weapon details array.
     */
    public addWeapon(Node: weaponNode) {
        // Name
        new Node: weaponNameNode = JSON->find(weaponNode, "name");
        if (weaponNameNode == JSON::InvalidNode || JSON->getType(weaponNameNode) != JSONString)
            return;

        JSON->readString(weaponNameNode, m_weaponName, sizeof(m_weaponName));

        // Ammunitions
        new Node: weaponAmmunitionsNode = JSON->find(weaponNode, "ammunitions");
        if (weaponAmmunitionsNode == JSON::InvalidNode || JSON->getType(weaponAmmunitionsNode) != JSONInteger)
            return;

        JSON->readInteger(weaponAmmunitionsNode, m_ammunition);

        // Spawn-weapon availability
        new Node: weaponIsSpawnWeapon = JSON->find(weaponNode, "is_spawn_weapon");
        if (weaponIsSpawnWeapon == JSON::InvalidNode || JSON->getType(weaponIsSpawnWeapon) != JSONBoolean)
            return;

        JSON->readBoolean(weaponIsSpawnWeapon, m_isAvailableAsSpawnWeapon);

        // Is this a melee weapon?
        new Node: weaponIsMelee = JSON->find(weaponNode, "is_melee");
        if (weaponIsMelee == JSON::InvalidNode || JSON->getType(weaponIsMelee) != JSONBoolean)
            return;

        JSON->readBoolean(weaponIsMelee, m_isMeleeWeapon);

        // Base price
        new Node: weaponBasePrice = JSON->find(weaponNode, "base_price");
        if (weaponBasePrice == JSON::InvalidNode || JSON->getType(weaponBasePrice) != JSONInteger)
            return;

        JSON->readInteger(weaponBasePrice, m_basePrice);
    }

    /**
     * Format the given string with the weapon name.
     *
     * @param weaponName String to format.
     * @param weaponNameSize String size.
     */
    public getName(weaponName[], weaponNameSize) {
        format(weaponName, weaponNameSize, "%s", m_weaponName);
    }

    /**
     * Fetch the base ammunition amount of the weapon.
     *
     * @return integer Base ammunition amount.
     */
    public inline ammunition() {
        return (m_ammunition);
    }

    /**
     * Fetches the base price of the weapon.
     *
     * @return integer Base price of the weapon.
     */
    public inline basePrice() {
        return (m_basePrice);
    }

    /**
     * Checks whether the weapon is available as a spawn-weapon in Ammunations.
     *
     * @return boolean Is this weapon available as a spawn-weapon?
     */
    public inline bool: isAvailableAsSpawnWeapon() {
        return (m_isAvailableAsSpawnWeapon);
    }

    /**
     * Checks whether the weapon is a melee weapon or not.
     *
     * @return boolean Is this a melee weapon?
     */
    public inline bool: isMeleeWeapon() {
        return (m_isMeleeWeapon);
    }
}
