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
     * If no additional parameters are given, display information about the player's spawn weapons,
     * whereas "armour" is considered a weapon.
     *
     * In case a valid weapon Id (including the "Id" for armour) and, optionally, ammunition 
     * multiplier are specified through parameters, give the player the spawn weapon along with the
     * amount of ammunition. If the multiplier is "0", remove the player's spawn weapon.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param weaponId Id of the weapon the player wants to add/remove as a spawn weapon.
     * @param multiplier The value to multiply the default ammunition amount of a weapon with.
     * @command /p [player] spawnweapons [weaponId]? [multiplier=1]?
     * @command /my spawnweapons [weaponId]? [multiplier=1]?
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

        // One or more parameters have been specified, meaning we are about to add/remove weapons.
        if (Command->parameterCount(params) >= 1) {
            new weaponId = Command->integerParameter(params, 0),
                multiplier = Command->integerParameter(params, 1);

            // For valid weaponIds, we start the process.
            // The forbidden weapons are: Heat seaker (36), Minigun (38), Detonator (40), Night Vision Goggles (44) and Thermal Vision Goggles (45)
            if (weaponId != -1 && weaponId != 0 && weaponId != 19 && weaponId!= 20 && weaponId != 21
                && weaponId != 38 && weaponId != 40 && weaponId != 44 && weaponId != 45) {
                new notice[128], weaponName[32];

                // A special weaponId is 1337: the Id set for spawn armour. We'll have to do a
                // separate check for that.
                if (weaponId == 1337) {
                    // No multiplier set, or multiplier equals 0: let's remove the spawn armour.
                    if (multiplier == -1 || multiplier == 0) {
                        if (SpawnWeaponManager(subjectId)->spawnArmour() == true) {
                            SpawnWeaponManager(subjectId)->removeSpawnArmour();
                            SendClientMessage(playerId, Color::Success, "Spawn armour has been removed for this player.");

                            format(notice, sizeof(notice), "%s (Id:%d) has removed spawn armour for %s (Id:%d).",
                                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(),
                                subjectId);
                            Admin(playerId, notice);

                            return 1;
                        } else {
                            SendClientMessage(playerId, Color::Error, "This player has no spawn armour set!");
                            return 1;
                        }

                    } else { /* a multiplier has been set, add spawn armour for the player */
                        if (SpawnWeaponManager(subjectId)->spawnArmour() == true) {
                            SendClientMessage(playerId, Color::Error, "This player already has spawn armour set!");
                            return 1;
                        } else {
                            SpawnWeaponManager(subjectId)->giveSpawnArmour();
                            SendClientMessage(playerId, Color::Success, "Spawn armour has been set for this player.");

                            format(notice, sizeof(notice), "%s (Id:%d) has set spawn armour for %s (Id:%d).",
                                Player(playerId)->nicknameString(), playerId, Player(subjectId)->nicknameString(),
                                subjectId);
                            Admin(playerId, notice);

                            return 1;
                        }
                    }
                }

                // The rest of the weaponIds are valid GTA weapons only.
                // No multiplier set, or multiplier equals 0: let's remove the spawn weapon.
                if (multiplier == -1 || multiplier == 0) {
                    for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
                        if (SpawnWeaponManager(subjectId)->spawnWeaponId(weaponSlot) != weaponId)
                            continue;

                        SpawnWeaponManager(subjectId)->removeSpawnWeapon(weaponId);

                        GetWeaponName(weaponId, weaponName, sizeof(weaponName));
                        format(notice, sizeof(notice), "%s (Id:%d) has been removed as a spawn weapon for this player.",
                            weaponName, weaponId);
                        SendClientMessage(playerId, Color::Success, notice);

                        format(notice, sizeof(notice), "%s (Id:%d) has removed spawn weapon %s for %s (Id:%d).",
                            Player(playerId)->nicknameString(), playerId, weaponName,
                            Player(subjectId)->nicknameString(), subjectId);
                        Admin(playerId, notice);

                        return 1;
                    }

                    // Seems like we haven't found the spawn weapon, inform the user.
                    SendClientMessage(playerId, Color::Error, "This player has no spawn weapon with such Id set.");
                    return 1;
                } else { /* a multiplier has been set, add the spawn weapon for the player */
                    new desiredWeaponSlot = WeaponUtilities->getWeaponSlot(weaponId);
                    if (desiredWeaponSlot == -1) { /* an invalid weaponId has been specified */
                        SendClientMessage(playerId, Color::Error, "Invalid weaponId specified!");
                        return 1;
                    }

                    SpawnWeaponManager(subjectId)->removeSpawnWeapon(weaponId);
                    SpawnWeaponManager(subjectId)->giveSpawnWeapon(weaponId, multiplier);

                    GetWeaponName(weaponId, weaponName, sizeof(weaponName));
                    format(notice, sizeof(notice), "%d x %s (Id:%d) has been set as a spawn weapon for this player.",
                        AmmunationWeapon(weaponId)->ammunition() * multiplier, weaponName, weaponId);
                    SendClientMessage(playerId, Color::Success, notice);

                    format(notice, sizeof(notice), "%s (Id:%d) has set spawn weapon %s for %s (Id:%d).",
                        Player(playerId)->nicknameString(), playerId, weaponName,
                        Player(subjectId)->nicknameString(), subjectId);
                    Admin(playerId, notice);

                    return 1;
                }
            } else { /* an invalid weaponId has been specified */
                SendClientMessage(playerId, Color::Error, "Invalid weaponId specified!");
                return 1;
            }
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
