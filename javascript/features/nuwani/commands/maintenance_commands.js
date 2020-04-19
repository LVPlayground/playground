// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Provides a series of commands to Nuwani meant for administrative maintenance purposes, for
// example to inspect the bot and the server's current status, evaluate code, and so on.
export class MaintenanceCommands {
    commandManager_ = null;

    constructor(commandManager, owners) {
        this.commandManager_ = commandManager;
        this.owners_ = owners;

        // !eval [JavaScript code]
        this.commandManager_.buildCommand('eval')
                .restrict(MaintenanceCommands.prototype.isOwner.bind(this))
                .parameters([{ name: 'code', type: CommandBuilder.SENTENCE_PARAMETER }])
                .build(MaintenanceCommands.prototype.onEvalCommand.bind(this));
        
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
        
        for (const owner of this.owners_) {
            if (owner.nickname !== source.nickname && owner.nickname !== '*')
                continue;
            
            if (owner.username !== source.username && owner.username !== '*')
                continue;
            
            if (owner.hostname !== source.hostname && source.hostname !== '*')
                continue;
            
            return true;
        }

        return false;
    }

    dispose() {
        this.commandManager_.removeCommand('time');
        this.commandManager_.removeCommand('eval');
    }
}
