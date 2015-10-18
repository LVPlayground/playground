// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Ammunation class handles every Ammunation shop in San Andreas and their details.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
class Ammunation <shopId (AmmunationManager::MaximumAmmunationShops)> {
    // Which pickup handler Id should be used for ammunation shops?
    public const AmmunationPickupHandlerId = @counter(PickupHandler);

    // Uninitialized ammunation Ids have no pickup and we need a constant to identify them, as
    // pickups are zero-based which could cause false positives.
    const InvalidPickupId = -1;

    // What is this shop called?
    new m_shopName[64];

    // Where's the actual shop location?
    new Float: m_shopLocation[3],
        Float: m_shopLocationRotation,
        m_shopLocationInteriorId;

    // Where's the spawn-weapon pickup located in the Ammunation shop interior?
    new Float: m_pickupLocation[3];

    // Ammunation weapon pickup Id.
    new m_pickupId;

    // What's the price modifier of this shop? This is based on proximity to large urban areas.
    new Float: m_priceModifier;

    // Base price of full armour in this shop.
    new m_armourPrice;

    // Which weapons (expressed in GTA weapon Ids) are available in this Ammunation?
    new m_availableWeapon[AmmunationManager::MaximumWeaponsPerAmmunation];

    // How many regular weapons are available in this Ammunation shop?
    new m_availableWeaponCount;

    // How many spawn-weapons are available in this Ammunation shop?
    new m_availableSpawnWeaponCount;

    /**
     * Before ammunations have been created per the JSON file, we need to be sure that their pickup
     * Id gets set to the invalid ID constant. Otherwise, other pickups (with Id 0) could be seen
     * as ammunations, triggering this dialog.
     */
    public __construct() {
        m_pickupId = InvalidPickupId;
    }

    /**
     * Fetch the Ammunation shop details on the shop name, the entrance, the actual location, 
     * the price modifier, the available weapons and the guards from the given JSON node, and
     * then set them if they're valid.
     *
     * Also, create the Ammunation skull pickup which, when walked through, displays the 
     * weapon dialog to let players buy their (spawn-)weapons.
     *
     * @param ammunationShop JSON node to the Ammunation shop object.
     */
    public addShop(Node: ammunationShop) {
        // Ammunation shop's name
        new Node: ammunationNameNode = JSON->find(ammunationShop, "name");
        if (ammunationNameNode == JSON::InvalidNode || JSON->getType(ammunationNameNode) != JSONString)
            return;

        JSON->readString(ammunationNameNode, m_shopName, sizeof(m_shopName));

        // Ammunation shop's location coordinates
        new Node: ammunationLocationNode = JSON->find(ammunationShop, "location"),
            Node: ammunationLocationSetting = JSON->firstChild(ammunationLocationNode);

        JSON->readFloat(ammunationLocationSetting, m_shopLocation[0]); // Coordinate X
        ammunationLocationSetting = JSON->next(ammunationLocationSetting);

        JSON->readFloat(ammunationLocationSetting, m_shopLocation[1]); // Coordinate Y
        ammunationLocationSetting = JSON->next(ammunationLocationSetting);

        JSON->readFloat(ammunationLocationSetting, m_shopLocation[2]); // Coordinate Z
        ammunationLocationSetting = JSON->next(ammunationLocationSetting);

        JSON->readFloat(ammunationLocationSetting, m_shopLocationRotation); // Rotation
        ammunationLocationSetting = JSON->next(ammunationLocationSetting);

        JSON->readInteger(ammunationLocationSetting, m_shopLocationInteriorId); // Interior ID
        if (ammunationLocationSetting == JSON::InvalidNode || JSON->getType(ammunationLocationSetting) != JSONInteger)
            return;

        // Spawn-weapon pickup location coordinates
        new Node: ammunationSpawnWeaponPickupLocationNode = JSON->find(ammunationShop, "spawnweapon_pickup_location"),
            Node: ammunationSpawnWeaponPickupLocationSetting = JSON->firstChild(ammunationSpawnWeaponPickupLocationNode);

        JSON->readFloat(ammunationSpawnWeaponPickupLocationSetting, m_pickupLocation[0]); // Coordinate X
        ammunationSpawnWeaponPickupLocationSetting = JSON->next(ammunationSpawnWeaponPickupLocationSetting);

        JSON->readFloat(ammunationSpawnWeaponPickupLocationSetting, m_pickupLocation[1]); // Coordinate Y
        ammunationSpawnWeaponPickupLocationSetting = JSON->next(ammunationSpawnWeaponPickupLocationSetting);

        JSON->readFloat(ammunationSpawnWeaponPickupLocationSetting, m_pickupLocation[2]); // Coordinate Z
        if (ammunationSpawnWeaponPickupLocationSetting == JSON::InvalidNode || JSON->getType(ammunationSpawnWeaponPickupLocationSetting) != JSONFloat)
            return;

        // Price modifier
        new Node: ammunationPriceModifierNode = JSON->find(ammunationShop, "price_modifier");
        if (ammunationPriceModifierNode == JSON::InvalidNode || JSON->getType(ammunationPriceModifierNode) != JSONFloat)
            return;

        JSON->readFloat(ammunationPriceModifierNode, m_priceModifier);

        // Weapons
        new Node: ammunationWeaponsNode = JSON->find(ammunationShop, "weapons");

        m_availableWeaponCount = 0;
        m_availableSpawnWeaponCount = 0;
        new gtaWeaponId;
        for (new Node: currentWeapon = JSON->firstChild(ammunationWeaponsNode); currentWeapon != JSON::InvalidNode; currentWeapon = JSON->next(currentWeapon)) {
            if (m_availableWeaponCount >= AmmunationManager::MaximumWeaponsPerAmmunation)
                break;

            JSON->readInteger(currentWeapon, m_availableWeapon[m_availableWeaponCount]);
            gtaWeaponId = m_availableWeapon[m_availableWeaponCount];

            if (AmmunationWeapon(gtaWeaponId)->isAvailableAsSpawnWeapon())
                ++m_availableSpawnWeaponCount;

            ++m_availableWeaponCount;
        }

        // Armour base price
        new Node: ammunationArmourPriceNode = JSON->find(ammunationShop, "armour_price");
        if (ammunationArmourPriceNode == JSON::InvalidNode || JSON->getType(ammunationArmourPriceNode) != JSONInteger)
            return;

        JSON->readInteger(ammunationArmourPriceNode, m_armourPrice);

        /// @todo(Kase): Implement guards.

        PickupController->createPickup(Ammunation::AmmunationPickupHandlerId, AmmunationSkullPickupId,
            PersistentPickupType, m_pickupLocation[0], m_pickupLocation[1], m_pickupLocation[2], -1, shopId);
    }

