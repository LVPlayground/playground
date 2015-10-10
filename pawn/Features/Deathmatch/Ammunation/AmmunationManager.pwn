// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * There are two different types of weapons available in Ammunation shops all around San Andreas:
 * regular weapons (single life weapons) and spawn-weapons (single session weapons). Regular weapons 
 * are lost upon death, while spawn-weapons are given back to the player everytime he spawns, for 
 * the whole lenght of his gaming session.
 */
enum WeaponPersistenceType {
    SingleLifeWeapon,
    SingleSessionWeapon
};

/**
 * The AmmunationManager's main purpose is to initialize Ammunation shops, guards and available 
 * weapons in shops. All of these informations are stored in a JSON file.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
class AmmunationManager {
    // Each weapon's got a base price, which should be multiplied if the player is requesting
    // a single session weapon instead of a regular single life weapon.
    public const PriceMultiplier = 5;

    // What's the maximum amount of Ammunation shops?
    public const MaximumAmmunationShops = 10;

    // How many weapons have to be handled?
    public const MaximumWeapons = 47;

    // How many weapons can a single Ammunation hold?
    public const MaximumWeaponsPerAmmunation = 20;

    // File which contains Ammunation data.
    const AmmunationDataFile = "data/ammunation.json";

    // How many Ammunation stores have been registered with the gamemode?
    new m_ammunationStoreCount = 0;

    // How many Ammunation weapons have been registered with the gamemode?
    new m_ammunationWeaponCount = 0;

    /**
     * The AmmunationManager constructor will initialize Ammunation weapons and shops. Both of
     * them are stored in a JSON file for convenience. The purpose of the weapon list is to
     * define weapon names, GTA weapon Ids, ammunitions, whether they're available as spawn-weapons 
     * or not, and *base* price of each weapon available in Ammunation shops.
     *
     * Weapon data format example:
     *
     * "weapons": [
     *     {
     *         "gta_id": 14,
     *         "name": "Flowers",
     *         "ammunitions": 1,
     *         "is_spawn_weapon": true,
     *         "is_melee": true,
     *         "base_price": 800
     *     }
     * ]
     *
     * The purpose of the Ammunation list is to store single shop details: shop name, actual location 
     * position (X, Y, Z, rotation, interior ID); spawnweapons pickup location, which is used to show the
     * spawnweapon menu to any player walking through it; price modifier, which is set based on proximity 
     * of big cities, and multiplies the base weapon prices; guard details, including guard name, 
     * NPC script, Id of their skin, ID of the weapon they're holding, location (X, Y, Z, rotation, 
     * interior Id); GTA Id of the weapons available in this shop; base price of the armour.
     *
     * Store data format example:
     * 
     * "stores": [
     *     {
     *         "name": "Las Venturas Ammunation",
     *         "location": [90.0, 80.0, 70.0, 90, 15],
     *         "spawnweapon_pickup_location": [18.0, 23.0, 16.5],
     *         "price_modifier": 1.4,
     *         "guards": [
     *             [ "Gustav", "ammunation_gustav", 121, 31, 12.0, 22.0, 30.0, 1 ],
     *             [ "Anton", "ammunation_anton", 121, 31, 8.0, 18.0, 30.0, 1 ],
     *         ],
     *         "weapons": [6, 14, 27],
     *         "armour_price": 900
     *     }
     * ]
     */
    public __construct() {
        new Node: ammunationRootNode = JSON->parse(AmmunationDataFile);
        if (ammunationRootNode == JSON::InvalidNode || JSON->getType(ammunationRootNode) != JSONObject) {
            printf("[AmmunationController] ERROR: Unable to read the Ammunation data.");
            return;
        }

        new Node: ammunationWeaponList = JSON->find(ammunationRootNode, "weapons"),
            Node: ammunationStoreList = JSON->find(ammunationRootNode, "stores");

        if (ammunationWeaponList == JSON::InvalidNode || JSON->getType(ammunationWeaponList) != JSONArray) {
            printf("[AmmunationController] ERROR: Unable to read the Ammunation weapon list.");
            return;
        }

        if (ammunationStoreList == JSON::InvalidNode || JSON->getType(ammunationStoreList) != JSONArray) {
            printf("[AmmunationController] ERROR: Unable to read the Ammunation store list.");
            return;
        }

        m_ammunationWeaponCount = 0;
        new gtaWeaponId, Node: gtaWeaponIdNode;
        for (new Node: currentAmmunationWeapon = JSON->firstChild(ammunationWeaponList); currentAmmunationWeapon != JSON::InvalidNode; currentAmmunationWeapon = JSON->next(currentAmmunationWeapon)) {
            if (m_ammunationWeaponCount >= AmmunationManager::MaximumWeapons)
                break;

            gtaWeaponIdNode = JSON->find(currentAmmunationWeapon, "gta_id");
            if (gtaWeaponIdNode == JSON::InvalidNode || JSON->getType(gtaWeaponIdNode) != JSONInteger)
                continue;

            JSON->readInteger(gtaWeaponIdNode, gtaWeaponId);

            AmmunationWeapon(gtaWeaponId)->addWeapon(currentAmmunationWeapon);

            ++m_ammunationWeaponCount;
        }

        m_ammunationStoreCount = 0;
        for (new Node: currentAmmunationStore = JSON->firstChild(ammunationStoreList); currentAmmunationStore != JSON::InvalidNode; currentAmmunationStore = JSON->next(currentAmmunationStore)) {
            if (m_ammunationStoreCount >= AmmunationManager::MaximumAmmunationShops)
                break;

            Ammunation(m_ammunationStoreCount++)->addShop(currentAmmunationStore);
        }

        JSON->close();

        if (m_ammunationStoreCount == 0)
            printf("[AmmunationController] ERROR: Could not load any ammunation shops.");

        if (m_ammunationWeaponCount == 0)
            printf("[AmmunationController] ERROR: Could not load any ammunation weapons.");
    }
}
