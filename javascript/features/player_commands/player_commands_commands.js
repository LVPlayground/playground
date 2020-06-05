// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

const COMMAND_DATA_DIRECTORY = 'javascript/features/player_commands/commands'
const COMMAND_BASE_PATH = 'features/player_commands/commands'

// This registers all player commands handled in JavaScript
export class PlayerCommandsCommands {
    constructor() {
    }

    async buildCommands() {        
        const commandBuilder = server.commandManager.buildCommand('my')
            .restrict(Player.LEVEL_PLAYER)
            .parameters([ { name: 'parameters', type: CommandBuilder.SENTENCE_PARAMETER, optional: true } ]);
        await this.loadSubCommands(commandBuilder);
        commandBuilder.build(PlayerCommandsCommands.prototype.onMyCommand.bind(this));
    }

    async loadSubCommands(parentCommand) {
        glob(COMMAND_DATA_DIRECTORY, '.*\.js').forEach(
            async file => await this.registerSubCommand(parentCommand, (COMMAND_BASE_PATH + '/' + file)));
    }

    async registerSubCommand(parentCommand, fileLocation) {
        const CommandImplementation = (await import(fileLocation)).default;
        if (!CommandImplementation instanceof PlayerCommand)
            throw new Error(fileLocation + ' does not contain a player command.');
            
        const command = new CommandImplementation();

        command.build(parentCommand.sub(command.name));
    }

    onMyCommand(player, parameters) {
        console.log(parameters);
        wait(0).then(() => pawnInvoke('OnPlayerCommand', 'is', player.id, '/my ' + parameters ?? ''));
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('my');
    }
}
