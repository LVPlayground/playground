// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Delegate that is able to determine whether a certain player (or context) is able to execute a
// given command, based on their level, registration status and unique identifier.
export class CommandPermissionDelegate {
    // Returns whether the |context| has permission to execute the given |command|, which is an
    // instance of CommandDescription. The implementation is expected to issue a response to the
    // |context| when they are not allowed to execute the command.
    canExecuteCommand(context, contextDelegate, command) { return false; }
}
