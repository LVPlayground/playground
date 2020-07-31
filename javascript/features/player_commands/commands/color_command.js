// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { CommandBuilder } from 'components/commands/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

// Implements the "/my color" command, which is available to VIPs who wish to change their color.
// Administrators further have the ability to execute this command on other players.
export class ColorCommand extends PlayerCommand {
    get name() { return 'color'; }
    get description() { return `Control the player color.`; }

    get parameters() {
        return [
            { name: 'color', type: CommandBuilder.kTypeText, optional: true }
        ];
    }

    // This command is only available to VIPs for now.
    get requireVip() { return true; }

    // Called when a player executes the "/my color" or "/p [player] color" command. Optionally a
    // RGB color can be given in |color|, which is only available for administrators.
    async execute(player, target, color) {
        if (color && !color.match(/^#[0-9a-f]{6}$/i)) {
            player.sendMessage(Message.PLAYER_COMMANDS_COLOR_INVALID_FORMAT);
            return;
        }

        // Sanitizes the color, either from HEX or by showing a color picker.
        color = color ? Color.fromHex(color.substring(1))
                      : await this.playerColors().displayColorPickerForPlayer(player);

        if (!color)
            return;  // the |player| has aborted out of the colour selection flow

        target.colors.customColor = color;

        if (player === target) {
            player.sendMessage(Message.PLAYER_COMMANDS_COLOR_UPDATED_SELF);
        } else {
            this.announce().announceToAdministrators(
                Message.PLAYER_COMMANDS_COLOR_UPDATED_FYI_ADMIN, player.name, player.id,
                target.name, target.id, color.toHexRGB());

            player.sendMessage(Message.PLAYER_COMMANDS_COLOR_UPDATED_OTHER, target.name, target.id);
            target.sendMessage(Message.PLAYER_COMMANDS_COLOR_UPDATED_FYI, player.name, player.id);
        }
    }
}
