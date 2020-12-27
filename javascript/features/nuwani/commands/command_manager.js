// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { CommandContext } from 'features/nuwani/commands/command_context.js';
import { CommandExecutor } from 'components/commands/command_executor.js';
import { NuwaniContextDelegate } from 'features/nuwani/commands/nuwani_context_delegate.js';
import { NuwaniPermissionDelegate } from 'features/nuwani/commands/nuwani_permission_delegate.js';
import { RuntimeObserver } from 'features/nuwani/runtime/runtime.js';

// The CommandManager for Nuwani. The use of this class closely mimics the in-game command manager,
// which means that IRC commands must be created using a builder with predefined parameters.
export class CommandManager extends RuntimeObserver {
    runtime_ = null;
    configuration_ = null;

    commands_ = null;
    executor_ = null;

    // Gets the number of commands that have been registered so far.
    get size() { return this.commands_.size; }

    constructor(runtime, configuration) {
        super();

        if (runtime) {
            this.runtime_ = runtime;
            this.runtime_.addObserver(this);
        } else if (!server.isTest()) {
            throw new Error('The |runtime| argument is only optional while running tests.');
        }

        this.configuration_ = configuration;

        this.commands_ = new Map();
        this.executor_ = new CommandExecutor(
            new NuwaniContextDelegate(), new NuwaniPermissionDelegate());
    }

    // Registers |command| as a new command, which will invoke |listener| when used.
    registerCommand(command, listener) {
        if (this.commands_.has(command))
            throw new Error('The command "' + command + '" has already been registered.');

        this.commands_.set(command, listener);
    }

    // Creates a command builder for the command named |command|. The |build()| method must be
    // called on the returned builder in order for the command to become registered.
    //
    // Read the online documentation for more information on command builders:
    // https://github.com/LVPlayground/playground/tree/master/javascript/components/commands
    buildCommand(command) {
        return new CommandBuilder({
            listener: description => {
                if (this.commands_.has(command))
                    throw new Error('The command "' + command + '" has already been registered.');

                this.commands_.set(command, description);
            },

            name: command,
            prefix: this.configuration_.commandPrefix,
        });
    }

    // Removes the |command| from the list of commands known and handled by this manager.
    removeCommand(command) {
        if (!this.commands_.has(command))
            throw new Error('The command "' + command + '" has not been registered.');

        this.commands_.delete(command);
    }

    // ---------------------------------------------------------------------------------------------
    // RuntimeObserver implementation:

    async onBotMessage(bot, message) {
        if (message.command != 'PRIVMSG' || message.params.length !== 2)
            return;  // not a valid message
        
        const commandPrefix = this.configuration_.commandPrefix;
        const messageText = message.params[1];

        if (!messageText.startsWith(commandPrefix))
            return;  // not a command

        const nextSpace = messageText.indexOf(' ');
        const boundary = nextSpace === -1 ? messageText.length
                                          : nextSpace;

        const command = messageText.substring(commandPrefix.length, boundary).toLowerCase();
        const args = messageText.substring(boundary).trim();

        if (!this.commands_.has(command))
            return;  // unknown command

        const context = CommandContext.createForMessage(bot, message, this.configuration_);
        await this.executor_.executeCommand(context, this.commands_.get(command), args);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.runtime_) {
            this.runtime_.removeObserver(this);
            this.runtime_ = null;
        }

        this.commands_.clear();
        this.commands_ = null;
    }
}
