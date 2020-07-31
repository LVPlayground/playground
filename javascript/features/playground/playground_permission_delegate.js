// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandPermissionDelegate } from 'components/commands/command_permission_delegate.js';

// Delegate that defers command permission access checking to the Playground feature, adding various
// abilities for overrides and exceptions on top of the generic command system.
export class PlaygroundPermissionDelegate extends CommandPermissionDelegate {
    constructor() {
        super();

        // Instate ourselves as the canonical permission delegate for commands on the server.
        server.commandManager.setPermissionDelegate(this);
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
    }
}
