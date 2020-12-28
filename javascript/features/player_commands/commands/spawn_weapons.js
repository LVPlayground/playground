// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';
import { WeaponData } from 'features/player_commands/weapon_data.js';

// Using the spawnweapons command is a bit more expensive than using the ammunation.
const ExtraPriceFactor = 1.5;

// Implementation of the "/my spawnweapons" and "/p [player] spawnweapons" commands. Enables players
// to purchase spawn weapons for the duration of their playing session.
export class SpawnWeapons extends PlayerCommand {
    get name() { return 'spawnweapons'; }
    get description() { return `Manage spawn weapons.`; }

    get parameters() {
        return [
            { name: 'weapon', type: CommandBuilder.kTypeNumber },
            { name: 'multiplier', type: CommandBuilder.kTypeNumber, defaultValue: 1 }
        ];
    }

    // Called when the command is executed by the |player| for the |target|, which may be another
    // player. The |weapon| and |multiplier| are guaranteed to be given.
    execute(player, target, weapon, multiplier) {        
        // Spawnweapons can only be set when on foot
        if (target.state !== Player.kStateOnFoot) {
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_NOT_ON_FOOT);
            return;
        }
        
        const canGetSpawnWeapons = this.limits().canGetSpawnWeapons(target);
        // Bail out if the |player| might abuse it.
        if (!canGetSpawnWeapons.isApproved()) {
            if (player.id === target.id) {
                player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_TELEPORT, canGetSpawnWeapons);
            } else {
                player.sendMessage(
                    Message.PLAYER_COMMANDS_SPAWN_WEAPONS_TELEPORT_TARGET, target.name,
                    canGetSpawnWeapons);
            }

            return;
        }

        if (!WeaponData.hasSpawnWeapon(weapon)) {
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_INVALID_WEAPON, weapon);
            return;
        }

        if (multiplier <= 0 || multiplier > 100) {
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_INVALID_AMOUNT, multiplier);
            return;
        }

        const weaponData = WeaponData.getWeaponById(weapon);

        if (player === target) {
            const price = weaponData.basePrice * multiplier * ExtraPriceFactor;
            if (this.finance().getPlayerCash(player) < price) {
                player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_NOT_ENOUGH_MONEY, price);
                return;
            }

            this.finance().takePlayerCash(player, price);
        }

        if (weaponData.id === 1337 /* armour */) {
            target.giveSpawnArmour();
            player.sendMessage(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_ARMOUR);
        } else {
            target.giveSpawnWeapon(weaponData.id, multiplier);
            player.sendMessage(
                Message.PLAYER_COMMANDS_SPAWN_WEAPONS_WEAPON, weaponData.name, multiplier);
        }
    }
}
