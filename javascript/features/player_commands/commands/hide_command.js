// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

// Implements the "/my hide" command, which can be used by administrators to hide themselves on the
// map and makes them invisible to other players nearby.
export class HideCommand extends PlayerCommand {
    get name() { return 'hide'; }
    get description() { return `Toggle visibility of the character.`; }

    get parameters() {
        return [
            { name: 'invisible', type: CommandBuilder.kTypeText, optional: true }
        ];
    }

    // This command is not available to all players, only to administrators.
    get playerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    // Called when a player executes the "/my hide" or "/p [player] hide" command. Without giving a
    // parameter it will display the |player|'s current state, otherwise it will toggle.
    async execute(player, target, invisible) {
        const currentStatus = target.colors.visible ? 'visible' : 'hidden';

        if (![ 'on', 'off' ].includes(invisible)) {
            if (player === target)
                player.sendMessage(Message.PLAYER_COMMANDS_HIDE_STATUS_SELF, currentStatus);
            else
                player.sendMessage(Message.PLAYER_COMMANDS_HIDE_STATUS_OTHER, currentStatus);

            return;
        }

        const visible = invisible === 'off';
        if (target.colors.visible === visible) {
            if (player === target)
                player.sendMessage(Message.PLAYER_COMMANDS_HIDE_NO_CHANGE_SELF, currentStatus);
            else
                player.sendMessage(Message.PLAYER_COMMANDS_HIDE_NO_CHANGE_OTHER, currentStatus);
            
            return;
        }

        target.colors.visible = visible;

        const updatedStatus = target.colors.visible ? 'visible' : 'hidden';
        if (player === target) {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_HIDE_UPDATED_SELF_ADMIN, player.name, player.id,
                updatedStatus);

            player.sendMessage(Message.PLAYER_COMMANDS_HIDE_UPDATED_SELF, updatedStatus);
        } else {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_HIDE_UPDATED_OTHER_ADMIN, player.name, player.id,
                target.name, target.id, updatedStatus);

            player.sendMessage(
                Message.PLAYER_COMMANDS_HIDE_UPDATED_OTHER, target.name, target.id, updatedStatus);
            target.sendMessage(
                Message.PLAYER_COMMANDS_HIDE_UPDATED_FYI, player.name, player.id, updatedStatus);
        }
    }
}
