// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandPermissionDelegate } from 'components/commands/command_permission_delegate.js';

// Implementation of the CommandPermissionDelegate specific to Nuwani. No means exist to be able to
// dynamically override command permissions for Nuwani-powered commands.
export class NuwaniPermissionDelegate extends CommandPermissionDelegate {
    // Returns whether the |context| has permission to execute the given |command|, which is an
    // instance of CommandDescription. We execute the access level check in here.
    canExecuteCommand(context, contextDelegate, command) {
        if (!command.restrictLevel)
            return true;

        return command.restrictLevel <= contextDelegate.getLevel(context);
    }
}
