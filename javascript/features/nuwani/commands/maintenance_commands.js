// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Provides a series of commands to Nuwani meant for administrative maintenance purposes, for
// example to inspect the bot and the server's current status, evaluate code, and so on.
export class MaintenanceCommands {
    commandManager_ = null;
    configuration_ = null;

    constructor(commandManager, configuration, nuwani) {
        this.commandManager_ = commandManager;
        this.configuration_ = configuration;
        this.nuwani_ = nuwani;

        // !eval [JavaScript code]
        this.commandManager_.buildCommand('eval')
            .restrict(MaintenanceCommands.prototype.isOwner.bind(this))
            .parameters([{ name: 'code', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(MaintenanceCommands.prototype.onEvalCommand.bind(this));
        
        // !level [nickname?]
        this.commandManager_.buildCommand('level')
            .parameters([{ name: 'nickname', type: CommandBuilder.WORD_PARAMETER, optional: true }])
            .build(MaintenanceCommands.prototype.onLevelCommand.bind(this));

        // !time
        this.commandManager_.buildCommand('time')
            .build(MaintenanceCommands.prototype.onTimeCommand.bind(this));
    }

    // !eval [JavaScript code]
    //
    // Evaluates the given JavaScript code on the server. This has full access to the server context
    // and should therefore be limited to bot owners.
    onEvalCommand(context, code) {
        context.respond('5Result: ' + eval(code));
    }

    // !level [nickname?]
    //
    // Displays the level of the |nickname| from the perspective of the bot. This is determined by
    // their channel modes in the configured echo channel.
    onLevelCommand(context, nickname) {
        let actualNickname = nickname || context.nickname;

        const channelModes = context.bot.getUserModesInEchoChannel(actualNickname);
        if (typeof channelModes !== 'string') {
            context.respond(`4Error: ${actualNickname} does not seem to be in the echo channel.`);
            return;
        }
        
        let level = Player.LEVEL_PLAYER;
        for (const mapping of this.configuration_.levels) {
            if (channelModes.includes(mapping.mode)) {
                level = mapping.level;
                break;
            }
        }

        let levelString = null;
        switch (level) {
            case Player.LEVEL_MANAGEMENT:
                levelString = 'a Management member';
                break;

            case Player.LEVEL_ADMINISTRATOR:
                levelString = 'an administrator';
                break;

            case Player.LEVEL_PLAYER:
                levelString = 'a player';
                break;

            default:
                throw new Error('Unrecognised player level: ' + level);
        }

        context.respond(`5Result: ${actualNickname} is ${levelString}.`);
    }

    // !time
    //
    // Displays the current time on the server.
    onTimeCommand(context) {
        context.respond('5The current time is: ' + (new Date).toTimeString());
    }

    // Returns whether the given |context| has been created for a message from a bot owner.
    isOwner(context) {
        const source = context.source;
        if (!source || !source.isUser())
            return false;  // the |context| was not sent by a human
        
        for (const owner of this.configuration_.owners) {
            if (owner.nickname !== source.nickname && owner.nickname !== '*')
                continue;
            
            if (owner.username !== source.username && owner.username !== '*')
                continue;
            
            if (owner.hostname !== source.hostname && owner.hostname !== '*')
                continue;
            
            return true;
        }

        return false;
    }

    dispose() {
        this.commandManager_.removeCommand('time');
        this.commandManager_.removeCommand('level');
        this.commandManager_.removeCommand('eval');
    }
}
