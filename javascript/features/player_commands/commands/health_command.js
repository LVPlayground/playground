// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

// Implements the "/my health" and "/p [player] health" commands, which makes it possible for admins
// to change the amount of health a particular player has.
export class HealthCommand extends PlayerCommand {
    get name() { return 'health'; }
    get parameters() {
        return [
            { name: 'amount', type: CommandBuilder.NUMBER_PARAMETER, optional: true },
        ];
    }

    // This command is not available to all players, only to administrators.
    get playerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    // Called when a player executes the command. When |amount| is not given, their current health
    // level will be displayed to the administrator instead.
    async execute(player, target, amount) {
        if (typeof amount !== 'number' || amount < 0 || amount > 100) {
            if (player === target) {
                player.sendMessage(Message.PLAYER_COMMANDS_HEALTH_STATUS_SELF, player.health);
            } else {
                player.sendMessage(Message.PLAYER_COMMANDS_HEALTH_STATUS_OTHER, target.name,
                                   target.id, target.health);
            }

            return;
        }

        target.health = amount;

        if (player === target) {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_HEALTH_UPDATED_SELF_ADMIN, player.name, player.id, amount);

            player.sendMessage(Message.PLAYER_COMMANDS_HEALTH_UPDATED_SELF, amount);

        } else {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_HEALTH_UPDATED_OTHER_ADMIN, player.name, player.id,
                target.name, target.id, amount);

            player.sendMessage(
                Message.PLAYER_COMMANDS_HEALTH_UPDATED_OTHER, target.name, target.id, amount);
        }
    }
}
