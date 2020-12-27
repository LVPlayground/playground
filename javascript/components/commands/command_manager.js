// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { CommandExecutor } from 'components/commands/command_executor.js';
import { CommandObserver } from 'components/commands/command_observer.js';
import { DefaultContextDelegate } from 'components/commands/default_context_delegate.js';
import { DefaultPermissionDelegate } from 'components/commands/default_permission_delegate.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// The command manager is responsible for intercepting player commands, and making sure that they
// end up with the command handler that's supposed to be handling them. It uses the full command
// infrastructure to figure out what a player's intention is, and whether they've got access.
export class CommandManager {
    #callbacks_ = null;
    #commands_ = new Map();
    #defaultPermissionDelegate_ = null;
    #executor_ = null;
    #observers_ = new Set();

    constructor() {
        this.#callbacks_ = new ScopedCallbacks();
        this.#callbacks_.addEventListener(
            'playercommandtext', CommandManager.prototype.onPlayerCommandText.bind(this));

        // The default permission delegate, which will be used when it's not been overridden with
        // a more advanced one by one of the features.
        this.#defaultPermissionDelegate_ = new DefaultPermissionDelegate();

        // The command executor, through which commands will actually be executed on the server.
        // Uses the context and permission delegates for figuring out what has to happen.
        this.#executor_ =
            new CommandExecutor(new DefaultContextDelegate(), this.#defaultPermissionDelegate_);
    }

    // ---------------------------------------------------------------------------------------------

    // Allows overriding the permission delegate with the given |delegate|. When the |delegate| is
    // NULL, the default delegate will be reinstated instead.
    setPermissionDelegate(delegate) {
        this.#executor_.setPermissionDelegate(delegate ? delegate
                                                       : this.#defaultPermissionDelegate_);
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the given |observer| to the list of observers to be informed of command execution.
    addObserver(observer) {
        if (!(observer instanceof CommandObserver))
            throw new Error(`Observers must be an instance of CommandObserver.`);

        this.#observers_.add(observer);
    }

    // Removes the given |observer| from the list of observers.
    removeObserver(observer) {
        this.#observers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------

    // Gets an iterator that provides access to all registered CommandDescription objects.
    get commands() { return this.#commands_.values(); }

    // Returns a command builder for a command with the given |name|. When building has completed,
    // the command will automatically be registered with the CommandManager.
    buildCommand(name) {
        return new CommandBuilder({
            listener: description => {
                if (this.#commands_.has(description.commandName))
                    throw new Error(`A command named "/${name}" has already been registered.`);

                this.#commands_.set(description.commandName, description);
            },

            name: name,
            prefix: '/',
        });
    }

    // Returns whether a server named |name| has been registered with the server.
    hasCommand(name) { return this.#commands_.has(name); }

    // Removes the command with the given |name| from the server.
    removeCommand(name) { this.#commands_.delete(name); }

    // Returns the CommandDescription instance for the given |command|, which may be one of the
    // sub-commands of a top-level command. Returns NULL when the |command| cannot be found.
    resolveCommand(command) {
        const result = this.findCommandDescription(command);
        if (!result.success)
            return null;

        // Resolve the sub-commands for the |result| in case the |command| includes those. Will
        // automatically fall back to the top-level command in case it doesn't.
        const commandList = this.#executor_.matchPossibleCommands(
            /* context= */ null, result.description, result.commandText);

        if (!commandList.length)
            throw new Error(`At least one command was expected in the returned command list.`);

        return commandList[0][0];
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player has issued a command. The |event| will be verified for its integrity and
    // once we're satisfied, will be executed using the CommandExecutor.
    onPlayerCommandText(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was issued for an invalid player, ignore it

        // (1) Find the CommandDescription instance for the given |event|. When it can't be found,
        // immediately bail out as the command won't be serviceable by JavaScript.
        const result = this.findCommandDescription(event.cmdtext);
        if (!result.success) {
            for (const observer of this.#observers_)
                observer.onUnknownCommandExecuted(player, `/${result.commandName}`);

            return null;
        }

        // (2) Mark the |event| as having been handled; no need to call through to Pawn.
        event.preventDefault();

        // (3) Execute the actual command |description| for the invoking |player|.
        return Promise.resolve().then(() => {
            return this.#executor_.executeCommand(player, result.description, result.commandText);
        }).then(({ description, success }) => {
            for (const observer of this.#observers_)
                observer.onCommandExecuted(player, description, success);

            return success;
        });
    }

    // Returns the { description, commandText } of the given |command|, as it's about to be executed
    // on the server. Will return NULL when the |command| cannot be found.
    findCommandDescription(command) {
        let separator = command.indexOf(' ');
        if (separator === -1)
            separator = command.length;

        const commandName = command.substr(1, separator - 1).toLowerCase();
        const commandText = command.substr(separator + 1).trim();

        // Find the top-level CommandDescription that's associated with the given |command|.
        const description = this.#commands_.get(commandName);
        if (!description)
            return { success: false, commandName };  // the |commandName| does not exist

        return { success: true, description, commandText: (commandText || '').trim() };
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#callbacks_.dispose();
        this.#callbacks_ = null;

        this.#commands_.clear();
        this.#commands_ = null;

        this.#defaultPermissionDelegate_ = null;
        this.#executor_ = null;
    }
}
