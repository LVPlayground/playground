// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The set of spawn weapons (and spawn armour) of any player may be handled through the commands
 * grouped in this class.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class SpawnWeaponCommands {
    // This dialog shows a list of spawn weapons and weapon Ids a player is carrying.
    const SpawnWeaponListDialog = @counter(OnDialogResponse);

    /**
     * Will display information of the player's spawnweapons.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @command /p [player] spawnweapons
     * @command /my spawnweapons
     */
    @switch(PlayerCommand, "spawnweapons")
    public onPlayerSpawnWeaponsCommand(playerId, subjectId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Player(subjectId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "The selected player is a NPC!");
            return 1;
        }

        // If no parameters are specified, we show a list with the player's current spawn weapons
        // and armour, if any are set.
        if (!strlen(params)) {
            new weaponId, ammunition, weaponName[32], dialogCaption[32], weaponList[900], listItems;
            for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
                weaponId = SpawnWeaponManager(subjectId)->spawnWeaponId(weaponSlot);
                if (weaponId != 0) {
                    listItems++;

                    GetWeaponName(weaponId, weaponName, sizeof(weaponName));
                    ammunition = SpawnWeaponManager(subjectId)->spawnWeaponAmmo(weaponSlot)
                        * AmmunationWeapon(weaponId)->ammunition();
                    format(weaponList, sizeof(weaponList), "%s\r\n%d x %s (Id:%d)", weaponList,
                        ammunition, weaponName, weaponId);
                }
            }

            // Now we check if the player has spawn armour set.
            if (SpawnWeaponManager(subjectId)->spawnArmour() == true) {
                listItems++;
                format(weaponList, sizeof(weaponList), "%s\r\n1 x Armour (Id:1337)", weaponList);
            }

            // Show the spawn weapons list, or an error message when the player carries none.
            if (listItems == 0)
                SendClientMessage(playerId, Color::Error, "No spawn weapons to list...");
            else {
                format(dialogCaption, sizeof(dialogCaption), "Spawn Weapons");
                strdel(weaponList, 0, 2); /* remove the first line break */
                ShowPlayerDialog(playerId, SpawnWeaponListDialog, DIALOG_STYLE_MSGBOX, dialogCaption,
                    weaponList, "Okay", "");
            }

            // Handle sending the command usage information.
            if (playerId != subjectId)
                SendClientMessage(playerId, Color::Information,
                    "  Use /p [player] spawnweapons [weaponId] [multiplier=0] to remove a certain spawn weapon.");
            else
                SendClientMessage(playerId, Color::Information,
                    "  Use /my spawnweapons [weaponId] [multiplier=0] to remove a certain spawn weapon.");
            SendClientMessage(playerId, Color::Information,
                "  If a multiplier different than 0 is given, a spawn weapon will be added. Check /weapons!");
        }

        return 1;
    }

    /**
     * In order to make it easier to catch cheaters, LVP crew can use the resetspawnweapons command
     * to persistenly remove all player's spawn weapons/armour.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @command /p [player] resetspawnweapons
     */
    @switch(PlayerCommand, "resetspawnweapons")
        public onPlayerResetSpawnWeaponsCommand(playerId, subjectId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Player(subjectId)->isAdministrator() == true && playerId != subjectId) {
            SendClientMessage(playerId, Color::Error, "The selected player is a crew member!");
            return 1;
        }

        if (Player(subjectId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "The selected player is a NPC!");
            return 1;
        }

        // Cycle through all the player's weapon slots and reset the spawn weapons.
        new weaponId, notice[128];
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            weaponId = SpawnWeaponManager(subjectId)->spawnWeaponId(weaponSlot);
            SpawnWeaponManager(subjectId)->removeSpawnWeapon(weaponId);
        }

        // Remove spawn armour.
        SpawnWeaponManager(subjectId)->removeSpawnArmour();

        SendClientMessage(playerId, Color::Success, "Spawn weapons/armour reset successful!");

        format(notice, sizeof(notice), "%s (Id:%d) has reset spawn weapons for %s (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, notice);

        return 1;
        #pragma unused params
    }
};
