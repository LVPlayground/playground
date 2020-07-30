// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { CommandExecutor } from 'components/commands/command_executor.js';
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
            prefix: '!',
        });
    }

    // Returns whether a server named |name| has been registered with the server.
    hasCommand(name) { return this.#commands_.has(name); }

    // Removes the command with the given |name| from the server.
    removeCommand(name) { this.#commands_.delete(name); }

    // ---------------------------------------------------------------------------------------------

    // Called when a player has issued a command. The |event| will be verified for its integrity and
    // once we're satisfied, will be executed using the CommandExecutor.
    onPlayerCommandText(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was issued for an invalid player, ignore it

        // TODO: Implement our own command handling.

        return server.deprecatedCommandManager.onPlayerCommandText(event);
    }

    dispose() {
        this.#callbacks_.dispose();
        this.#callbacks_ = null;

        this.#commands_.clear();
        this.#commands_ = null;

        this.#defaultPermissionDelegate_ = null;
        this.#executor_ = null;
    }
}
