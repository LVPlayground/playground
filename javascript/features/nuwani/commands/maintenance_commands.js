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
        
        // !nuwani [request-decrease|request-increase]
        this.commandManager_.buildCommand('nuwani')
            .restrict(Player.LEVEL_MANAGEMENT)
            .sub('reload-format')
                .build(MaintenanceCommands.prototype.onNuwaniReloadFormatCommand.bind(this))
            .sub('request-decrease')
                .build(MaintenanceCommands.prototype.onNuwaniRequestDecreaseCommand.bind(this))
            .sub('request-increase')
                .build(MaintenanceCommands.prototype.onNuwaniRequestIncreaseCommand.bind(this))
            .build(MaintenanceCommands.prototype.onNuwaniCommand.bind(this));
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

    // !nuwani
    //
    // Displays the sub-commands that are available as part of this command.
    onNuwaniCommand(context) {
        context.respondWithUsage('!nuwani [reload-format | request-decrease | request-increase]')
    }

    // !nuwani reload-format
    //
    // Reloads the IRC message format. The new format must have been uploaded to the server already,
    // and calling this command will apply the changes to the live bot as well.
    onNuwaniReloadFormatCommand(context) {
        try {
            this.nuwani_.messageFormatter.reloadFormat();
            context.respond('3Success: The message format has been reloaded.');
        } catch (exception) {
            this.respond(`4Error: Unable to reload the format (${exception.message})`);
        }
    }

    // !nuwani request-decrease
    //
    // Requests an IRC bot to disconnect from the network, in case there's one connected which
    // has been marked as optional. Generally not useful, but provided for symmetry.
    onNuwaniRequestDecreaseCommand(context) {
        let hasActiveOptionalBots = false;
        for (const activeBot of this.nuwani_.runtime.activeBots) {
            if (activeBot.config.master || !activeBot.config.optional)
                continue;
            
            hasActiveOptionalBots = true;
            break;
        }

        if (!hasActiveOptionalBots) {
            context.respond('4Error: There are no optional bots that could be disconnected.');
            return;
        }

        this.nuwani_.runtime.requestSlaveDecrease();

        context.respond('3Success: One of the bots has been requested to disconnect.');
    }

    // !nuwani request-increase
    //
    // Requests an additional IRC bot to start up. Useful in case staff on IRC are aware of an
    // upcoming sudden increase in player count.
    onNuwaniRequestIncreaseCommand(context) {
        if (!this.nuwani_.runtime.availableBots.size) {
            context.respond('4Error: There are no available bots that could be connected.');
            return;
        }

        this.nuwani_.runtime.requestSlaveIncrease();

        context.respond('3Success: A new bot has been requested to connect to the network.');
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
        this.commandManager_.removeCommand('nuwani');
        this.commandManager_.removeCommand('level');
        this.commandManager_.removeCommand('eval');
    }
}
