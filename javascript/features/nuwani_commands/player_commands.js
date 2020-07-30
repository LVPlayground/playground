// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';

// Implementation of a series of commands that allow interaction with the state of in-game players,
// change their status, find them, and so on.
export class PlayerCommands {
    commandManager_ = null;

    constructor(commandManager) {
        this.commandManager_ = commandManager;

        // !getid [nickname]
        this.commandManager_.buildCommand('getid')
            .description(`Display the player Id for a given nickname.`)
            .parameters([{ name: 'nickname', type: CommandBuilder.kTypePlayer }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));

        // !getname [id]
        this.commandManager_.buildCommand('getname')
            .description(`Display the nickname for a given player Id.`)
            .parameters([{ name: 'id', type: CommandBuilder.kTypePlayer }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));
    }

    // !getid [nickname]
    // !getname [id]
    //
    // Finds a specific player by either their nickname or assigned player Id. Both commands will
    // share an identical output, so we only have to implement this once.
    onGetPlayerCommand(context, player) {
        context.respond(`10*** 05${player.name} (Id:${player.id})`);
    }

    dispose() {
        this.commandManager_.removeCommand('getname');
        this.commandManager_.removeCommand('getid');
    }
}
