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
