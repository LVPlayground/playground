// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implementation of a series of commands that allow the state of players to be modified, both of
// in-game players and of those who aren't currently online. 
export class PlayerCommands {
    commandManager_ = null;

    constructor(commandManager) {
        this.commandManager_ = commandManager;

        // !getid [nickname]
        this.commandManager_.buildCommand('getid')
            .parameters([{ name: 'nickname', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));

        // !getname [id]
        this.commandManager_.buildCommand('getname')
            .parameters([{ name: 'id', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));

        // !players
        // !players [nickname]
        this.commandManager_.buildCommand('players')
            .sub(CommandBuilder.WORD_PARAMETER)
                .build(PlayerCommands.prototype.onPlayerInfoCommand.bind(this))
            .build(PlayerCommands.prototype.onPlayerOnlineListCommand.bind(this));

        // !supported
        // !getvalue [key]
        // !setvalue [key] [value]
    }

    // !getid [nickname]
    // !getname [id]
    //
    // Finds a specific player by either their nickname or assigned player Id. Both commands will
    // share an identical output, so we only have to implement this once.
    onGetPlayerCommand(context, player) {
        context.respond(`10*** 05${player.name} (Id:${player.id})`);
    }
    
    // !players
    //
    // Lists the players who are connected to Las Venturas Playground rightn ow, including their
    // registration status and, if any, level. The players will be alphabetically ordered.
    onPlayerOnlineListCommand(context) {
        let players = [];
        let formattedPlayers = [];

        // (1) Establish the list of players to consider for the output. NPCs are ignored, and the
        // levels of undercover people are hidden as well.
        server.playerManager.forEach(player => {
            if (player.isNonPlayerCharacter())
                return;
            
            const name = player.name;
            const registered = player.isRegistered();
            const vip = player.isVip();
            const level = player.isUndercover() ? Player.LEVEL_PLAYER
                                                : player.level;

            players.push({ name, registered, vip, level });
        });

        // (2) Sort the list of |players| alphabetically for display. 
        players.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        
        // (3) Format each of the entries in |players| in accordance with the information we've
        // gathered on them.
        for (const info of players) {
            let color = null;

            if (!info.registered) {
                color = '14';  // dark grey
            } else {
                switch (info.level) {
                    case Player.LEVEL_PLAYER:
                        if (info.vip)
                            color = '12';  // dark blue

                        break;

                    case Player.LEVEL_ADMINISTRATOR:
                        color = '04';  // red
                        break;

                    case Player.LEVEL_MANAGEMENT:
                        color = '03';  // dark green
                        break;
                }
            }

            formattedPlayers.push(color + info.name + (color ? '' : ''));
        }

        // (4) Output the formatted result to the requester on IRC.
        if (!formattedPlayers.length)
            context.respond('7There are currently no players online.');
        else
            context.respond(`7Online players (${formattedPlayers.length}): ` + formattedPlayers.join(', '));
    }

    // !players [nickname]
    //
    // Displays more information about the player identified by the given |nickname|, which may
    // be an alias. Statistics will be shared, including a link to their profile.
    onPlayerInfoCommand(context, nickname) {

    }

    dispose() {
        this.commandManager_.removeCommand('players');
        this.commandManager_.removeCommand('getname');
        this.commandManager_.removeCommand('getid');
    }
}
