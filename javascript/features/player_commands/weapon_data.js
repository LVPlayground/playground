// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PrivateSymbol = Symbol('Please use the static methods.');
const AmmunationDataFile = 'data/ammunation.json';

const weaponsData = new Map();

export class WeaponData {
    static getAllSpawnWeaponIds() {
        return [...weaponsData.keys()];
    }

    static hasSpawnWeapon(id) {
        const weaponData = weaponsData.get(id);
        return weaponData && weaponData.isSpawnWeapon;
    }

    static getWeaponById(id) {
        return weaponsData.get(id);
    }

    static initialize(privateSymbol) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal call. The weapon data is already initialized.');

        const ammunationInfo = JSON.parse(readFile(AmmunationDataFile));
        if (!ammunationInfo.hasOwnProperty('weapons') || !Array.isArray(ammunationInfo.weapons)) {
            throw new Error('Unable to load ammunation data.')
        }

        ammunationInfo.weapons.forEach(weaponInfo => {
            const weaponData = new WeaponData(PrivateSymbol, weaponInfo);

            if (weaponsData.has(weaponData.gta_id))
                throw new Error('Duplicated weapon Id: ' + weaponData.id);

            weaponsData.set(weaponData.id, weaponData);
        });

        // As the JSON is also used by the PAWN code I do not want to change it.
        // Thus add the spawn armour manually.
        const spawnArmourWeaponData = new WeaponData(PrivateSymbol,
            {
                "gta_id": 1337,
                "name": 'armour',
                "is_spawn_weapon": true,
                "is_melee": false,
                "base_price": 25000,
                "ammunitions": 1,
                "isArmour": true
            }
        );

        weaponsData.set(spawnArmourWeaponData.id, spawnArmourWeaponData);
    }

    constructor(privateSymbol, weaponData) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.id_ = weaponData.gta_id;
        this.name_ = weaponData.name;
        this.isSpawnWeapon_ = weaponData.is_spawn_weapon;
        this.isMelee_ = weaponData.is_melee;
        this.basePrice_ = weaponData.base_price;
        this.ammunitions_ = weaponData.ammunitions;
        this.isArmour = weaponData.isArmour ?? false;
    }

    get id() { return this.id_; }
    get name() { return this.name_; }
    get isSpawnWeapon() { return this.isSpawnWeapon_; }
    get isMelee() { return this.isMelee_; }
    get basePrice() { return this.basePrice_; }
    get ammunitions() { return this.ammunitions_; }
}


WeaponData.initialize(PrivateSymbol);