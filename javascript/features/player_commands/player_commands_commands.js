// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

const COMMAND_DATA_DIRECTORY = 'javascript/features/player_commands/commands'
const COMMAND_BASE_PATH = 'features/player_commands/commands'

// This registers all player commands handled in JavaScript
export class PlayerCommandsCommands {
    constructor(abuse, announce, finance) {
        this.abuse_ = abuse;
        this.announce_ = announce;
        this.finance_ = finance;
    }

    async buildCommands() {
        const commandBuilder = server.commandManager.buildCommand('my')
            .restrict(Player.LEVEL_PLAYER)
            .parameters([{ name: 'parameters', type: CommandBuilder.SENTENCE_PARAMETER, optional: true }]);

        const adminCommandBuilder = server.commandManager.buildCommand('p')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'parameters', type: CommandBuilder.SENTENCE_PARAMETER, optional: true }])
            .sub(CommandBuilder.PLAYER_PARAMETER)
            .parameters([{ name: 'parameters', type: CommandBuilder.SENTENCE_PARAMETER, optional: true }]);

        await this.loadSubCommands(commandBuilder, adminCommandBuilder);

        commandBuilder.build(PlayerCommandsCommands.prototype.onMyCommand.bind(this));
    
        adminCommandBuilder
            .build(PlayerCommandsCommands.prototype.onAdminCommandWithPlayer.bind(this)) 
            .build(PlayerCommandsCommands.prototype.onAdminCommand.bind(this));
    }

    async loadSubCommands(parentCommand, parentAdminCommand) {
        glob(COMMAND_DATA_DIRECTORY, '^((?!test).)*\.js$').forEach(
            async file => await this.registerSubCommand(parentCommand, parentAdminCommand, (COMMAND_BASE_PATH + '/' + file)));
    }

    async registerSubCommand(parentCommand, parentAdminCommand, fileLocation) {
        const CommandImplementation = (await import(fileLocation)).default;
        if (!CommandImplementation instanceof PlayerCommand)
            throw new Error(fileLocation + ' does not contain a player command.');

        const command = new CommandImplementation(this.abuse_, this.announce_, this.finance_);

        command.build(parentCommand.sub(command.name));
        command.buildAdmin(parentAdminCommand.sub(command.name));
    }

    onMyCommand(player, parameters) {
        wait(0).then(() => pawnInvoke('OnPlayerCommand', 'is', player.id, '/my ' + parameters ?? ''));
    }

    onAdminCommand(player, parameters) {
        wait(0).then(() => pawnInvoke('OnPlayerCommand', 'is', player.id, '/p ' + parameters ?? ''));
    }

    onAdminCommandWithPlayer(player, subject, parameters) {
        this.onAdminCommand(player, `${subject.id} ${parameters}`);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('my');
        server.commandManager.removeCommand('p');
    }
}