    /** 
     * Retrieve a list of available spawn weapons in this Ammunation shop and fills in an array.
     * 
     * @param weapons Array we're filling. 
     * @param sizeofWeapons Size of the array we're filling. 
     * @return integer Available weapon count. 
     */ 
    public getAvailableSpawnWeaponList(weapons[], sizeofWeapons) { 
        new count = 0, availableWeapon;
        for (new weaponIndex; weaponIndex < sizeofWeapons; ++weaponIndex) {
            if (weaponIndex >= AmmunationManager::MaximumWeaponsPerAmmunation) 
                break;

            availableWeapon = m_availableWeapon[weaponIndex];
            if (!availableWeapon || !AmmunationWeapon(availableWeapon)->isAvailableAsSpawnWeapon())
                continue;

            weapons[count] = m_availableWeapon[weaponIndex];
            ++count; 
        } 

        return count;
    }

    /**
     * Picking up the Ammunation skull pickup calls an AmmunationDialog method which shows the player
     * a dialog; it is the first step of the weapon buying process.
     *
     * If the player is already through the weapon buying process (thus most likely standing still near
     * the Ammunation skull pickup) he shouldn't trigger any dialog.
     *
     * @param playerId Player Id we're showing the dialog to.
     * @param pickupId Ammunation skull pickup Id.
     * @param ammunationId The ammunation to which this pickup belongs.
     */
    @switch(OnPlayerEnterPickup, Ammunation::AmmunationPickupHandlerId)
    public static onPlayerPickUpAmmunationPickup(playerId, pickupId, ammunationId) {
        if (AmmunationDialog->shouldDialogBeOpenedForPlayer(playerId) == false)
            return 0;

        AmmunationDialog->showWeaponTypeSelectionDialogToPlayer(playerId, ammunationId);
        return 1;

        #pragma unused pickupId
    }

    /// @todo(Russell): Fix the PreCompiler so the following methods can be defined as inline.

    /**
     * Retrieve the number of regular weapons available in this Ammunation.
     *
     * @return integer Available regular weapon count.
     */
    public availableWeaponCount() {
        return (m_availableWeaponCount);
    }

    /**
     * Retrieve the number of spawn-weapons available in this Ammunation.
     *
     * @return integer Available spawn-weapon count.
     */
    public availableSpawnWeaponCount() {
        return (m_availableSpawnWeaponCount);
    }

    /**
     * Retrieve the GTA Id of a weapon available in this Ammunation shop.
     *
     * @param weaponIndex Index of the array of available weapons.
     * @return integer GTA Id of the weapon.
     */
    public availableWeapon(weaponIndex) {
        return (m_availableWeapon[weaponIndex]);
    }

    /**
     * Retrieves the base price of the armour.
     *
     * @return integer Armour base price.
     */
    public armourPrice() {
        return (m_armourPrice);
    }
}
