// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';
import { WeaponData } from 'features/player_commands/weapon_data.js';

// Using the spawnweapons command is a bit more expensive than using the ammunation.
const ExtraPriceFactor = 1.5;

// Command: spawnweapons [weaponId] [multipler]
export default class SpawnWeapons extends PlayerCommand {
    get name() { return 'spawnweapons'; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'weapon', type: CommandBuilder.NUMBER_PARAMETER, optional: false },
            { name: 'multiplier', type: CommandBuilder.NUMBER_PARAMETER, optional: false }])
            .build(SpawnWeapons.prototype.onSpawnWeaponsCommand.bind(this));
    }

    // Let the player buy spawn weapons
    onSpawnWeaponsCommand(player, weapon, multiplier) {
        const teleportStatus = this.abuse_().canTeleport(player, { enforceTimeLimit: true });

        // Bail out if the |player| is not currently allowed to teleport.
        if (!teleportStatus.allowed) {
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS, teleportStatus.reason);
            return;
        }

        this.giveSpawnWeapon(player, player, weapon, multiplier);
    }

    // Gve the |subject| his |weapon| with |multiplier| * ammunations (from config).
    // If |player| is not |subject| an admin gives the weapon. Costs are not applied.
    giveSpawnWeapon(player, subject, weapon, multiplier) {
        if (!WeaponData.hasSpawnWeapon(weapon)) {
            player.sendMessage(Message.PLAYER_COMMANDS_INVALID_SPAWN_WEAPON, weapon);
            return;
        }

        if (multiplier <= 0 || multiplier > 100) {
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_INVALID_AMOUNT, multiplier);
            return;
        }

        const weaponData = WeaponData.getWeaponById(weapon);

        if (player.id === subject.id) {
            const price = weaponData.basePrice * multiplier * ExtraPriceFactor;
            if (this.finance_().getPlayerCash(player) < price) {
                player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_NOT_ENOUGH_MONEY, price);
                return;
            }

            this.finance_().takePlayerCash(player, price);
        }

        if (weaponData.id === 1337 /* armour */) {
            subject.giveSpawnArmour();
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_ARMOUR);
        } else {
            subject.giveSpawnWeapon(weaponData.id, multiplier);
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_WEAPON, weaponData.name, multiplier);
        }
    }
}
