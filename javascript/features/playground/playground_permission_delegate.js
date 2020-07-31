// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandPermissionDelegate } from 'components/commands/command_permission_delegate.js';

// Delegate that defers command permission access checking to the Playground feature, adding various
// abilities for overrides and exceptions on top of the generic command system.
export class PlaygroundPermissionDelegate extends CommandPermissionDelegate {
    #exceptions_ = null;

    constructor() {
        super();

        // Map from CommandDescription instance to { userId, nickname, expirationTime } objects.
        this.#exceptions_ = new Map();

        // Instate ourselves as the canonical permission delegate for commands on the server.
        server.commandManager.setPermissionDelegate(this);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: access exceptions
    // ---------------------------------------------------------------------------------------------

    // Adds an exception for the given |player| to use the given |command|.
    addException(player, command) {

    }

    // Gets an array with the players who have exceptions to use the given |command|.
    getExceptions(command) {
        return [];
    }

    // Returns whether the given |player| has an exception to execute the given |command|.
    hasException(player, command) {
        return false;
    }

    // Removes the previously created exception that allowed the |player| to use the |command|.
    removeException(player, command) {

    }

    // ---------------------------------------------------------------------------------------------
    // Section: access level amendments
    // ---------------------------------------------------------------------------------------------

    // Returns information about a command's access requirements { restrictLevel, originalLevel },
    // which includes whether the access level has been overridden by the system.
    getCommandLevel(command) {
        return {
            restrictLevel: command.restrictLevel,
            originalLevel: command.restrictLevel,
        };
    }

    // Changes the required level for |command| to the given |level|. This will automatically
    // release the override if it's being restored to the command's original leve;.
    setCommandLevel(command, level) {

    }

    // ---------------------------------------------------------------------------------------------
    // CommandPermissionDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| has permission to execute the given |command|, which is an
    // instance of CommandDescription. When |verbose| is set, the implementation is expected to
    // share the details of any access error with the given |player|.
    canExecuteCommand(player, _, command, verbose) {
        if (!command.restrictLevel)
            return true;

        let access = command.restrictLevel <= player.level;
        if (access && command.restrictTemporary && player.levelIsTemporary)
            access = false;

        if (!access && verbose) {
            const requiredLevel = this.textualRepresentationForLevel(command.restrictLevel);

            // Inform the |player| of the fact that they're not allowed to execute this command.
            player.sendMessage(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, requiredLevel);
        }

        return access;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.setPermissionDelegate(null);

        this.#exceptions_.clear();
    }
}
