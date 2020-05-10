// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';

// Contains the /dm command for players to allow to teleport to a DM zone with specific weapons.
export class DeathMatchCommands {    

    constructor() {
        server.commandManager.buildCommand('dm')
            .parameters([{ name: 'zone', type: CommandBuilder.NUMBER_PARAMETER }])
        .build(DeathMatchCommands.prototype.onDmCommand.bind(this));
    }

    // The DM command is being used.
    onDmCommand(player, zone) { 
        if(zone === null || zone === undefined || zone !== 1) {
            // TODO (OttoRocket): Have a DM zone manager that keeps track of all zones and 
            // locations. Allowing message with all valid zones shown.

            player.sendMessage(Message.DEATH_MATCH_INVALID_ZONE, zone);
        }
    }


    // Cleans up the state created by this class, i.e. removes the commands.
    dispose() {
        server.commandManager.removeCommand('dm');
    }
}