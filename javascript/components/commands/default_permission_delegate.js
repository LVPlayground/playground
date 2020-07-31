// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandPermissionDelegate } from 'components/commands/command_permission_delegate.js';

// Delegate that provides the default implementation of the permission delegate, and is responsible
// for verifying whether a particular player is allowed to execute a particular command.
export class DefaultPermissionDelegate extends CommandPermissionDelegate {
    // Returns whether the |context| has permission to execute the given |command|, which is an
    // instance of CommandDescription. When |verbose| is set, the implementation is expected to
    // share the details of any access error with the given |context|.
    canExecuteCommand(context, contextDelegate, command, verbose) {
        if (!command.restrictLevel)
            return true;

        let access = null;

        if (typeof command.restrictLevel === 'function') {
            access = command.restrictLevel(context);
        } else {
            access = command.restrictLevel <= contextDelegate.getLevel(context);
            if (access && command.restrictTemporary && context.levelIsTemporary)
                access = false;
        }

        if (!access && verbose) {
            const requiredLevel = this.textualRepresentationForLevel(command.restrictLevel);

            // Inform the |context| of the fact that they're not allowed to execute this command.
            context.sendMessage(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, requiredLevel);
        }

        return access;
    }
}
