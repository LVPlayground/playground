// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

// Implements the "/my armour" and "/p [player] armor" commands, which makes it possible for admins
// to change the amount of armour a particular player has. Gee American spelling.
export class ArmorCommand extends PlayerCommand {
    get name() { return 'armor'; }
    get parameters() {
        return [
            { name: 'amount', type: CommandBuilder.NUMBER_PARAMETER, optional: true },
        ];
    }

    // This command is not available to all players, only to administrators.
    get playerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    // Called when a player executes the command. When |amount| is not given, their current armour
    // level will be displayed to the |player| instead.
    async execute(player, target, amount) {
        if (typeof amount !== 'number' || amount < 0 || amount > 100) {
            if (player === target) {
                player.sendMessage(Message.PLAYER_COMMANDS_ARMOR_STATUS_SELF, player.armour);
            } else {
                player.sendMessage(Message.PLAYER_COMMANDS_ARMOR_STATUS_OTHER, target.name,
                                   target.id, target.armour);
            }

            return;
        }

        target.armour = amount;

        if (player === target) {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_ARMOR_UPDATED_SELF_ADMIN, player.name, player.id, amount);

            player.sendMessage(Message.PLAYER_COMMANDS_ARMOR_UPDATED_SELF, amount);

        } else {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_ARMOR_UPDATED_OTHER_ADMIN, player.name, player.id,
                target.name, target.id, amount);

            player.sendMessage(
                Message.PLAYER_COMMANDS_ARMOR_UPDATED_OTHER, target.name, target.id, amount);
        }
    }
}
