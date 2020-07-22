// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many slots does SA:MP use to store player weapons in?
#define WeaponSlots 13

/**
 * This class wraps up several tools which can be useful when dealing with weapons.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class WeaponUtilities {
    // The highest weapon Id available in SA-MP, which can be used by players.
    public const HighestWeaponId = 46;

    // This dialog shows a list of weapons and weapon Ids spawnable in Las Venturas Playground.
    const WeaponListDialog = @counter(OnDialogResponse);

    /**
     * Check whether the weapon Id matches to a valid weapon.
     *
     * @param weaponId GTA Id of the weapon.
     * @return boolean Does the weapon Id match to a valid weapon?
     */
    public bool: isWeaponValid(weaponId) {
        if (weaponId < 0 || weaponId == 19 || weaponId == 20 || weaponId == 21 || weaponId > 46)
            return false;

        return true;
    }

    /**
     * Retrieves the slot Id of the specified weapon.
     * 
     * @param weaponId GTA Id of the weapon.
     * @return integer Slot Id of the weapon. Returns -1 if the specified weapon Id is invalid.
     */
    public getWeaponSlot(weaponId) {
        new slot;
        switch(weaponId) {
            case 0, 1:       slot =  0;
            case 2 .. 9:     slot =  1;
            case 10 .. 15:   slot = 10;
            case 16 .. 18:   slot =  8;
            case 22 .. 24:   slot =  2;
            case 25 .. 27:   slot =  3;
            case 28, 29, 32: slot =  4;
            case 30, 31:     slot =  5;
            case 33, 34:     slot =  6;
            case 35 .. 38:   slot =  7;
            case 39:         slot =  8;
            case 40:         slot = 12;
            case 41 .. 43:   slot =  9;
            case 44 .. 46:   slot = 11;
            default:         slot = -1;
        }

        return slot;
    }

    /**
     * Retrieve the model Id of the specified weapon.
     *
     * @param weaponId GTA Id of the weapon.
     * @return integer Model Id of the weapon. Returns -1 if the specified weapon Id is invalid.
     */
    public getWeaponModel(weaponId) {
        new model;
        switch (weaponId) {
            case 1:        model =            331;
            case 2 .. 8:   model =            341;
            case 9:        model = weaponId + 332;
            case 10 .. 15: model = weaponId + 311;
            case 16 .. 18: model = weaponId + 326;
            case 22 .. 29: model = weaponId + 324;
            case 30, 31:   model = weaponId + 325;
            case 32:       model =            372;
            case 33 .. 45: model = weaponId + 324;
            case 46:       model =            371;
            default:       model =             -1;
        }

        return model;
    }

    /**
     * @param playerId Id of the player who typed the command.
     * @command /weapons
     */
    @command("weapons")
    public onWeaponsCommand(playerId, params[]) {
        
        new dialogCaption[32], dialogMessage[900], weaponName[32];
        format(dialogCaption, sizeof(dialogCaption), "Weapons and Ids");

        // Already preformat the "Id" for armour: 1337. While this is not a valid weapon Id, crew
        // can use this Id to set a player's armour.
        format(dialogMessage, sizeof(dialogMessage), "Armour (Id:1337)");

        for (new weaponId = 1; weaponId <= WeaponUtilities::HighestWeaponId; weaponId++) {
            // Leave out unusable weapons.
            if (weaponId == 19 || weaponId == 20 || weaponId == 21 || weaponId == 40 || weaponId == 44 || weaponId == 45)
                continue;

            // Id 18 returns NULL, so we have to set this name manually.
            if (weaponId == 18)
                format(weaponName, sizeof(weaponName), "Molotov Cocktail");
            else
                GetWeaponName(weaponId, weaponName, sizeof(weaponName));
            format(dialogMessage, sizeof(dialogMessage), "%s\r\n%s (Id:%d)", dialogMessage,
                weaponName, weaponId);
        }

        ShowPlayerDialog(playerId, WeaponListDialog, DIALOG_STYLE_MSGBOX, dialogCaption, dialogMessage, "Okay", "");

        return 1;
        #pragma unused params
    }
};
