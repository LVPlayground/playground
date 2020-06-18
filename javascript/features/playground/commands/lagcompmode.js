// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Command: /lagcompmode [player] [0-2]
export default class LagCompModeCommand extends Command {
    get name() { return 'lagcompmode'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([
                { name: 'target', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'mode', type: CommandBuilder.NUMBER_PARAMETER } ])
            .build(LagCompModeCommand.prototype.onLagCompModeCommand.bind(this));
    }

    // Changes the lag compensation mode for the given |player|.
    async onLagCompModeCommand(player, target, mode) {
        if (mode >= 0 && mode <= 2) {
            target.syncedData.lagCompensationMode = mode;
            player.sendMessage(
                Message.COMMAND_SUCCESS, subject.name + ' their lag compensation mode has been ' +
                'updated to: ' + mode);
            
        } else {
            player.sendMessage(
                Message.COMMAND_ERROR, 'The lag compensation mode must be one of [0, 1, 2].');
        }
    }
}
